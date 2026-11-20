// ============================================================================
// Jade Pink Backend Desk — Supabase Frontend
// ============================================================================

// Supabase configuration (set these in your environment)
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

let supabase = null;
let currentUser = null;
let profiles = [];
let lookups = {};

async function init() {
  // Initialize Supabase client (loaded via CDN as window.supabase)
  const { createClient } = window.supabase;
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      currentUser = session.user;
      loadProfile(currentUser.id);
    } else {
      currentUser = null;
      document.getElementById('userSelect').innerHTML = '<option value="">— Sign In —</option>';
      document.getElementById('userRole').textContent = '';
    }
  });

  // Try to restore session
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadProfile(currentUser.id);
  }

  await loadLookups();
  renderUserSelect();
  setupNavigation();
  loadDashboard();
  setupForms();
  setupStage1();
  setupStage2();
  setupStage3();
  setupStage4();
  setupStage5();
  setupStage6();
  setupStage7();
  setupStage8();
  setupHolds();
  setupDailyClose();
  setupSetup();
}

async function loadProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (data && !error) {
    currentUser = { ...currentUser, ...data };
    document.getElementById('userRole').textContent = currentUser
      ? `(${currentUser.roles.join(', ')})` : '';
  }
}

async function loadLookups() {
  const { data, error } = await supabase
    .from('lookups')
    .select('*')
    .eq('active', true)
    .order('list_name')
    .order('sort_order');

  if (data && !error) {
    lookups = {};
    for (const item of data) {
      if (!lookups[item.list_name]) lookups[item.list_name] = [];
      lookups[item.list_name].push(item);
    }
  }
}

function fillSelect(sel, listName, emptyLabel = '— Select —') {
  const items = lookups[listName] || [];
  sel.innerHTML = `<option value="">${emptyLabel}</option>`;
  for (const it of items) {
    const o = document.createElement('option');
    o.value = it.value;
    o.textContent = it.label;
    sel.appendChild(o);
  }
}

function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      const screen = document.getElementById('screen-' + btn.dataset.screen);
      if (screen) screen.classList.add('active');
      if (btn.dataset.screen === 'dashboard') loadDashboard();
      if (btn.dataset.screen === 'holds') loadHolds();
      if (btn.dataset.screen === 'setup') loadSetup();
    });
  });
}

async function loadDashboard() {
  if (!supabase) return;
  const { data: lots, error } = await supabase
    .from('lots')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error(error); return; }

  const today = new Date().toISOString().slice(0, 10);
  const todayLots = lots.filter(l => l.created_at.slice(0, 10) === today);
  document.getElementById('statLots').textContent = todayLots.length;

  const { data: holds } = await supabase
    .from('holds')
    .select('*')
    .eq('status', 'open');
  document.getElementById('statHolds').textContent = holds?.length || 0;

  const tb = document.getElementById('recentLotsTable').querySelector('tbody');
  tb.innerHTML = '';
  for (const l of (lots || []).slice(0, 10)) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${l.lot_no}</td><td>${l.designer}</td><td>${l.closed_at ? 'Closed' : 'Open'}</td><td>${l.closed_at ? 'Closed' : 'Active'}</td><td>${new Date(l.created_at).toLocaleString()}</td>`;
    tb.appendChild(tr);
  }
}

async function loadAllLotSelects() {
  const { data: lots } = await supabase
    .from('lots')
    .select('id, lot_no, designer')
    .order('created_at', { ascending: false });

  const selIds = ['stage2LotSelect','stage3LotSelect','stage4LotSelect','stage5LotSelect','stage6LotSelect','stage7LotSelect','stage8LotSelect'];
  for (const sid of selIds) {
    const sel = document.getElementById(sid);
    if (!sel) continue;
    sel.innerHTML = '<option value="">— Select Lot —</option>';
    for (const l of (lots || [])) {
      const o = document.createElement('option');
      o.value = l.id;
      o.textContent = l.lot_no + ' — ' + l.designer;
      sel.appendChild(o);
    }
  }
}

// ============================================================================
// Forms
// ============================================================================
function setupForms() {
  // Stage 1 form
  const form1 = document.getElementById('formStage1');
  if (form1) {
    form1.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = {
        designer: fd.get('designer'),
        courier: fd.get('courier'),
        tracking: fd.get('tracking'),
        boxes: parseInt(fd.get('boxes')),
        stockType: fd.get('stockType'),
        condition: fd.get('condition'),
        expected: fd.get('expected'),
        poRef: fd.get('poRef'),
        upcomingId: fd.get('upcomingId') || null,
        blindCount: 0,
        challanQty: 0,
        poQty: 0,
        diffNote: null,
        tagsMatch: 'All tags match the agreed price',
        by: currentUser?.id
      };

      // Call Edge Function to create lot
      const { data, error } = await supabase.functions.invoke('create-lot', { body });
      if (error) { alert('Error: ' + error.message); return; }
      if (data.error) { alert('Error: ' + data.error); return; }

      alert('Lot created: ' + data.lotNo);
      e.target.reset();
      loadDashboard();
      loadAllLotSelects();
    });
  }

  // Daily close form
  const formClose = document.getElementById('formDailyClose');
  if (formClose) {
    formClose.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = {
        date: fd.get('date'),
        systemQty: parseInt(fd.get('systemQty')) || 0,
        scannedQty: parseInt(fd.get('scannedQty')) || 0,
        openNotes: fd.get('openNotes'),
        holdShelf: fd.get('holdShelf'),
        manager: parseInt(fd.get('managerId')),
        notes: fd.get('notes'),
        by: currentUser?.id
      };

      const { error } = await supabase
        .from('daily_close')
        .upsert(body, { onConflict: 'date' });
      if (error) { alert('Error: ' + error.message); return; }

      alert('Daily close saved');
      loadDashboard();
    });
  }

  // Box count
  const btnSaveBox = document.getElementById('btnSaveBoxCount');
  if (btnSaveBox) {
    btnSaveBox.addEventListener('click', async () => {
      const boxCount = document.getElementById('settingBoxCount').value;
      const { error } = await supabase
        .from('settings')
        .upsert({ id: 1, box_count: parseInt(boxCount), updated_by: currentUser?.id, updated_at: new Date().toISOString() });
      if (error) { alert('Error: ' + error.message); return; }
      alert('Box count saved');
    });
  }
}

// ============================================================================
// Stage 1: Parcel Receipt
// ============================================================================
function setupStage1() {
  const sel = document.querySelector('#formStage1 select[name="stockType"]');
  if (sel) fillSelect(sel, 'stock_type');
  const sel2 = document.querySelector('#formStage1 select[name="condition"]');
  if (sel2) fillSelect(sel2, 'box_condition');
  const sel3 = document.querySelector('#formStage1 select[name="expected"]');
  if (sel3) fillSelect(sel3, 'expected');
  const sel4 = document.querySelector('#formStage1 select[name="upcomingId"]');
  if (sel4) {
    sel4.innerHTML = '<option value="">— None —</option>';
    supabase.from('upcoming').select('*').eq('status', 'expected').then(({ data }) => {
      for (const u of (data || [])) {
        const o = document.createElement('option');
        o.value = u.id;
        o.textContent = u.designer + ' (' + u.expected_date + ')';
        sel4.appendChild(o);
      }
    });
  }
}

// ============================================================================
// Stage 2: QC & Price Hold
// ============================================================================
function setupStage2() {
  window.loadStage2 = async (lotId) => {
    const el = document.getElementById('stage2Content');
    el.innerHTML = 'Loading...';
    const { data: lot } = await supabase.from('lots').select('*').eq('id', lotId).single();
    if (!lot) { el.innerHTML = 'Lot not found'; return; }

    let html = `<h3>${lot.lot_no} — ${lot.designer}</h3>`;
    html += `<p>Blind Count: <input type="number" id="s2_blindCount" value="${lot.blind_count||0}"></p>`;
    html += `<p>Challan Qty: <input type="number" id="s2_challanQty" value="${lot.challan_qty||0}"></p>`;
    html += `<p>PO Qty: <input type="number" id="s2_poQty" value="${lot.po_qty||0}"></p>`;
    html += `<p>Tags Match: <select id="s2_tagsMatch"><option>All tags match the agreed price</option><option>Some tags do not match</option></select></p>`;
    html += `<p>Diff Note: <input type="text" id="s2_diffNote" placeholder="Required if counts differ"></p>`;
    html += `<button class="btn-primary" onclick="saveStage2('${lotId}')">Save Stage 2</button>`;
    el.innerHTML = html;
    document.getElementById('s2_tagsMatch').value = lot.tags_match || 'All tags match the agreed price';
    document.getElementById('s2_diffNote').value = lot.diff_note || '';
  };
}

window.saveStage2 = async (lotId) => {
  const body = {
    blind_count: parseInt(document.getElementById('s2_blindCount').value),
    challan_qty: parseInt(document.getElementById('s2_challanQty').value),
    po_qty: parseInt(document.getElementById('s2_poQty').value),
    diff_note: document.getElementById('s2_diffNote').value || null,
    tags_match: document.getElementById('s2_tagsMatch').value,
  };
  const { error } = await supabase.from('lots').update(body).eq('id', lotId);
  if (error) { alert('Error: ' + error.message); return; }
  alert('Stage 2 saved');
};

// ============================================================================
// Stage 3: Ironing Count
// ============================================================================
function setupStage3() {
  window.loadStage3 = async (lotId) => {
    const el = document.getElementById('stage3Content');
    el.innerHTML = 'Loading...';
    const { data: lot } = await supabase.from('lots').select('*').eq('id', lotId).single();
    if (!lot) { el.innerHTML = 'Lot not found'; return; }

    let html = `<h3>${lot.lot_no} — ${lot.designer}</h3>`;
    html += `<p>Iron Count: <input type="number" id="s3_ironCount" value="${lot.iron_count||0}"></p>`;
    html += `<button class="btn-primary" onclick="saveStage3('${lotId}')">Save Stage 3</button>`;
    el.innerHTML = html;
    document.getElementById('s3_ironCount').value = lot.iron_count || 0;
  };
}

window.saveStage3 = async (lotId) => {
  const { error } = await supabase
    .from('lots')
    .update({ iron_count: parseInt(document.getElementById('s3_ironCount').value) })
    .eq('id', lotId);
  if (error) { alert('Error: ' + error.message); return; }
  alert('Stage 3 saved');
};

// ============================================================================
// Stage 4: Tagging & Inward
// ============================================================================
function setupStage4() {
  window.loadStage4 = async (lotId) => {
    const el = document.getElementById('stage4Content');
    el.innerHTML = 'Loading...';
    const { data: lot } = await supabase.from('lots').select('*').eq('id', lotId).single();
    if (!lot) { el.innerHTML = 'Lot not found'; return; }

    let html = `<h3>${lot.lot_no} — ${lot.designer}</h3>`;
    html += `<p>Tag Count: <input type="number" id="s4_tagCount" value="${lot.tag_count||0}"></p>`;
    html += `<p>Tag Dest: <select id="s4_tagDest"><option>Floor</option><option>Storeroom</option></select></p>`;
    html += `<p>HO Done By: <select id="s4_hoDoneBy"></select></p>`;
    html += `<button class="btn-primary" onclick="saveStage4('${lotId}')">Save Stage 4</button>`;
    el.innerHTML = html;
    document.getElementById('s4_tagCount').value = lot.tag_count || 0;
    document.getElementById('s4_tagDest').value = lot.tag_dest || 'Floor';

    const { data: profiles } = await supabase.from('profiles').select('*');
    const hoUsers = (profiles || []).filter(p => p.roles && p.roles.includes('HO team'));
    const s4sel = document.getElementById('s4_hoDoneBy');
    s4sel.innerHTML = '';
    for (const u of hoUsers) {
      const o = document.createElement('option');
      o.value = u.id;
      o.textContent = u.name;
      s4sel.appendChild(o);
    }
    document.getElementById('s4_hoDoneBy').value = lot.ho_done_by || '';
  };
}

window.saveStage4 = async (lotId) => {
  const body = {
    tag_count: parseInt(document.getElementById('s4_tagCount').value),
    tag_dest: document.getElementById('s4_tagDest').value,
    ho_done_by: document.getElementById('s4_hoDoneBy').value || null,
    ho_done_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('lots').update(body).eq('id', lotId);
  if (error) { alert('Error: ' + error.message); return; }
  alert('Stage 4 saved');
};

// ============================================================================
// Stage 5: Display
// ============================================================================
function setupStage5() {
  window.loadStage5 = async (lotId) => {
    const el = document.getElementById('stage5Content');
    el.innerHTML = 'Loading...';
    const { data: lot } = await supabase.from('lots').select('*').eq('id', lotId).single();
    if (!lot) { el.innerHTML = 'Lot not found'; return; }

    let html = `<h3>${lot.lot_no} — ${lot.designer}</h3>`;
    html += `<p>Display Start: <input type="date" id="s5_displayStart" value="${lot.display_start||''}"></p>`;
    html += `<p>Review Date: <input type="date" id="s5_reviewDate" value="${lot.review_date||''}"></p>`;
    html += `<button class="btn-primary" onclick="saveStage5('${lotId}')">Save Stage 5</button>`;
    el.innerHTML = html;
    document.getElementById('s5_displayStart').value = lot.display_start || '';
    document.getElementById('s5_reviewDate').value = lot.review_date || '';
  };
}

window.saveStage5 = async (lotId) => {
  const body = {
    display_start: document.getElementById('s5_displayStart').value,
    review_date: document.getElementById('s5_reviewDate').value,
  };
  const { error } = await supabase.from('lots').update(body).eq('id', lotId);
  if (error) { alert('Error: ' + error.message); return; }
  alert('Stage 5 saved');
};

// ============================================================================
// Stage 6: Designer Accept / Review
// ============================================================================
function setupStage6() {
  window.loadStage6 = async (lotId) => {
    const el = document.getElementById('stage6Content');
    el.innerHTML = 'Loading...';
    const { data: lot } = await supabase.from('lots').select('*').eq('id', lotId).single();
    if (!lot) { el.innerHTML = 'Lot not found'; return; }

    let html = `<h3>${lot.lot_no} — ${lot.designer}</h3>`;
    html += `<p>Designer Accept: <button class="btn-primary" onclick="acceptDesigner('${lotId}')">Accept</button> <button class="btn-primary" onclick="reviewOrExtend('${lotId}')">Review / Extend</button></p>`;
    el.innerHTML = html;
  };
}

window.acceptDesigner = async (lotId) => {
  const { error } = await supabase
    .from('lots')
    .update({ designer_accept_at: new Date().toISOString() })
    .eq('id', lotId);
  if (error) { alert('Error: ' + error.message); return; }
  alert('Designer accepted');
};

window.reviewOrExtend = (lotId) => {
  const action = prompt('Enter action: "review" or "extend"');
  if (action === 'extend') {
    alert('Display extended — Stage 6 returns to start');
  } else {
    alert('Review noted');
  }
};

// ============================================================================
// Stage 7: RTV
// ============================================================================
function setupStage7() {
  window.loadStage7 = async (lotId) => {
    const el = document.getElementById('stage7Content');
    el.innerHTML = 'Loading...';
    const { data: lot } = await supabase.from('lots').select('*').eq('id', lotId).single();
    if (!lot) { el.innerHTML = 'Lot not found'; return; }

    let html = `<h3>${lot.lot_no} — ${lot.designer}</h3>`;
    html += `<p>RTV Box: <input type="text" id="s7_rtvBox" value="${lot.rtv_box||''}"></p>`;
    html += `<p>RTV No: <input type="text" id="s7_rtvNo" value="${lot.rtv_no||''}"></p>`;
    html += `<p>RTV Challan: <input type="text" id="s7_rtvChallan" value="${lot.rtv_challan||''}"></p>`;
    html += `<p>RTV Courier: <input type="text" id="s7_rtvCourier" value="${lot.rtv_courier||''}"></p>`;
    html += `<p>RTV Tracking: <input type="text" id="s7_rtvTracking" value="${lot.rtv_tracking||''}"></p>`;
    html += `<p>Ack Count: <input type="number" id="s7_ackCount" value="${lot.ack_count||0}"></p>`;
    html += `<button class="btn-primary" onclick="saveStage7('${lotId}')">Save Stage 7</button>`;
    el.innerHTML = html;
  };
}

window.saveStage7 = async (lotId) => {
  const body = {
    rtv_box: document.getElementById('s7_rtvBox').value,
    rtv_no: document.getElementById('s7_rtvNo').value,
    rtv_challan: document.getElementById('s7_rtvChallan').value,
    rtv_courier: document.getElementById('s7_rtvCourier').value,
    rtv_tracking: document.getElementById('s7_rtvTracking').value,
    ack_count: parseInt(document.getElementById('s7_ackCount').value),
    ack_date: new Date().toISOString().slice(0, 10),
  };
  const { error } = await supabase.from('lots').update(body).eq('id', lotId);
  if (error) { alert('Error: ' + error.message); return; }
  alert('Stage 7 saved');
};

// ============================================================================
// Stage 8: Settlement
// ============================================================================
function setupStage8() {
  window.loadStage8 = async (lotId) => {
    const el = document.getElementById('stage8Content');
    el.innerHTML = 'Loading...';
    const { data: lot } = await supabase.from('lots').select('*').eq('id', lotId).single();
    if (!lot) { el.innerHTML = 'Lot not found'; return; }

    let html = `<h3>${lot.lot_no} — ${lot.designer}</h3>`;
    html += `<p>Sell Bill No: <input type="text" id="s8_sellBillNo" value="${lot.sell_bill_no||''}"></p>`;
    html += `<p>Pay Note: <input type="text" id="s8_payNote" value="${lot.pay_note||''}"></p>`;
    html += `<button class="btn-primary" onclick="saveStage8('${lotId}')">Save Stage 8</button>`;
    el.innerHTML = html;
  };
}

window.saveStage8 = async (lotId) => {
  const body = {
    sell_bill_no: document.getElementById('s8_sellBillNo').value,
    pay_note: document.getElementById('s8_payNote').value,
  };
  const { error } = await supabase.from('lots').update(body).eq('id', lotId);
  if (error) { alert('Error: ' + error.message); return; }
  alert('Stage 8 saved');
};

// ============================================================================
// Holds
// ============================================================================
async function loadHolds() {
  const { data: holds } = await supabase
    .from('holds')
    .select('*, pieces(*), lots(*)')
    .order('at', { ascending: false });

  const tb = document.getElementById('holdsTable').querySelector('tbody');
  tb.innerHTML = '';
  for (const h of (holds || [])) {
    const tr = document.createElement('tr');
    const pieceIdx = h.pieces && h.pieces.length > 0 ? h.pieces[0].idx : null;
    const lotNo = h.lots && h.lots.length > 0 ? h.lots[0].lot_no : '—';
    tr.innerHTML = `<td>#${h.id}</td><td>${lotNo}</td><td>${pieceIdx ? '#'+pieceIdx : '—'}</td><td>${h.error}</td><td>${h.sev}</td><td>${h.status}</td><td>${new Date(h.found_at).toLocaleDateString()}</td><td>${h.by}</td>`;
    tb.appendChild(tr);
  }

  const fsel = document.getElementById('holdFilter');
  fsel.innerHTML = '<option value="">Open</option><option>Resolved and noted</option>';
  const ssel = document.getElementById('holdSevFilter');
  ssel.innerHTML = '<option value="">All</option><option>A</option><option>B</option><option>C</option>';
}

// ============================================================================
// Daily Close
// ============================================================================
async function loadSetup() {
  const { data: users } = await supabase.from('profiles').select('*').order('name');
  const tb = document.getElementById('setupUsersTable').querySelector('tbody');
  tb.innerHTML = '';
  for (const u of (users || [])) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${u.name}</td><td>${u.phone}</td><td>${u.roles?.join(', ') || ''}</td><td>${u.active ? 'Yes' : 'No'}</td><td></td>`;
    tb.appendChild(tr);
  }
  const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).single();
  document.getElementById('settingBoxCount').value = settings?.box_count || 20;
}

// ============================================================================
// User select & lot selects
// ============================================================================
function renderUserSelect() {
  const sel = document.getElementById('userSelect');
  sel.innerHTML = '<option value="">— Select User —</option>';
  for (const u of profiles) {
    if (u.active) {
      const o = document.createElement('option');
      o.value = u.id;
      o.textContent = u.name;
      sel.appendChild(o);
    }
  }
  sel.addEventListener('change', async (e) => {
    const id = e.target.value;
    if (!id) { currentUser = null; document.getElementById('userRole').textContent = ''; return; }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
    currentUser = profile;
    document.getElementById('userRole').textContent = currentUser ? `(${currentUser.roles.join(', ')})` : '';
    loadDashboard();
    loadAllLotSelects();
  });
}

async function loadAllLotSelects() {
  const { data: lots } = await supabase.from('lots').select('id, lot_no, designer').order('created_at', { ascending: false });
  const selIds = ['stage2LotSelect','stage3LotSelect','stage4LotSelect','stage5LotSelect','stage6LotSelect','stage7LotSelect','stage8LotSelect'];
  for (const sid of selIds) {
    const sel = document.getElementById(sid);
    if (!sel) continue;
    sel.innerHTML = '<option value="">— Select Lot —</option>';
    for (const l of (lots || [])) {
      const o = document.createElement('option');
      o.value = l.id;
      o.textContent = l.lot_no + ' — ' + l.designer;
      sel.appendChild(o);
    }
  }
}

// ============================================================================
// Initialize
// ============================================================================
document.addEventListener('DOMContentLoaded', init);