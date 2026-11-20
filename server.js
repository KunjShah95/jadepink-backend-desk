const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/jadepink',
});

app.use(cors());
app.use(express.json());

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id'];
  const userRoles = req.headers['x-user-roles'] ? req.headers['x-user-roles'].split(',') : [];
  if (!userId) return res.status(401).json({ error: 'Authentication required' });
  req.user = { id: parseInt(userId), roles: userRoles };
  next();
}

function hasRole(role) {
  return (req, res, next) => {
    if (!req.user.roles.includes(role) && !req.user.roles.includes('Admin')) {
      return res.status(403).json({ error: `Role '${role}' required` });
    }
    next();
  };
}

async function logEvent(client, lotId, action, entity, entityId, before, after, text, userId) {
  await client.query(
    `INSERT INTO events (lot_id, action, entity, entity_id, before, after, text, by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [lotId, action, entity, entityId, JSON.stringify(before || {}), JSON.stringify(after || {}), text, userId]
  );
}

function generateLotNo() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `IN-${yy}${mm}${dd}-${rand}`;
}

// ============================================================================
// USERS
// ============================================================================
app.get('/api/users', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT id, name, phone, roles, active, created_at FROM users ORDER BY name');
  res.json(result.rows);
});

app.post('/api/users', requireAuth, hasRole('Admin'), async (req, res) => {
  const { name, phone, roles, active } = req.body;
  const result = await pool.query(
    'INSERT INTO users (name, phone, roles, active) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, phone, roles || [], active !== false]
  );
  res.status(201).json(result.rows[0]);
});

app.patch('/api/users/:id', requireAuth, hasRole('Admin'), async (req, res) => {
  const { id } = req.params;
  const { name, phone, roles, active } = req.body;
  const result = await pool.query(
    'UPDATE users SET name=$1, phone=$2, roles=$3, active=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
    [name, phone, roles, active, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

// ============================================================================
// LOOKUPS
// ============================================================================
app.get('/api/lookups', requireAuth, async (req, res) => {
  const { list_name } = req.query;
  if (list_name) {
    const result = await pool.query(
      'SELECT * FROM lookups WHERE list_name=$1 AND active=true ORDER BY sort_order',
      [list_name]
    );
    return res.json(result.rows);
  }
  const result = await pool.query('SELECT * FROM lookups WHERE active=true ORDER BY list_name, sort_order');
  res.json(result.rows);
});

// ============================================================================
// DESIGNERS
// ============================================================================
app.get('/api/designers', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM designers WHERE active=true ORDER BY name');
  res.json(result.rows);
});

app.post('/api/designers', requireAuth, hasRole('Admin'), async (req, res) => {
  const result = await pool.query(
    `INSERT INTO designers (name, legal_name, gst_reg, gst_no, pan, alpha_vendor_code, whatsapp_group)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.body.name, req.body.legal_name, req.body.gst_reg, req.body.gst_no, req.body.pan, req.body.alpha_vendor_code, req.body.whatsapp_group]
  );
  res.status(201).json(result.rows[0]);
});

// ============================================================================
// LOTS — List
// ============================================================================
app.get('/api/lots', requireAuth, async (req, res) => {
  const { designer } = req.query;
  let query = 'SELECT * FROM lots WHERE 1=1';
  const params = [];
  let idx = 1;
  if (designer) {
    query += ` AND designer ILIKE $${idx++}`;
    params.push(`%${designer}%`);
  }
  query += ` ORDER BY created_at DESC`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

app.get('/api/lots/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const lot = await pool.query('SELECT * FROM lots WHERE id=$1', [id]);
  if (lot.rows.length === 0) return res.status(404).json({ error: 'Lot not found' });

  const checks = await pool.query('SELECT * FROM lot_checks WHERE lot_id=$1 ORDER BY stage, item_key', [id]);
  const gates = await pool.query('SELECT * FROM lot_gates WHERE lot_id=$1 ORDER BY stage', [id]);
  const approvals = await pool.query('SELECT * FROM lot_approvals WHERE lot_id=$1 ORDER BY at DESC', [id]);
  const queries = await pool.query('SELECT * FROM lot_queries WHERE lot_id=$1 ORDER BY at DESC', [id]);
  const photos = await pool.query('SELECT * FROM lot_photos WHERE lot_id=$1 ORDER BY at DESC', [id]);
  const pieces = await pool.query('SELECT * FROM pieces WHERE lot_id=$1 ORDER BY idx', [id]);

  res.json({
    ...lot.rows[0],
    checks: checks.rows,
    gates: gates.rows,
    approvals: approvals.rows,
    queries: queries.rows,
    photos: photos.rows,
    pieces: pieces.rows
  });
});

// ============================================================================
// LOTS — Create (Stage 1: parcel receipt)
// ============================================================================
app.post('/api/lots', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = req.user.id;

    const {
      designer, courier, tracking, boxes, stockType, condition: condition_,
      expected: expected_, poRef, upcomingId, blindCount, challanQty, poQty,
      diffNote, tagsMatch
    } = req.body;

    const lotNo = generateLotNo();

    const lotResult = await client.query(
      `INSERT INTO lots (lot_no, created_by, designer, courier, tracking, boxes, stock_type, condition_, expected_, po_ref, upcoming_id, blind_count, challan_qty, po_qty, diff_note, tags_match)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
      [lotNo, userId, designer, courier, tracking, boxes, stockType, condition_, expected_, poRef, upcomingId, blindCount, challanQty, poQty, diffNote, tagsMatch]
    );

    const lotId = lotResult.rows[0].id;

    if (upcomingId) {
      await client.query('UPDATE upcoming SET status=$1, lot_id=$2, received_at=NOW() WHERE id=$3', ['received', lotId, upcomingId]);
    }

    await logEvent(client, lotId, 'created', 'lot', lotNo, null, { lotNo, designer }, 'Parcel received', userId);

    await client.query('COMMIT');
    res.status(201).json({ id: lotId, lotNo });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ============================================================================
// LOT CHECKS — tick/untick checklist line
// ============================================================================
app.post('/api/lots/:lotId/checks', requireAuth, async (req, res) => {
  const { lotId } = req.params;
  const { stage, itemKey } = req.body;
  const userId = req.user.id;

  const existing = await pool.query('SELECT id FROM lot_checks WHERE lot_id=$1 AND stage=$2 AND item_key=$3', [lotId, stage, itemKey]);
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'Check already exists' });
  }

  await pool.query(
    'INSERT INTO lot_checks (lot_id, stage, item_key, by) VALUES ($1,$2,$3,$4)',
    [lotId, stage, itemKey, userId]
  );

  const lot = await pool.query('SELECT lot_no FROM lots WHERE id=$1', [lotId]);
  await pool.query(
    `INSERT INTO events (lot_id, action, entity, entity_id, text, by)
     VALUES ($1,'check_tick','lot_check',$2,'Ticked check: $3', $4)`,
    [lotId, lotId, itemKey, userId]
  );

  res.status(201).json({ ok: true });
});

app.delete('/api/lots/:lotId/checks', requireAuth, async (req, res) => {
  const { lotId } = req.params;
  const { stage, itemKey } = req.query;
  const userId = req.user.id;

  const result = await pool.query(
    'DELETE FROM lot_checks WHERE lot_id=$1 AND stage=$2 AND item_key=$3 RETURNING id',
    [lotId, stage, itemKey]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Check not found' });

  res.json({ ok: true });
});

// ============================================================================
// LOT GATES — pass/reopen gate
// ============================================================================
app.post('/api/lots/:lotId/gates', requireAuth, async (req, res) => {
  const { lotId } = req.params;
  const { stage, test } = req.body;
  const userId = req.user.id;

  const existing = await pool.query('SELECT id FROM lot_gates WHERE lot_id=$1 AND stage=$2', [lotId, stage]);
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'Gate already passed' });
  }

  await pool.query(
    'INSERT INTO lot_gates (lot_id, stage, by, test) VALUES ($1,$2,$3,$4)',
    [lotId, stage, userId, test || false]
  );

  const lot = await pool.query('SELECT lot_no FROM lots WHERE id=$1', [lotId]);
  await pool.query(
    `INSERT INTO events (lot_id, action, entity, entity_id, text, by)
     VALUES ($1,'gate_pass','lot_gate',$2,'Passed gate: $3', $4)`,
    [lotId, lotId, stage, userId]
  );

  res.status(201).json({ ok: true });
});

// ============================================================================
// LOT QUERIES — HO question to merchandiser
// ============================================================================
app.post('/api/lots/:lotId/queries', requireAuth, async (req, res) => {
  const { lotId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  const result = await pool.query(
    'INSERT INTO lot_queries (lot_id, text, by) VALUES ($1,$2,$3) RETURNING id',
    [lotId, text, userId]
  );

  await pool.query(
    `INSERT INTO events (lot_id, action, entity, entity_id, text, by)
     VALUES ($1,'query_add','lot_query',$2,'HO query added', $3)`,
    [lotId, lotId, userId]
  );

  res.status(201).json({ id: result.rows[0].id });
});

app.patch('/api/lots/:lotId/queries/:queryId/answer', requireAuth, async (req, res) => {
  const { lotId, queryId } = req.params;
  const { answer } = req.body;
  const userId = req.user.id;

  const result = await pool.query(
    `UPDATE lot_queries SET status='answered', answer=$1, answered_by=$2, answered_at=NOW()
     WHERE id=$3 AND lot_id=$4 RETURNING id`,
    [answer, userId, queryId, lotId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Query not found' });

  res.json({ ok: true });
});

// ============================================================================
// LOT PHOTOS — upload box photo
// ============================================================================
app.post('/api/lots/:lotId/photos', requireAuth, async (req, res) => {
  const { lotId } = req.params;
  const { assetId } = req.body;
  const userId = req.user.id;

  await pool.query(
    'INSERT INTO lot_photos (asset_id, lot_id, by) VALUES ($1,$2,$3)',
    [assetId, lotId, userId]
  );

  res.status(201).json({ ok: true });
});

// ============================================================================
// PIECES — create pieces for a lot
// ============================================================================
app.post('/api/lots/:lotId/pieces', requireAuth, async (req, res) => {
  const { lotId } = req.params;
  const { pieces } = req.body;
  const userId = req.user.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const inserted = [];

    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i];
      const lot = await client.query('SELECT lot_no FROM lots WHERE id=$1', [lotId]);
      const lotNo = lot.rows[0].lot_no;
      const pieceId = `${lotNo}-${p.idx}`;

      await client.query(
        `INSERT INTO pieces (id, lot_id, idx, style_code, product, colour, size, tag_mrp, category, hsn, gst_pct, cost, margin)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [pieceId, lotId, p.idx, p.style_code, p.product, p.colour, p.size, p.tag_mrp, p.category, p.hsn, p.gst_pct, p.cost, p.margin]
      );

      inserted.push(pieceId);
    }

    await client.query('COMMIT');
    res.status(201).json({ count: inserted.length, ids: inserted });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ============================================================================
// PIECES — QC accept/reject
// ============================================================================
app.patch('/api/pieces/:pieceId/qc', requireAuth, async (req, res) => {
  const { pieceId } = req.params;
  const { qc, rejectReason } = req.body;
  const userId = req.user.id;

  const piece = await pool.query('SELECT lot_id FROM pieces WHERE id=$1', [pieceId]);
  if (piece.rows.length === 0) return res.status(404).json({ error: 'Piece not found' });

  await pool.query(
    'UPDATE pieces SET qc=$1, reject_reason=$2 WHERE id=$3',
    [qc, rejectReason, pieceId]
  );

  await pool.query(
    `INSERT INTO events (lot_id, action, entity, entity_id, text, by)
     VALUES ($1,'qc_update','piece',$2,'QC: $3', $4)`,
    [piece.rows[0].lot_id, pieceId, qc, userId]
  );

  res.json({ ok: true });
});


// ============================================================================
// PIECES — tag scan
// ============================================================================
app.patch('/api/pieces/:pieceId/tag', requireAuth, async (req, res) => {
  const { pieceId } = req.params;
  const { barcode, tagDest } = req.body;
  const userId = req.user.id;

  const piece = await pool.query('SELECT lot_id FROM pieces WHERE id=$1', [pieceId]);
  if (piece.rows.length === 0) return res.status(404).json({ error: 'Piece not found' });

  await pool.query(
    'UPDATE pieces SET barcode=$1, tag_scanned=true, tag_dest=$2 WHERE id=$3',
    [barcode, tagDest, pieceId]
  );

  await pool.query(
    'UPDATE pieces SET state=$1 WHERE id=$2',
    ['tagged', pieceId]
  );

  await pool.query(
    `INSERT INTO events (lot_id, action, entity, entity_id, text, by)
     VALUES ($1,'tag_scan','piece',$2,'Tag scanned: $3', $4)`,
    [piece.rows[0].lot_id, pieceId, barcode, userId]
  );

  res.json({ ok: true });
});

// ============================================================================
// HOLDS — create/list
// ============================================================================
app.get('/api/holds', requireAuth, async (req, res) => {
  const { status, sev, pieceId } = req.query;
  let query = 'SELECT h.*, p.idx as piece_idx, l.lot_no FROM holds h LEFT JOIN pieces p ON h.piece_id = p.id LEFT JOIN lots l ON h.lot_id = l.id WHERE 1=1';
  const params = [];
  let idx = 1;
  if (status) { query += ` AND h.status=$${idx++}`; params.push(status); }
  if (sev) { query += ` AND h.sev=$${idx++}`; params.push(sev); }
  if (pieceId) { query += ` AND h.piece_id=$${idx++}`; params.push(pieceId); }
  query += ` ORDER BY h.at DESC`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

app.post('/api/holds', requireAuth, async (req, res) => {
  const { lotId, pieceId, error, errKey, homeStage, sev, note } = req.body;
  const userId = req.user.id;

  const result = await pool.query(
    `INSERT INTO holds (lot_id, piece_id, error, err_key, home_stage, sev, note, by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [lotId, pieceId, error, errKey, homeStage, sev, note, userId]
  );

  if (sev === 'A' && pieceId) {
    await pool.query('UPDATE pieces SET state=$1, hold_id=$2 WHERE id=$3', ['on_hold', result.rows[0].id, pieceId]);
  }

  await pool.query(
    `INSERT INTO events (lot_id, action, entity, entity_id, text, by)
     VALUES ($1,'hold_create','hold',$2,'Hold created: $3 (sev $4)', $5)`,
    [lotId, result.rows[0].id, error, sev, userId]
  );

  res.status(201).json(result.rows[0]);
});

app.patch('/api/holds/:id/resolve', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status, outcome, fix } = req.body;
  const userId = req.user.id;

  const hold = await pool.query('SELECT piece_id, lot_id FROM holds WHERE id=$1', [id]);
  if (hold.rows.length === 0) return res.status(404).json({ error: 'Hold not found' });

  await pool.query(
    `UPDATE holds SET status=$1, outcome=$2, fix=$3, fix_by=$4, fix_at=NOW() WHERE id=$5`,
    [status, outcome, fix, userId, id]
  );

  if (status === 'resolved' && hold.rows[0].piece_id) {
    await pool.query('UPDATE pieces SET state=$1, hold_id=NULL WHERE id=$2', ['accepted', hold.rows[0].piece_id]);
  }

  res.json({ ok: true });
});

// ============================================================================
// UPCOMING — parcels expected
// ============================================================================
app.get('/api/upcoming', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM upcoming ORDER BY expected_date');
  res.json(result.rows);
});

app.post('/api/upcoming', requireAuth, async (req, res) => {
  const { designer, expectedDate, boxes, pieces, courier, tracking, poRef, source } = req.body;
  const userId = req.user.id;

  const result = await pool.query(
    `INSERT INTO upcoming (designer, expected_date, boxes, pieces, courier, tracking, po_ref, source, added_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [designer, expectedDate, boxes, pieces, courier, tracking, poRef, source || 'manual', userId]
  );
  res.status(201).json(result.rows[0]);
});

// ============================================================================
// EVENTS — audit log
// ============================================================================
app.get('/api/events', requireAuth, async (req, res) => {
  const { lotId } = req.query;
  let query = 'SELECT e.*, u.name as user_name FROM events e LEFT JOIN users u ON e.by = u.id WHERE 1=1';
  const params = [];
  let idx = 1;
  if (lotId) { query += ` AND e.lot_id=$${idx++}`; params.push(lotId); }
  query += ` ORDER BY e.at DESC LIMIT 200`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

// ============================================================================
// DAILY CLOSE
// ============================================================================
app.get('/api/dailyclose', requireAuth, async (req, res) => {
  const { date } = req.query;
  const q = date ? 'SELECT * FROM daily_close WHERE date=$1' : 'SELECT * FROM daily_close ORDER BY date DESC LIMIT 30';
  const params = date ? [date] : [];
  const result = await pool.query(q, params);
  res.json(result.rows);
});

app.post('/api/dailyclose', requireAuth, hasRole('Admin'), async (req, res) => {
  const { date, locations, systemQty, scannedQty, openNotes, holdShelf, manager, notes } = req.body;
  const userId = req.user.id;

  const result = await pool.query(
    `INSERT INTO daily_close (date, locations, system_qty, scanned_qty, open_notes, hold_shelf, manager, notes, by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (date) DO UPDATE SET
       locations=EXCLUDED.locations, system_qty=EXCLUDED.system_qty, scanned_qty=EXCLUDED.scanned_qty,
       open_notes=EXCLUDED.open_notes, hold_shelf=EXCLUDED.hold_shelf, manager=EXCLUDED.manager,
       notes=EXCLUDED.notes, by=EXCLUDED.by, at=NOW()
     RETURNING *`,
    [date, JSON.stringify(locations), systemQty, scannedQty, openNotes, holdShelf, manager, notes, userId]
  );
  res.json(result.rows[0]);
});

// ============================================================================
// SETTINGS
// ============================================================================
app.get('/api/settings', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM settings WHERE id=1');
  if (result.rows.length === 0) {
    await pool.query('INSERT INTO settings (id, box_count) VALUES (1, 20) RETURNING *');
    return res.json({ id: 1, box_count: 20 });
  }
  res.json(result.rows[0]);
});

app.patch('/api/settings', requireAuth, hasRole('Admin'), async (req, res) => {
  const { boxCount } = req.body;
  const userId = req.user.id;
  const result = await pool.query(
    'UPDATE settings SET box_count=$1, updated_by=$2, updated_at=NOW() WHERE id=1 RETURNING *',
    [boxCount, userId]
  );
  res.json(result.rows[0]);
});

// ============================================================================
// STATIC (built client)
// ============================================================================
app.use(express.static(path.join(__dirname, 'client', 'dist')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// ============================================================================
// ERROR HANDLER
// ============================================================================
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: (err && err.message) || 'Internal server error' });
});

// ============================================================================
// START SERVER
// ============================================================================
app.listen(PORT, () => {
  console.log(`Jade Pink Backend Desk API listening on port ${PORT}`);
});

// ============================================================================
// PIECES — location / put-away
// ============================================================================
app.patch('/api/pieces/:pieceId/location', requireAuth, async (req, res) => {
  const { pieceId } = req.params;
  const { location } = req.body;
  const userId = req.user.id;

  const piece = await pool.query('SELECT lot_id, state FROM pieces WHERE id=$1', [pieceId]);
  if (piece.rows.length === 0) return res.status(404).json({ error: 'Piece not found' });

  let newState = piece.rows[0].state;
  if (location.startsWith('RACK') || location.startsWith('R01')) newState = 'stored';
  if (location.startsWith('M0')) newState = 'on_floor';

  await pool.query(
    'UPDATE pieces SET location=$1, stored_at=NOW(), state=$2 WHERE id=$3',
    [location, newState, pieceId]
  );

  await pool.query(
    `INSERT INTO events (lot_id, action, entity, entity_id, text, by)
     VALUES ($1,'location_update','piece',$2,'Moved to: $3', $4)`,
    [piece.rows[0].lot_id, pieceId, location, userId]
  );

  res.json({ ok: true });
});
app.delete('/api/lots/:lotId/gates', requireAuth, async (req, res) => {
  const { lotId } = req.params;
  const { stage } = req.query;

  const result = await pool.query(
    'DELETE FROM lot_gates WHERE lot_id=$1 AND stage=$2 RETURNING id',
    [lotId, stage]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Gate not found' });

  res.json({ ok: true });
});

// ============================================================================
// LOT APPROVALS — add/withdraw approval
// ============================================================================
app.post('/api/lots/:lotId/approvals', requireAuth, async (req, res) => {
  const { lotId } = req.params;
  const { kind, approver, note } = req.body;
  const userId = req.user.id;

  await pool.query(
    'INSERT INTO lot_approvals (lot_id, kind, approver, note, by) VALUES ($1,$2,$3,$4,$5)',
    [lotId, kind, approver, note, userId]
  );

  await pool.query(
    `INSERT INTO events (lot_id, action, entity, entity_id, text, by)
     VALUES ($1,'approval_add','lot_approval',$2,'Approval added: $3 by $4', $5)`,
    [lotId, lotId, kind, approver, userId]
  );

  res.status(201).json({ ok: true });
});

app.delete('/api/lots/:lotId/approvals', requireAuth, async (req, res) => {
  const { lotId } = req.params;
  const { kind } = req.query;

  const result = await pool.query(
    'DELETE FROM lot_approvals WHERE lot_id=$1 AND kind=$2 RETURNING id',
    [lotId, kind]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Approval not found' });

  res.json({ ok: true });
});