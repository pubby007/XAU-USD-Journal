# XAU/USD Trading Journal

A clean paper trading bank journal for XAU/USD, with automatic EST → IST time conversion.

## Features
- Log trades with date, liquidity/kill zone time, entry time
- Auto-converts US (EST) time to India (IST) — EST + 5:30
- Buy / Sell direction selector
- Win / Loss / Break Even outcome
- P&L tracking
- Trade log with filters (All, Buy, Sell, Wins, Losses)
- Statistics: Win Rate, Net P&L, Avg Win, performance chart
- **Data saved in browser localStorage** — persists across sessions
- Live EST & IST clock in header

## Deploy to GitHub Pages

1. Create a new repo on GitHub (e.g. `xauusd-journal`)
2. Upload the 3 files: `index.html`, `style.css`, `app.js`
3. Go to **Settings → Pages**
4. Under **Source**, select `main` branch → `/ (root)` → Save
5. Your site will be live at: `https://YOUR_USERNAME.github.io/xauusd-journal`

## Deploy to Vercel

1. Push files to a GitHub repo (steps 1–2 above)
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Framework: **Other** (no build needed — plain HTML)
5. Click Deploy — done!

## Files
```
index.html   — page structure
style.css    — all styling
app.js       — logic, time sync, localStorage
```
