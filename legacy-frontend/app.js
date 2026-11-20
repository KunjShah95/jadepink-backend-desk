const API = 'http://localhost:3001/api';
let currentUser = null;
let users = [];
let lookups = {};

async function init() {
  await loadUsers();
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

async function loadUsers() {
  const r = await fetch(`${API}/users`, { headers: authHeaders() });
  users = await r.json();
}

async function loadLookups() {
  const r = await fetch(`${API}/lookups`, { headers: authHeaders() });
  const list = await r.json();
  lookups = {};
  for (const item of list) {
    if (!lookups[item.list_name]) lookups[item.list_name] = [];
    lookups[item.list_name].push(item);
  }
}

function authHeaders() {
  if (!currentUser) return {};
  return { 'x-user-id': currentUser.id, 'x-user-roles': currentUser.roles.join(',') };
}

function renderUserSelect() {
  const sel = document.getElementById('userSelect');
  sel.innerHTML = '<option value="">— Select User —</option>';
  for (const u of users) {
    if (u.active) {
      const o = document.createElement('option'); o.value = u.id; o.textContent = u.name; sel.appendChild(o);
    }
  }
  sel.addEventListener('change', (e) => {
    const id = parseInt(e.target.value);
    currentUser = users.find(u => u.id === id);
    document.getElementById('userRole').textContent = currentUser ? `(${currentUser.roles.join(', ')})` : '';
    loadDashboard(); loadAllLotSelects();
  });
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
  const r = await fetch(`${API}/lots`, { headers: authHeaders() });
  const lots = await r.json();
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('statLots').textContent = lots.filter(l => l.created_at.slice(0,10) === today).length;
  const hr = await fetch(`${API}/holds?status=open`, { headers: authHeaders() });
  document.getElementById('statHolds').textContent = (await hr.json()).length;
  const tb = document.getElementById('recentLotsTable').querySelector('tbody');
  tb.innerHTML = '';
  for (const l of lots.slice(0, 10)) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${l.lot_no}</td><td>${l.designer}</td><td>${l.closed_at ? 'Closed' : 'Open'}</td><td>${l.closed_at ? 'Closed' : 'Active'}</td><td>${new Date(l.created_at).toLocaleString()}</td>`;
    tb.appendChild(tr);
  }
}

function setupForms() {
  document.getElementById('formStage1').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      designer: fd.get('designer'), courier: fd.get('courier'), tracking: fd.get('tracking'),
      boxes: parseInt(fd.get('boxes')), stockType: fd.get('stockType'), condition: fd.get('condition'),
      expected: fd.get('expected'), poRef: fd.get('poRef'),
      upcomingId: fd.get('upcomingId') || null,
      blindCount: 0, challanQty: 0, poQty: 0, diffNote: null, tagsMatch: 'All tags match the agreed price'
    };
    const r = await fetch(`${API}/lots`, {
      method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    if (r.ok) { alert('Lot created'); e.target.reset(); loadDashboard(); loadAllLotSelects(); }
    else alert('Error: ' + await r.text());
  });

  document.getElementById('formDailyClose').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      date: fd.get('date'), systemQty: parseInt(fd.get('systemQty')) || 0, scannedQty: parseInt(fd.get('scannedQty')) || 0,
      openNotes: fd.get('openNotes'), holdShelf: fd.get('holdShelf'), manager: parseInt(fd.get('managerId')), notes: fd.get('notes')
    };
    const r = await fetch(`${API}/dailyclose`, {
      method: 'POST', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });
    if (r.ok) { alert('Daily close saved'); loadDashboard(); }
    else alert('Error: ' + await r.text());
  });

  document.getElementById('btnSaveBoxCount').addEventListener('click', async () => {
    const r = await fetch(`${API}/settings`, {
      method: 'PATCH', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ boxCount: parseInt(document.getElementById('settingBoxCount').value) })
    });
    if (r.ok) alert('Box count saved');
    else alert('Error: ' + await r.text());
  });
}
async function loadAllLotSelects() {
  const r = await fetch(`${API}/lots`, { headers: authHeaders() });
  const lots = await r.json();
  const selIds = ['stage2LotSelect','stage3LotSelect','stage4LotSelect','stage5LotSelect','stage6LotSelect','stage7LotSelect','stage8LotSelect'];
  for (const sid of selIds) {
    const sel = document.getElementById(sid);
    sel.innerHTML = '<option value="">— Select Lot —</option>';
    for (const l of lots) {
      const o = document.createElement('option'); o.value = l.id; o.textContent = l.lot_no + ' — ' + l.designer; sel.appendChild(o);
    }
    sel.addEventListener('change', (e) => {
      const lotId = e.target.value;
      const stage = sid.replace('LotSelect','');
      if (stage === 'stage2') loadStage2(lotId);
      if (stage === 'stage3') loadStage3(lotId);
      if (stage === 'stage4') loadStage4(lotId);
      if (stage === 'stage5') loadStage5(lotId);
      if (stage === 'stage6') loadStage6(lotId);
      if (stage === 'stage7') loadStage7(lotId);
      if (stage === 'stage8') loadStage8(lotId);
    });
  }
}

function setupStage1() {
  const sel = document.querySelector('#formStage1 select[name="stockType"]');
  fillSelect(sel, lookups.stock_type || []);
  const sel2 = document.querySelector('#formStage1 select[name="condition"]');
  fillSelect(sel2, lookups.box_condition || []);
  const sel3 = document.querySelector('#formStage1 select[name="expected"]');
  fillSelect(sel3, lookups.expected || []);
  const sel4 = document.querySelector('#formStage1 select[name="upcomingId"]');
  sel4.innerHTML = '<option value="">— None —</option>';
  fetch(`${API}/upcoming`, { headers: authHeaders() }).then(r => r.json()).then(list => {
    for (const u of list) { if (u.status === 'expected') { const o = document.createElement('option'); o.value = u.id; o.textContent = u.designer + ' (' + u.expected_date + ')'; sel4.appendChild(o); } }
  });
}

function fillSelect(sel, items) {
  sel.innerHTML = '';
  for (const it of items) { const o = document.createElement('option'); o.value = it.value; o.textContent = it.label; sel.appendChild(o); }
}
function setupStage2() { loadStage2 = async (lotId) => { document.getElementById('stage2Content').innerHTML = 'Loading...'; const r = await fetch(`${API}/lots/${lotId}`, { headers: authHeaders() }); const l = await r.json(); let html = `<h3>${l.lot_no} — ${l.designer}</h3>`; html += `<p>Blind Count: <input type="number" id="s2_blindCount" value="${l.blind_count||0}"></p>`; html += `<p>Challan Qty: <input type="number" id="s2_challanQty" value="${l.challan_qty||0}"></p>`; html += `<p>PO Qty: <input type="number" id="s2_poQty" value="${l.po_qty||0}"></p>`; html += `<p>Tags Match: <select id="s2_tagsMatch"><option>All tags match the agreed price</option><option>Some tags do not match</option></select></p>`; html += `<p>Diff Note: <input type="text" id="s2_diffNote" placeholder="Required if counts differ"></p>`; html += `<button class="btn-primary" onclick="saveStage2(${lotId})">Save Stage 2</button>`; document.getElementById('stage2Content').innerHTML = html; document.getElementById('s2_tagsMatch').value = l.tags_match || 'All tags match the agreed price'; document.getElementById('s2_diffNote').value = l.diff_note || ''; }; }
async function saveStage2(lotId) {
  const body = { blindCount: parseInt(document.getElementById('s2_blindCount').value), challanQty: parseInt(document.getElementById('s2_challanQty').value), poQty: parseInt(document.getElementById('s2_poQty').value), diffNote: document.getElementById('s2_diffNote').value || null, tagsMatch: document.getElementById('s2_tagsMatch').value };
  await fetch(`${API}/lots/${lotId}`, { method: 'PATCH', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  alert('Stage 2 saved');
}
function setupStage3() { loadStage3 = async (lotId) => { document.getElementById('stage3Content').innerHTML = 'Loading...'; const r = await fetch(`${API}/lots/${lotId}`, { headers: authHeaders() }); const l = await r.json(); let html = `<h3>${l.lot_no} — ${l.designer}</h3>`; html += `<p>Iron Count: <input type="number" id="s3_ironCount" value="${l.iron_count||0}"></p>`; html += `<button class="btn-primary" onclick="saveStage3(${lotId})">Save Stage 3</button>`; document.getElementById('stage3Content').innerHTML = html; document.getElementById('s3_ironCount').value = l.iron_count || 0; }; }
async function saveStage3(lotId) {
  const body = { ironCount: parseInt(document.getElementById('s3_ironCount').value) };
  await fetch(`${API}/lots/${lotId}`, { method: 'PATCH', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  alert('Stage 3 saved');
}
function setupStage4() { loadStage4 = async (lotId) => { document.getElementById('stage4Content').innerHTML = 'Loading...'; const r = await fetch(`${API}/lots/${lotId}`, { headers: authHeaders() }); const l = await r.json(); let html = `<h3>${l.lot_no} — ${l.designer}</h3>`; html += `<p>Tag Count: <input type="number" id="s4_tagCount" value="${l.tag_count||0}"></p>`; html += `<p>Tag Dest: <select id="s4_tagDest"><option>Floor</option><option>Storeroom</option></select></p>`; html += `<p>HO Done By: <select id="s4_hoDoneBy"></select></p>`; html += `<button class="btn-primary" onclick="saveStage4(${lotId})">Save Stage 4</button>`; document.getElementById('stage4Content').innerHTML = html; document.getElementById('s4_tagCount').value = l.tag_count || 0; document.getElementById('s4_tagDest').value = l.tag_dest || 'Floor'; const s4sel = document.getElementById('s4_hoDoneBy'); s4sel.innerHTML = ''; for (const u of users) { if (u.roles.includes('HO team')) { const o = document.createElement('option'); o.value = u.id; o.textContent = u.name; s4sel.appendChild(o); } } document.getElementById('s4_hoDoneBy').value = l.ho_done_by || ''; }; }
async function saveStage4(lotId) {
  const body = { tagCount: parseInt(document.getElementById('s4_tagCount').value), tagDest: document.getElementById('s4_tagDest').value, hoDoneBy: parseInt(document.getElementById('s4_hoDoneBy').value), hoDoneAt: new Date().toISOString() };
  await fetch(`${API}/lots/${lotId}`, { method: 'PATCH', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  alert('Stage 4 saved');
}
function setupStage5() { loadStage5 = async (lotId) => { document.getElementById('stage5Content').innerHTML = 'Loading...'; const r = await fetch(`${API}/lots/${lotId}`, { headers: authHeaders() }); const l = await r.json(); let html = `<h3>${l.lot_no} — ${l.designer}</h3>`; html += `<p>Display Start: <input type="date" id="s5_displayStart" value="${l.display_start||''}"></p>`; html += `<p>Review Date: <input type="date" id="s5_reviewDate" value="${l.review_date||''}"></p>`; html += `<button class="btn-primary" onclick="saveStage5(${lotId})">Save Stage 5</button>`; document.getElementById('stage5Content').innerHTML = html; document.getElementById('s5_displayStart').value = l.display_start || ''; document.getElementById('s5_reviewDate').value = l.review_date || ''; }; }
async function saveStage5(lotId) {
  const body = { displayStart: document.getElementById('s5_displayStart').value, reviewDate: document.getElementById('s5_reviewDate').value };
  await fetch(`${API}/lots/${lotId}`, { method: 'PATCH', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  alert('Stage 5 saved');
}
function setupStage6() { loadStage6 = async (lotId) => { document.getElementById('stage6Content').innerHTML = 'Loading...'; const r = await fetch(`${API}/lots/${lotId}`, { headers: authHeaders() }); const l = await r.json(); let html = `<h3>${l.lot_no} — ${l.designer}</h3>`; html += `<p>Designer Accept: <button class="btn-primary" onclick="acceptDesigner(${lotId})">Accept</button> <button class="btn-primary" onclick="reviewOrExtend(${lotId})">Review / Extend</button></p>`; document.getElementById('stage6Content').innerHTML = html; }; }
async function acceptDesigner(lotId) {
  await fetch(`${API}/lots/${lotId}`, { method: 'PATCH', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ designerAcceptAt: new Date().toISOString() }) });
  alert('Designer accepted');
}
async function reviewOrExtend(lotId) {
  const action = prompt('Enter action: "review" or "extend"');
  if (action === 'extend') { alert('Display extended — Stage 6 returns to start'); }
  else { alert('Review noted'); }
}
function setupStage7() { loadStage7 = async (lotId) => { document.getElementById('stage7Content').innerHTML = 'Loading...'; const r = await fetch(`${API}/lots/${lotId}`, { headers: authHeaders() }); const l = await r.json(); let html = `<h3>${l.lot_no} — ${l.designer}</h3>`; html += `<p>RTV Box: <input type="text" id="s7_rtvBox" value="${l.rtv_box||''}"></p>`; html += `<p>RTV No: <input type="text" id="s7_rtvNo" value="${l.rtv_no||''}"></p>`; html += `<p>RTV Challan: <input type="text" id="s7_rtvChallan" value="${l.rtv_challan||''}"></p>`; html += `<p>RTV Courier: <input type="text" id="s7_rtvCourier" value="${l.rtv_courier||''}"></p>`; html += `<p>RTV Tracking: <input type="text" id="s7_rtvTracking" value="${l.rtv_tracking||''}"></p>`; html += `<p>Ack Count: <input type="number" id="s7_ackCount" value="${l.ack_count||0}"></p>`; html += `<button class="btn-primary" onclick="saveStage7(${lotId})">Save Stage 7</button>`; document.getElementById('stage7Content').innerHTML = html; }; }
async function saveStage7(lotId) {
  const body = { rtvBox: document.getElementById('s7_rtvBox').value, rtvNo: document.getElementById('s7_rtvNo').value, rtvChallan: document.getElementById('s7_rtvChallan').value, rtvCourier: document.getElementById('s7_rtvCourier').value, rtvTracking: document.getElementById('s7_rtvTracking').value, ackCount: parseInt(document.getElementById('s7_ackCount').value), ackDate: new Date().toISOString().slice(0,10) };
  await fetch(`${API}/lots/${lotId}`, { method: 'PATCH', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  alert('Stage 7 saved');
}
function setupStage8() { loadStage8 = async (lotId) => { document.getElementById('stage8Content').innerHTML = 'Loading...'; const r = await fetch(`${API}/lots/${lotId}`, { headers: authHeaders() }); const l = await r.json(); let html = `<h3>${l.lot_no} — ${l.designer}</h3>`; html += `<p>Sell Bill No: <input type="text" id="s8_sellBillNo" value="${l.sell_bill_no||''}"></p>`; html += `<p>Pay Note: <input type="text" id="s8_payNote" value="${l.pay_note||''}"></p>`; html += `<button class="btn-primary" onclick="saveStage8(${lotId})">Save Stage 8</button>`; document.getElementById('stage8Content').innerHTML = html; }; }
async function saveStage8(lotId) {
  const body = { sellBillNo: document.getElementById('s8_sellBillNo').value, payNote: document.getElementById('s8_payNote').value };
  await fetch(`${API}/lots/${lotId}`, { method: 'PATCH', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  alert('Stage 8 saved');
}
async function loadHolds() {
  const r = await fetch(`${API}/holds`, { headers: authHeaders() });
  const holds = await r.json();
  const tb = document.getElementById('holdsTable').querySelector('tbody');
  tb.innerHTML = '';
  for (const h of holds) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>#${h.id}</td><td>${h.lot_no || '—'}</td><td>${h.piece_idx ? '#'+h.piece_idx : '—'}</td><td>${h.error}</td><td>${h.sev}</td><td>${h.status}</td><td>${new Date(h.found_at).toLocaleDateString()}</td><td>${h.by}</td>`;
    tb.appendChild(tr);
  }
  const fsel = document.getElementById('holdFilter'); fsel.innerHTML = '<option value="">Open</option><option>Resolved and noted</option>';
  const ssel = document.getElementById('holdSevFilter'); ssel.innerHTML = '<option value="">All</option><option>A</option><option>B</option><option>C</option>';
}

async function loadSetup() {
  const r = await fetch(`${API}/users`, { headers: authHeaders() });
  const us = await r.json();
  const tb = document.getElementById('setupUsersTable').querySelector('tbody');
  tb.innerHTML = '';
  for (const u of us) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${u.name}</td><td>${u.phone}</td><td>${u.roles.join(', ')}</td><td>${u.active ? 'Yes' : 'No'}</td><td></td>`;
    tb.appendChild(tr);
  }
  const sr = await fetch(`${API}/settings`, { headers: authHeaders() });
  const st = await sr.json();
  document.getElementById('settingBoxCount').value = st.box_count || 20;
}

document.addEventListener('DOMContentLoaded', init);
