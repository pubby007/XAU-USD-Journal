// =============================================
//  SUPABASE CONFIG
//  Paste your keys here when ready.
//  Leave as-is to use localStorage instead.
// =============================================
const SUPABASE_URL = 'https://qolqxegxhfuswseldiij.supabase.co';   // e.g. 'https://xxxx.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbHF4ZWd4aGZ1c3dzZWxkaWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTM5OTEsImV4cCI6MjA5NTI4OTk5MX0.UP_E1fajbZro_0HFcdhv6OauYSQQ7dzNQdr0r1jI58U';   // your anon/public key

// =============================================
//  DB MODE — auto-detected
//  If keys are filled → Supabase
//  If keys are empty  → localStorage (offline)
// =============================================
const USE_SUPABASE = SUPABASE_URL !== 'https://qolqxegxhfuswseldiij.supabase.co' && SUPABASE_KEY !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbHF4ZWd4aGZ1c3dzZWxkaWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTM5OTEsImV4cCI6MjA5NTI4OTk5MX0.UP_E1fajbZro_0HFcdhv6OauYSQQ7dzNQdr0r1jI58U';
let db = null;
if (USE_SUPABASE) {
  const { createClient } = supabase;
  db = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// ===== STATE =====
const state = {
  trades: [],
  filter: 'all',
  statsFilter: 'all',
  sel: { dir: null, out: null, setup: null }
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  setTodayDate();
  startClock();
  await loadTrades();
  // show which mode is active
  const badge = document.getElementById('db-badge');
  if (badge) {
    badge.textContent = USE_SUPABASE ? '☁ Supabase' : '💾 Local';
    badge.style.color = USE_SUPABASE ? '#7aaeff' : '#C9A84C';
  }
});

// =============================================
//  DATA LAYER — Supabase or localStorage
// =============================================
async function loadTrades() {
  showLoading(true);
  try {
    if (USE_SUPABASE) {
      const { data, error } = await db
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      state.trades = (data || []).map(mapRow);
    } else {
      state.trades = JSON.parse(localStorage.getItem('xau_trades') || '[]');
    }
  } catch (err) {
    console.error('Load error:', err.message);
    showToast('Could not load trades: ' + err.message, false);
  }
  showLoading(false);
}

async function saveTrade(trade) {
  if (USE_SUPABASE) {
    const { error } = await db.from('trades').insert([{
      trade_id:    trade.id,
      date:        trade.date,
      setup:       trade.setup,
      liq_us:      trade.liqUS,
      liq_in:      trade.liqIN,
      entry_us:    trade.entryUS,
      entry_in:    trade.entryIN,
      entry_price: trade.entryPrice,
      dir:         trade.dir,
      outcome:     trade.out,
      pnl:         trade.pnl,
      notes:       trade.notes
    }]);
    if (error) throw error;
  } else {
    state.trades.unshift(trade);
    localStorage.setItem('xau_trades', JSON.stringify(state.trades));
  }
}

async function deleteFromDB(tradeId) {
  if (USE_SUPABASE) {
    const { error } = await db
      .from('trades')
      .delete()
      .eq('trade_id', tradeId);
    if (error) throw error;
  } else {
    state.trades = state.trades.filter(t => t.id !== tradeId);
    localStorage.setItem('xau_trades', JSON.stringify(state.trades));
  }
}

// map Supabase row → app trade shape
function mapRow(r) {
  // if already in app shape (localStorage), return as-is
  if (r.liqUS !== undefined) return r;
  return {
    id:         r.trade_id,
    date:       r.date,
    setup:      r.setup,
    liqUS:      r.liq_us,
    liqIN:      r.liq_in,
    entryUS:    r.entry_us,
    entryIN:    r.entry_in,
    entryPrice: r.entry_price,
    dir:        r.dir,
    out:        r.outcome,
    pnl:        r.pnl || 0,
    notes:      r.notes || ''
  };
}

// =============================================
//  UI HELPERS
// =============================================
function showLoading(on) {
  const el = document.getElementById('loading-bar');
  if (el) el.style.display = on ? 'block' : 'none';
}

function showToast(msg, ok) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.borderLeftColor = ok ? 'var(--green)' : 'var(--red)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function setTodayDate() {
  const d = new Date();
  const el = document.getElementById('trade-date');
  if (el) el.value =
    d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function startClock() {
  function tick() {
    const now = new Date();
    const estStr = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
    const istStr = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata',     hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
    const el = document.getElementById('live-clock');
    if (el) el.innerHTML = `🇺🇸 EST ${estStr}<br>🇮🇳 IST ${istStr}`;
  }
  tick();
  setInterval(tick, 1000);
}

// =============================================
//  TAB SWITCHING
// =============================================
function switchTab(name, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  el.classList.add('active');
  if (name === 'log')   renderLog();
  if (name === 'stats') renderStats();
}

// =============================================
//  TIME SYNC  EST → IST (+5h 30m)
// =============================================
function syncTime(fromId, toId) {
  const val = document.getElementById(fromId).value;
  if (!val) { document.getElementById(toId).value = ''; return; }
  const [hh, mm] = val.split(':').map(Number);
  let total = hh * 60 + mm + 5 * 60 + 30;
  total = total % (24 * 60);
  document.getElementById(toId).value =
    String(Math.floor(total / 60)).padStart(2, '0') + ':' +
    String(total % 60).padStart(2, '0');
}

// =============================================
//  RADIO / SETUP SELECTION
// =============================================
function pick(type, val, el) {
  state.sel[type] = val;
  const groupMap = { dir: 'dir-group', out: 'out-group', setup: 'setup-group' };
  document.querySelectorAll('#' + groupMap[type] + ' .radio-btn').forEach(b => {
    b.className = b.className.replace(/\bsel-\S+/g, '').trim();
  });
  el.classList.add('sel-' + val);

  // Hide liquidity section for Setup 1
  if (type === 'setup') {
    const liqCard = document.getElementById('liq-card');
    if (val === 'setup1') {
      liqCard.style.display = 'none';
      document.getElementById('liq-us').value = '';
      document.getElementById('liq-in').value = '';
    } else {
      liqCard.style.display = 'block';
    }
  }
}

// =============================================
//  SUBMIT TRADE
// =============================================
async function submitTrade() {
  const date = document.getElementById('trade-date').value;
  if (!date || !state.sel.dir || !state.sel.out || !state.sel.setup) {
    showToast('Please fill in date, setup, direction and outcome.', false);
    return;
  }

  const trade = {
    id:         Date.now(),
    date,
    setup:      state.sel.setup,
    liqUS:      document.getElementById('liq-us').value,
    liqIN:      document.getElementById('liq-in').value,
    entryUS:    document.getElementById('entry-us').value,
    entryIN:    document.getElementById('entry-in').value,
    entryPrice: document.getElementById('entry-price').value,
    dir:        state.sel.dir,
    out:        state.sel.out,
    pnl:        parseFloat(document.getElementById('pnl').value) || 0,
    notes:      document.getElementById('notes').value.trim()
  };

  const btn = document.querySelector('.submit-btn');
  btn.textContent = 'Saving...';
  btn.disabled = true;

  try {
    await saveTrade(trade);
    await loadTrades();
    showToast('Trade logged successfully ✓', true);
    resetForm();
  } catch (err) {
    console.error('Save error:', err.message);
    showToast('Failed to save: ' + err.message, false);
  }

  btn.textContent = 'Log This Trade';
  btn.disabled = false;
}

function resetForm() {
  ['liq-us','liq-in','entry-us','entry-in','entry-price','pnl','notes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  state.sel = { dir: null, out: null, setup: null };
  document.querySelectorAll('.radio-btn').forEach(b => {
    b.className = b.className.replace(/\bsel-\S+/g, '').trim();
  });
  document.getElementById('liq-card').style.display = 'block';
  setTodayDate();
}

// =============================================
//  DELETE TRADE
// =============================================
async function deleteTrade(tradeId) {
  if (!confirm('Delete this trade? This cannot be undone.')) return;
  try {
    await deleteFromDB(tradeId);
    await loadTrades();
    renderStats();
    showToast('Trade deleted.', true);
  } catch (err) {
    console.error('Delete error:', err.message);
    showToast('Failed to delete: ' + err.message, false);
  }
}

// =============================================
//  FILTERS
// =============================================
function setFilter(f, el) {
  state.filter = f;
  document.querySelectorAll('#tab-log .filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderLog();
}

function setStatsFilter(f, el) {
  state.statsFilter = f;
  document.querySelectorAll('#tab-stats .filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderStats();
}

// =============================================
//  HELPERS
// =============================================
function fmt12(t) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function setupLabel(s) {
  return s === 'setup1' ? 'S1' : s === 'setup2' ? 'S2' : '—';
}

function calcStats(trades) {
  const wins    = trades.filter(x => x.out === 'win').length;
  const net     = trades.reduce((a, x) => a + (x.pnl || 0), 0);
  const winPnls = trades.filter(x => x.pnl > 0).map(x => x.pnl);
  const avgWin  = winPnls.length ? winPnls.reduce((a, v) => a + v, 0) / winPnls.length : 0;
  return {
    total: trades.length, wins, net, avgWin,
    wr: trades.length ? Math.round(wins / trades.length * 100) : null
  };
}

// =============================================
//  RENDER LOG
// =============================================
function renderLog() {
  let trades = [...state.trades];
  const f = state.filter;
  if      (f === 'setup1') trades = trades.filter(t => t.setup === 'setup1');
  else if (f === 'setup2') trades = trades.filter(t => t.setup === 'setup2');
  else if (f === 'buy')    trades = trades.filter(t => t.dir   === 'buy');
  else if (f === 'sell')   trades = trades.filter(t => t.dir   === 'sell');
  else if (f === 'win')    trades = trades.filter(t => t.out   === 'win');
  else if (f === 'loss')   trades = trades.filter(t => t.out   === 'loss');

  const list = document.getElementById('log-list');
  if (!trades.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div>No trades found</div></div>`;
    return;
  }

  list.innerHTML = trades.map(t => {
    const pnlStr   = t.pnl > 0 ? `+$${t.pnl.toFixed(2)}` : t.pnl < 0 ? `-$${Math.abs(t.pnl).toFixed(2)}` : '$0';
    const pnlClass = t.pnl > 0 ? 'win' : t.pnl < 0 ? 'loss' : 'be';
    const notes    = t.notes ? `<div class="tc-notes">${t.notes.slice(0, 90)}${t.notes.length > 90 ? '…' : ''}</div>` : '';
    const liqLine  = t.setup !== 'setup1' && t.liqUS
      ? `<div class="tc-liq">Liq ${fmt12(t.liqUS)} EST / ${fmt12(t.liqIN)} IST</div>` : '';
    return `
      <div class="trade-card">
        <div class="dir-badge ${t.dir}">${t.dir === 'buy' ? 'BUY' : 'SELL'}</div>
        <div>
          <div class="tc-date">${t.date} <span class="setup-tag ${t.setup}">${setupLabel(t.setup)}</span></div>
          ${liqLine}
          <div class="tc-times">Entry ${fmt12(t.entryUS)} EST / ${fmt12(t.entryIN)} IST${t.entryPrice ? ` &middot; @ ${t.entryPrice}` : ''}</div>
          ${notes}
        </div>
        <div class="tc-pnl ${pnlClass}">${pnlStr}</div>
      </div>`;
  }).join('');
}

// =============================================
//  RENDER STATS
// =============================================
function renderStats() {
  const all = [...state.trades];
  const sf  = state.statsFilter;
  const t   = sf === 'all' ? all : all.filter(x => x.setup === sf);
  const s   = calcStats(t);

  document.getElementById('s-total').textContent = s.total;
  document.getElementById('s-wr').textContent    = s.wr !== null ? s.wr + '%' : '—';
  document.getElementById('s-aw').textContent    = s.avgWin ? '+$' + s.avgWin.toFixed(2) : '—';
  const pnlEl = document.getElementById('s-pnl');
  pnlEl.textContent = (s.net >= 0 ? '+' : '') + '$' + Math.abs(s.net).toFixed(2);
  pnlEl.className   = 'stat-val ' + (s.net >= 0 ? 'green' : 'red');

  // Per-setup comparison
  ['setup1', 'setup2'].forEach((setup, i) => {
    const n  = i + 1;
    const st = calcStats(all.filter(x => x.setup === setup));
    document.getElementById(`s${n}-total`).textContent = st.total;
    document.getElementById(`s${n}-wr`).textContent    = st.wr !== null ? st.wr + '%' : '—';
    const spEl = document.getElementById(`s${n}-pnl`);
    spEl.textContent = (st.net >= 0 ? '+' : '') + '$' + Math.abs(st.net).toFixed(2);
    spEl.className   = st.net >= 0 ? 'green' : 'red';
  });

  // Bar chart
  const chart  = document.getElementById('chart');
  const recent = [...t].reverse().slice(-24);
  if (!recent.length) {
    chart.innerHTML = `<span style="color:var(--text3);font-size:13px">No data yet</span>`;
  } else {
    const maxAbs = Math.max(...recent.map(x => Math.abs(x.pnl)), 1);
    chart.innerHTML = recent.map(x => {
      const h   = Math.max(4, Math.round(Math.abs(x.pnl) / maxAbs * 76));
      const col = x.pnl >= 0 ? 'var(--green)' : 'var(--red)';
      return `<div class="chart-bar" style="height:${h}px;background:${col}" title="${x.date} · ${setupLabel(x.setup)} · ${x.pnl >= 0 ? '+' : ''}$${x.pnl.toFixed(2)}"></div>`;
    }).join('');
  }

  // History list
  const sl = document.getElementById('stats-list');
  if (!t.length) {
    sl.innerHTML = `<div class="empty-state" style="padding:1rem 0"><div>No trades yet</div></div>`;
    return;
  }
  sl.innerHTML = t.slice(0, 60).map(x => {
    const p  = x.pnl > 0 ? `+$${x.pnl.toFixed(2)}` : x.pnl < 0 ? `-$${Math.abs(x.pnl).toFixed(2)}` : '$0';
    const pc = x.pnl > 0 ? 'win' : x.pnl < 0 ? 'loss' : 'be';
    return `
      <div class="stats-row">
        <span class="sr-date">${x.date}</span>
        <span class="setup-tag ${x.setup}">${setupLabel(x.setup)}</span>
        <span class="sr-dir ${x.dir}">${x.dir.toUpperCase()}</span>
        <span class="sr-time">${fmt12(x.entryUS)} EST</span>
        <span class="sr-pnl ${pc}">${p}</span>
        <button class="delete-btn" onclick="deleteTrade(${x.id})" title="Delete">✕</button>
      </div>`;
  }).join('');
}
