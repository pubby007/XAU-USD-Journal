// ===== STATE =====
const state = {
  trades: JSON.parse(localStorage.getItem('xau_trades') || '[]'),
  filter: 'all',
  sel: { dir: null, out: null }
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  setTodayDate();
  startClock();
});

function setTodayDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  document.getElementById('trade-date').value = `${y}-${m}-${day}`;
}

function startClock() {
  function tick() {
    const now = new Date();
    const opts = { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const estStr = new Intl.DateTimeFormat('en-US', opts).format(now);
    const istOpts = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const istStr = new Intl.DateTimeFormat('en-US', istOpts).format(now);
    document.getElementById('live-clock').innerHTML =
      `🇺🇸 EST ${estStr}<br>🇮🇳 IST ${istStr}`;
  }
  tick();
  setInterval(tick, 1000);
}

// ===== TAB SWITCHING =====
function switchTab(name, el) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  el.classList.add('active');
  if (name === 'log')   renderLog();
  if (name === 'stats') renderStats();
}

// ===== TIME SYNC =====
function syncTime(fromId, toId) {
  const val = document.getElementById(fromId).value;
  if (!val) { document.getElementById(toId).value = ''; return; }
  const [hh, mm] = val.split(':').map(Number);
  let total = hh * 60 + mm + 5 * 60 + 30;
  total = total % (24 * 60);
  const nh = String(Math.floor(total / 60)).padStart(2, '0');
  const nm = String(total % 60).padStart(2, '0');
  document.getElementById(toId).value = `${nh}:${nm}`;
}

// ===== RADIO SELECTION =====
function pick(type, val, el) {
  state.sel[type] = val;
  const groupId = type === 'dir' ? 'dir-group' : 'out-group';
  document.querySelectorAll(`#${groupId} .radio-btn`).forEach(b => {
    b.className = 'radio-btn';
  });
  el.classList.add(`sel-${val}`);
}

// ===== SUBMIT TRADE =====
function submitTrade() {
  const date = document.getElementById('trade-date').value;
  if (!date || !state.sel.dir || !state.sel.out) {
    showToast('Please fill in date, direction and outcome.', false);
    return;
  }
  const trade = {
    id: Date.now(),
    date,
    liqUS:  document.getElementById('liq-us').value,
    liqIN:  document.getElementById('liq-in').value,
    entryUS: document.getElementById('entry-us').value,
    entryIN: document.getElementById('entry-in').value,
    entryPrice: document.getElementById('entry-price').value,
    dir: state.sel.dir,
    out: state.sel.out,
    pnl: parseFloat(document.getElementById('pnl').value) || 0,
    notes: document.getElementById('notes').value.trim()
  };
  state.trades.unshift(trade);
  localStorage.setItem('xau_trades', JSON.stringify(state.trades));
  showToast('Trade logged successfully ✓', true);
  resetForm();
}

function resetForm() {
  ['liq-us','liq-in','entry-us','entry-in','entry-price','pnl','notes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  state.sel.dir = null;
  state.sel.out = null;
  document.querySelectorAll('.radio-btn').forEach(b => b.className = 'radio-btn');
  setTodayDate();
}

function showToast(msg, ok) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.borderLeftColor = ok ? 'var(--green)' : 'var(--red)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

// ===== FORMAT TIME =====
function fmt12(t) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ===== FILTER =====
function setFilter(f, el) {
  state.filter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderLog();
}

// ===== RENDER LOG =====
function renderLog() {
  let trades = state.trades;
  if (state.filter === 'buy')  trades = trades.filter(t => t.dir === 'buy');
  if (state.filter === 'sell') trades = trades.filter(t => t.dir === 'sell');
  if (state.filter === 'win')  trades = trades.filter(t => t.out === 'win');
  if (state.filter === 'loss') trades = trades.filter(t => t.out === 'loss');

  const list = document.getElementById('log-list');
  if (!trades.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div>No trades found</div></div>`;
    return;
  }

  list.innerHTML = trades.map(t => {
    const pnlStr = t.pnl > 0 ? `+$${t.pnl.toFixed(2)}` : t.pnl < 0 ? `-$${Math.abs(t.pnl).toFixed(2)}` : '$0';
    const pnlClass = t.pnl > 0 ? 'win' : t.pnl < 0 ? 'loss' : 'be';
    const dirLabel = t.dir === 'buy' ? 'BUY' : 'SELL';
    const notes = t.notes ? `<div class="tc-notes">${t.notes.slice(0, 90)}${t.notes.length > 90 ? '…' : ''}</div>` : '';
    return `
      <div class="trade-card">
        <div class="dir-badge ${t.dir}">${dirLabel}</div>
        <div>
          <div class="tc-date">${t.date}</div>
          <div class="tc-times">
            Entry ${fmt12(t.entryUS)} EST / ${fmt12(t.entryIN)} IST
            ${t.entryPrice ? ` &middot; @ ${t.entryPrice}` : ''}
          </div>
          ${notes}
        </div>
        <div class="tc-pnl ${pnlClass}">${pnlStr}</div>
      </div>`;
  }).join('');
}

// ===== DELETE TRADE =====
function deleteTrade(id) {
  if (!confirm('Delete this trade? This cannot be undone.')) return;
  state.trades = state.trades.filter(t => t.id !== id);
  localStorage.setItem('xau_trades', JSON.stringify(state.trades));
  renderStats();
}

// ===== RENDER STATS =====
function renderStats() {
  const t = state.trades;
  const wins = t.filter(x => x.out === 'win').length;
  const net = t.reduce((a, x) => a + x.pnl, 0);
  const winTrades = t.filter(x => x.pnl > 0);
  const avgWin = winTrades.length ? winTrades.reduce((a, x) => a + x.pnl, 0) / winTrades.length : 0;

  document.getElementById('s-total').textContent = t.length;
  document.getElementById('s-wr').textContent = t.length ? Math.round(wins / t.length * 100) + '%' : '—';

  const pnlEl = document.getElementById('s-pnl');
  pnlEl.textContent = (net >= 0 ? '+' : '') + '$' + Math.abs(net).toFixed(2);
  pnlEl.className = 'stat-val ' + (net >= 0 ? 'green' : 'red');

  document.getElementById('s-aw').textContent = avgWin ? '+$' + avgWin.toFixed(2) : '—';

  // Chart
  const chart = document.getElementById('chart');
  const recent = [...t].reverse().slice(-24);
  if (!recent.length) {
    chart.innerHTML = `<span style="color:var(--text3);font-size:13px">No data yet</span>`;
  } else {
    const maxAbs = Math.max(...recent.map(x => Math.abs(x.pnl)), 1);
    chart.innerHTML = recent.map(x => {
      const h = Math.max(4, Math.round(Math.abs(x.pnl) / maxAbs * 76));
      const color = x.pnl >= 0 ? 'var(--green)' : 'var(--red)';
      const label = `${x.date} ${x.pnl >= 0 ? '+' : ''}$${x.pnl.toFixed(2)}`;
      return `<div class="chart-bar" style="height:${h}px;background:${color}" title="${label}"></div>`;
    }).join('');
  }

  // Stats list
  const sl = document.getElementById('stats-list');
  if (!t.length) {
    sl.innerHTML = `<div class="empty-state" style="padding:1rem 0"><div>No trades yet</div></div>`;
    return;
  }
  sl.innerHTML = t.slice(0, 60).map(x => {
    const p = x.pnl > 0 ? `+$${x.pnl.toFixed(2)}` : x.pnl < 0 ? `-$${Math.abs(x.pnl).toFixed(2)}` : '$0';
    const pc = x.pnl > 0 ? 'win' : x.pnl < 0 ? 'loss' : 'be';
    return `
      <div class="stats-row">
        <span class="sr-date">${x.date}</span>
        <span class="sr-dir ${x.dir}">${x.dir.toUpperCase()}</span>
        <span class="sr-time">${fmt12(x.entryUS)} EST</span>
        <span class="sr-pnl ${pc}">${p}</span>
        <button class="delete-btn" onclick="deleteTrade(${x.id})" title="Delete trade">✕</button>
      </div>`;
  }).join('');
}
