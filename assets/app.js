/* ==========================================================================
   PaymentsIQ — application shell, views and charts.
   Plain ES5-compatible browser JS, no build step. Every colour used here is
   read from the Tiger Analytics tokens declared in assets/theme.css.
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Token accessor: charts must never hard-code hex ---------- */
  var CS = getComputedStyle(document.documentElement);
  function token(name) { return CS.getPropertyValue('--' + name).trim(); }

  var C = {
    brand:    token('brand-500'),
    brand100: token('brand-100'),
    brand700: token('brand-700'),
    success:  token('success-500'),
    warning:  token('warning-500'),
    error:    token('error-500'),
    gray25:   token('gray-25'),
    gray50:   token('gray-50'),
    gray100:  token('gray-100'),
    gray300:  token('gray-300'),
    gray500:  token('gray-500'),
    gray900:  token('gray-900'),
    canvas:   '#FFFFFF'
  };

  /* ==========================================================================
     Utilities
     ========================================================================== */
  function money(n)  { return '$' + Number(n).toLocaleString('en-US'); }
  function moneyM(n) { return '$' + (n / 1e6).toFixed(2) + 'M'; }
  function pct(n, d) { return (n).toFixed(d === undefined ? 1 : d) + '%'; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- Icons (24x24 stroke set) ---------- */
  var PATHS = {
    home:     '<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    payments: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/>',
    reports:  '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    settings: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
    search:   '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    check:    '<path d="m5 13 4 4L19 7"/>',
    alert:    '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.01"/>',
    clock:    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    close:    '<path d="M6 6l12 12M18 6 6 18"/>',
    up:       '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down:     '<path d="M12 5v14M6 13l6 6 6-6"/>',
    right:    '<path d="m9 5 7 7-7 7"/>',
    file:     '<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z"/><path d="M14 3v4h4"/>',
    mail:     '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6 8.5-6"/>',
    shield:   '<path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    refresh:  '<path d="M20 11a8 8 0 1 0-.6 4"/><path d="M20 5v6h-6"/>',
    bell:     '<path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6"/><path d="M10.5 20a2 2 0 0 0 3 0"/>',
    minus:    '<path d="M5 12h14"/>',
    plus:     '<path d="M12 5v14M5 12h14"/>'
  };
  function icon(name, size, cls) {
    return '<svg class="' + (cls || '') + '" width="' + (size || 18) + '" height="' + (size || 18) +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + PATHS[name] + '</svg>';
  }

  /* ---------- Verdict presentation ---------- */
  function verdictBadge(key) {
    var v = DATA.VERDICT[key];
    return '<span class="badge badge--' + v.tone + '"><span class="badge__dot"></span>' + esc(v.label) + '</span>';
  }
  function verdictColor(key) {
    var tone = DATA.VERDICT[key].tone;
    return tone === 'error' ? C.error : tone === 'warning' ? C.warning : tone === 'success' ? C.success : C.gray500;
  }

  /* ==========================================================================
     App state
     ========================================================================== */
  var state = {
    view: 'home',
    filter: 'ALL',
    search: '',
    openClaim: null,
    tab: 'analysis',
    decisions: {},              // claimId -> { action, note, approver }
    benchmarks: DATA.BENCHMARKS.map(function (b) { return Object.assign({}, b); }),
    showWeeklyTable: false
  };

  function claimById(id) {
    for (var i = 0; i < DATA.CLAIMS.length; i++) if (DATA.CLAIMS[i].id === id) return DATA.CLAIMS[i];
    return null;
  }
  function openClaims() {
    return DATA.CLAIMS.filter(function (c) { return !state.decisions[c.id]; });
  }
  function totals() {
    var open = openClaims();
    return {
      count: open.length,
      value: open.reduce(function (a, c) { return a + c.amount; }, 0),
      exceptions: open.filter(function (c) {
        return c.verdict === 'HIGH_ABERRATION' || c.verdict === 'MODERATE_FLAG' || c.verdict === 'AWAITING_VENDOR';
      }).length,
      atRisk: open.reduce(function (a, c) { return a + c.exposure; }, 0),
      seniorSignOff: open.filter(function (c) { return c.amount >= DATA.THRESHOLDS.seniorSignOff; }).length
    };
  }

  /* ==========================================================================
     Toasts
     ========================================================================== */
  function toast(msg, tone) {
    var host = $('.toasts');
    var t = el('<div class="toast ' + (tone ? 'toast--' + tone : '') + '"><span class="toast__bar"></span><span>' + esc(msg) + '</span></div>');
    host.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 220); }, 3600);
  }

  /* ==========================================================================
     Charts
     ========================================================================== */

  /* Stacked vertical bars — 2 series, gap between segments, direct labels. */
  function chartStackedWeekly() {
    var d = DATA.WEEKLY, W = 720, H = 240, pad = { t: 28, r: 8, b: 26, l: 40 };
    var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    var max = 32, bw = Math.min(38, iw / d.length - 16), gap = iw / d.length;
    var y = function (v) { return pad.t + ih - (v / max) * ih; };

    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Weekly claim value, cleared versus flagged, in millions of dollars">';
    s += '<g class="chart-grid">';
    [0, 8, 16, 24, 32].forEach(function (v) { s += '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>'; });
    s += '</g><g class="chart-axis">';
    [0, 8, 16, 24, 32].forEach(function (v) { s += '<text x="' + (pad.l - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">$' + v + 'M</text>'; });
    s += '</g>';

    d.forEach(function (w, i) {
      var cx = pad.l + gap * i + gap / 2, x = cx - bw / 2;
      var total = w.cleared + w.flagged;
      var hc = (w.cleared / max) * ih, hf = (w.flagged / max) * ih;
      // flagged sits on top of cleared, separated by a 2px surface gap
      s += '<rect x="' + x + '" y="' + y(w.cleared) + '" width="' + bw + '" height="' + Math.max(hc, 2) + '" rx="2" fill="' + C.success + '"/>';
      s += '<rect x="' + x + '" y="' + (y(total)) + '" width="' + bw + '" height="' + Math.max(hf - 2, 2) + '" rx="4" fill="' + C.brand + '"/>';
      s += '<text class="lbl" x="' + cx + '" y="' + (y(total) - 8) + '" text-anchor="middle" font-size="10.5" font-weight="600" fill="' + C.gray500 + '">' + total.toFixed(1) + '</text>';
      s += '<text x="' + cx + '" y="' + (H - 6) + '" text-anchor="middle" font-size="11" fill="' + C.gray500 + '">' + w.label + '</text>';
      s += '<rect class="hit" data-i="' + i + '" x="' + (cx - gap / 2) + '" y="' + pad.t + '" width="' + gap + '" height="' + ih + '" fill="transparent"/>';
    });
    s += '</svg>';

    var wrap = el('<div class="chart"></div>');
    wrap.innerHTML = s;
    var tip = el('<div class="chart-tip"></div>');
    wrap.appendChild(tip);
    $$('.hit', wrap).forEach(function (r) {
      r.addEventListener('mouseenter', function () {
        var w = d[+r.dataset.i], b = r.getBoundingClientRect(), p = wrap.getBoundingClientRect();
        tip.innerHTML = '<strong>' + w.label + '</strong><br><span class="k">Cleared</span> $' + w.cleared.toFixed(1) +
          'M<br><span class="k">Flagged</span> $' + w.flagged.toFixed(1) + 'M<br><span class="k">At risk</span> $' + w.atRisk.toFixed(2) + 'M';
        tip.style.left = (b.left - p.left + b.width / 2) + 'px';
        tip.style.top = (b.top - p.top + 12) + 'px';
        tip.classList.add('is-on');
      });
      r.addEventListener('mouseleave', function () { tip.classList.remove('is-on'); });
    });
    return wrap;
  }

  /* Horizontal diverging bars — variance vs benchmark ceiling by category. */
  function chartCategoryVariance() {
    var d = DATA.CATEGORY_VARIANCE, W = 520, rowH = 38, H = d.length * rowH + 24;
    var labelW = 140, axisX = labelW + 90, scale = 15; // px per pct point (approx)
    var maxAbs = 16, plotW = W - axisX - 60;
    var unit = plotW / (maxAbs * 2);

    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Average rate variance against benchmark ceiling by spend category">';
    var zero = axisX + maxAbs * unit;
    s += '<line x1="' + zero + '" x2="' + zero + '" y1="4" y2="' + (H - 20) + '" stroke="' + C.gray300 + '" stroke-width="1"/>';
    s += '<text x="' + zero + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10.5" fill="' + C.gray500 + '">benchmark ceiling</text>';

    d.forEach(function (r, i) {
      var yy = 8 + i * rowH, w = Math.abs(r.variance) * unit;
      var x = r.variance >= 0 ? zero : zero - w;
      var col = r.breach ? C.error : C.success;
      s += '<text x="0" y="' + (yy + 17) + '" font-size="12" font-weight="500" fill="' + C.gray900 + '">' + esc(r.category) + '</text>';
      s += '<text x="' + (labelW + 76) + '" y="' + (yy + 17) + '" text-anchor="end" font-size="11" fill="' + C.gray500 + '">$' + r.spend.toFixed(1) + 'M</text>';
      s += '<rect x="' + x + '" y="' + (yy + 5) + '" width="' + Math.max(w, 3) + '" height="16" rx="4" fill="' + col + '" data-i="' + i + '"/>';
      var lx = r.variance >= 0 ? x + w + 8 : x - 8;
      s += '<text x="' + lx + '" y="' + (yy + 17) + '" text-anchor="' + (r.variance >= 0 ? 'start' : 'end') +
           '" font-size="11.5" font-weight="600" fill="' + C.gray900 + '">' + (r.variance > 0 ? '+' : '') + r.variance.toFixed(1) + '%</text>';
    });
    s += '</svg>';
    var wrap = el('<div class="chart"></div>');
    wrap.innerHTML = s;
    return wrap;
  }

  /* Single-series line — value at risk per week. */
  function chartAtRisk() {
    var d = DATA.WEEKLY, W = 520, H = 190, pad = { t: 20, r: 46, b: 26, l: 40 };
    var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b, max = 2;
    var x = function (i) { return pad.l + (iw / (d.length - 1)) * i; };
    var y = function (v) { return pad.t + ih - (v / max) * ih; };

    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Value at risk per week in millions of dollars">';
    s += '<g class="chart-grid">';
    [0, 0.5, 1, 1.5, 2].forEach(function (v) { s += '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>'; });
    s += '</g><g class="chart-axis">';
    [0, 1, 2].forEach(function (v) { s += '<text x="' + (pad.l - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">$' + v.toFixed(1) + 'M</text>'; });
    d.forEach(function (w, i) { s += '<text x="' + x(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + w.label + '</text>'; });
    s += '</g>';

    var path = d.map(function (w, i) { return (i ? 'L' : 'M') + x(i) + ' ' + y(w.atRisk); }).join(' ');
    s += '<path d="' + path + '" fill="none" stroke="' + C.brand + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    d.forEach(function (w, i) {
      s += '<circle cx="' + x(i) + '" cy="' + y(w.atRisk) + '" r="4" fill="' + C.brand + '" stroke="' + C.canvas + '" stroke-width="2"/>';
      s += '<rect class="hit" data-i="' + i + '" x="' + (x(i) - iw / (d.length - 1) / 2) + '" y="' + pad.t + '" width="' + (iw / (d.length - 1)) + '" height="' + ih + '" fill="transparent"/>';
    });
    var last = d[d.length - 1];
    s += '<text x="' + (x(d.length - 1) + 10) + '" y="' + (y(last.atRisk) + 4) + '" font-size="11.5" font-weight="600" fill="' + C.brand700 + '">$' + last.atRisk.toFixed(2) + 'M</text>';
    s += '</svg>';

    var wrap = el('<div class="chart"></div>');
    wrap.innerHTML = s;
    var tip = el('<div class="chart-tip"></div>');
    wrap.appendChild(tip);
    $$('.hit', wrap).forEach(function (r) {
      r.addEventListener('mouseenter', function () {
        var w = d[+r.dataset.i], b = r.getBoundingClientRect(), p = wrap.getBoundingClientRect();
        tip.innerHTML = '<strong>' + w.label + '</strong><br><span class="k">Value at risk</span> $' + w.atRisk.toFixed(2) + 'M';
        tip.style.left = (b.left - p.left + b.width / 2) + 'px';
        tip.style.top = (b.top - p.top + 10) + 'px';
        tip.classList.add('is-on');
      });
      r.addEventListener('mouseleave', function () { tip.classList.remove('is-on'); });
    });
    return wrap;
  }

  /* Recovery bars — single hue sequential. */
  function chartRecovery() {
    var d = DATA.RECOVERY, W = 520, H = 190, pad = { t: 24, r: 8, b: 26, l: 40 };
    var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b, max = 1.6;
    var gap = iw / d.length, bw = Math.min(44, gap - 18);
    var y = function (v) { return pad.t + ih - (v / max) * ih; };
    var ramp = ['brand-200', 'brand-300', 'brand-400', 'brand-500', 'brand-600', 'brand-700'].map(token);

    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Value recovered before payment by month, in millions of dollars">';
    s += '<g class="chart-grid">';
    [0, 0.4, 0.8, 1.2, 1.6].forEach(function (v) { s += '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>'; });
    s += '</g><g class="chart-axis">';
    [0, 0.8, 1.6].forEach(function (v) { s += '<text x="' + (pad.l - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">$' + v.toFixed(1) + 'M</text>'; });
    s += '</g>';
    d.forEach(function (m, i) {
      var cx = pad.l + gap * i + gap / 2;
      s += '<rect x="' + (cx - bw / 2) + '" y="' + y(m.recovered) + '" width="' + bw + '" height="' + ((m.recovered / max) * ih) + '" rx="4" fill="' + ramp[i] + '"/>';
      s += '<text x="' + cx + '" y="' + (y(m.recovered) - 7) + '" text-anchor="middle" font-size="10.5" font-weight="600" fill="' + C.gray500 + '">$' + m.recovered.toFixed(2) + 'M</text>';
      s += '<text x="' + cx + '" y="' + (H - 6) + '" text-anchor="middle" font-size="11" fill="' + C.gray500 + '">' + m.month + '</text>';
    });
    s += '</svg>';
    var wrap = el('<div class="chart"></div>');
    wrap.innerHTML = s;
    return wrap;
  }

  function legend(items) {
    return '<div class="legend">' + items.map(function (i) {
      return '<span class="legend__item"><span class="legend__swatch" style="background:' + i.color + '"></span>' + esc(i.label) + '</span>';
    }).join('') + '</div>';
  }

  /* ==========================================================================
     Shared fragments
     ========================================================================== */
  function kpi(o) {
    return '<div class="kpi" style="--accent:' + o.accent + '">' +
      '<span class="t-overline">' + esc(o.label) + '</span>' +
      '<span class="kpi__value">' + o.value + '</span>' +
      '<span class="t-caption">' + esc(o.hint) + '</span>' +
      (o.delta ? '<span class="kpi__delta ' + o.deltaTone + '">' + icon(o.deltaIcon || 'up', 13) + esc(o.delta) + '</span>' : '') +
      '</div>';
  }

  function meterRow(label, value, total, color) {
    var w = total ? (value / total) * 100 : 0;
    return '<div class="stack gap-2">' +
      '<div class="row gap-3"><span class="t-body2">' + esc(label) + '</span><span class="spacer"></span>' +
      '<span class="t-subtitle2 num">' + value + '</span></div>' +
      '<div class="meter"><span class="meter__fill" style="width:' + w + '%;background:' + color + '"></span></div>' +
      '</div>';
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }

  /* Narrative briefing, composed from the live queue so it never contradicts the tiles. */
  function briefing(t, open, priority) {
    if (!open.length) {
      return 'The queue is clear. Every claim submitted for Period 6 has been certified, part-certified or returned to the vendor — ' +
        'nothing is outstanding ahead of the 03 August payment run.';
    }

    var clean = open.filter(function (c) { return c.verdict === 'VALIDATED' || c.verdict === 'AUTO_APPROVE'; }).length;
    var top = priority.slice().sort(function (a, b) { return b.exposure - a.exposure; })[0];
    var s = '';

    s += t.exceptions
      ? plural(t.exceptions, 'claim') + ' ' + (t.exceptions === 1 ? 'carries an exception' : 'carry exceptions') +
        ' worth <strong>' + money(t.atRisk) + '</strong> against a queue of ' + moneyM(t.value) + '. '
      : 'No exceptions remain open against a queue of ' + moneyM(t.value) + '. ';

    if (top) {
      s += 'The material item is <strong>' + top.id + '</strong> — ' + esc(top.vendor) + ': ' +
        esc(top.headline.replace(/\.$/, '')) + ', ' + money(top.exposure) + ' at risk. ';
    }

    s += t.seniorSignOff
      ? plural(t.seniorSignOff, 'claim') + ' ' + (t.seniorSignOff === 1 ? 'sits' : 'sit') + ' above the ' +
        moneyM(DATA.THRESHOLDS.seniorSignOff) + ' single-approval threshold and ' +
        (t.seniorSignOff === 1 ? 'needs' : 'need') + ' CFO sign-off before Monday. '
      : 'Nothing left in the queue breaches the ' + moneyM(DATA.THRESHOLDS.seniorSignOff) + ' single-approval threshold. ';

    if (clean) {
      s += 'The remaining ' + plural(clean, 'claim') + ' cleared all twelve checks and can be released straight through.';
    }
    return s;
  }

  function flagBadge(flag) {
    if (flag === 'HIGH') return '<span class="badge badge--error">High</span>';
    if (flag === 'MODERATE') return '<span class="badge badge--warning">Moderate</span>';
    return '<span class="badge badge--success">Within norm</span>';
  }

  /* ==========================================================================
     View: Home
     ========================================================================== */
  function viewHome() {
    var t = totals();
    var open = openClaims();
    var byVerdict = {};
    Object.keys(DATA.VERDICT).forEach(function (k) { byVerdict[k] = 0; });
    open.forEach(function (c) { byVerdict[c.verdict]++; });

    var priority = open.filter(function (c) {
      return c.verdict === 'HIGH_ABERRATION' || c.verdict === 'MODERATE_FLAG' || c.verdict === 'AWAITING_VENDOR';
    });

    var h = '';

    h += '<div class="row gap-4 mb-6 wrap">' +
      '<div class="stack gap-1">' +
        '<span class="t-overline">Wednesday, 29 July 2026 · Period 6 close</span>' +
        '<h3>Payment run readiness</h3>' +
        '<p class="t-subtitle1">' + t.count + ' supplier claims worth ' + moneyM(t.value) + ' are queued for the 03 August run.</p>' +
      '</div>' +
      '<span class="spacer"></span>' +
      '<button class="btn btn--secondary" data-act="refresh">' + icon('refresh', 16) + 'Re-run agents</button>' +
      '<button class="btn btn--primary" data-act="goto-payments">Open validation queue' + icon('right', 16) + '</button>' +
      '</div>';

    /* AI briefing — derived from the live queue, not a fixed string */
    h += '<div class="callout callout--brand mb-6">' +
      '<div class="row gap-2 mb-2">' + '<span class="tone-brand">' + icon('shield', 18) + '</span>' +
      '<span class="t-overline tone-brand">PaymentsIQ briefing · generated 06:40</span></div>' +
      '<p class="t-body1">' + briefing(t, open, priority) + '</p></div>';

    /* KPIs */
    h += '<div class="grid g-4 mb-6">' +
      kpi({ label: 'Claims in queue', value: String(t.count), hint: 'Awaiting certification', accent: C.brand,
            delta: Object.keys(state.decisions).length ? plural(Object.keys(state.decisions).length, 'decision') + ' taken today' : '+3 vs last period',
            deltaTone: 'tone-secondary', deltaIcon: Object.keys(state.decisions).length ? 'check' : 'up' }) +
      kpi({ label: 'Value in flight', value: moneyM(t.value), hint: 'Due in the 03 Aug payment run', accent: C.gray500 }) +
      kpi({ label: 'Exceptions open', value: String(t.exceptions), hint: 'Require analyst intervention',
            accent: t.exceptions ? C.warning : C.success,
            delta: t.seniorSignOff ? plural(t.seniorSignOff, 'claim') + ' above sign-off threshold' : 'None above sign-off threshold',
            deltaTone: t.seniorSignOff ? 'tone-warning' : 'tone-success', deltaIcon: t.seniorSignOff ? 'alert' : 'check' }) +
      kpi({ label: 'Value at risk', value: moneyM(t.atRisk), hint: 'Over-claim identified, not yet withheld',
            accent: t.atRisk ? C.error : C.success,
            delta: t.atRisk ? '+21% vs last period' : 'All exposure resolved',
            deltaTone: t.atRisk ? 'tone-error' : 'tone-success', deltaIcon: t.atRisk ? 'up' : 'check' }) +
      '</div>';

    /* Two columns */
    h += '<div class="grid grid--start" style="grid-template-columns:minmax(0,1.55fr) minmax(0,1fr)">';

    /* Priority signals */
    h += '<div class="card"><div class="card__head"><div class="stack gap-1">' +
      '<h6>Needs your attention</h6><span class="t-caption">Ranked by exposure, then by approval threshold breach</span>' +
      '</div><span class="spacer"></span><span class="badge badge--error">' + priority.length + ' open</span></div>' +
      '<div class="card__body card__body--flush"><div class="table-wrap"><table class="table"><tbody>';

    priority.sort(function (a, b) { return b.exposure - a.exposure; }).forEach(function (c) {
      var tone = DATA.VERDICT[c.verdict].tone;
      h += '<tr class="is-clickable row-' + (tone === 'neutral' ? 'brand' : tone) + '" data-claim="' + c.id + '">' +
        '<td style="width:44%"><div class="stack gap-1">' +
          '<div class="row gap-2"><span class="t-subtitle2 tone-primary mono">' + c.id + '</span>' + verdictBadge(c.verdict) + '</div>' +
          '<span class="t-caption">' + esc(c.vendor) + ' · ' + esc(c.program) + '</span>' +
        '</div></td>' +
        '<td><span class="t-body2">' + esc(c.headline) + '</span></td>' +
        '<td class="align-right" style="white-space:nowrap"><div class="stack gap-1">' +
          '<span class="t-subtitle2 num">' + money(c.amount) + '</span>' +
          (c.exposure ? '<span class="t-caption tone-error">' + money(c.exposure) + ' at risk</span>' : '<span class="t-caption">no exposure</span>') +
        '</div></td>' +
        '<td style="width:28px" class="tone-tertiary">' + icon('right', 16) + '</td>' +
      '</tr>';
    });
    h += '</tbody></table></div></div></div>';

    /* Right column */
    h += '<div class="stack gap-4">';

    h += '<div class="card"><div class="card__head"><h6>Queue composition</h6></div><div class="card__body stack gap-4">' +
      meterRow('Auto-approve', byVerdict.AUTO_APPROVE, t.count, C.success) +
      meterRow('Validated', byVerdict.VALIDATED, t.count, C.success) +
      meterRow('Awaiting vendor', byVerdict.AWAITING_VENDOR, t.count, C.gray500) +
      meterRow('Moderate flag', byVerdict.MODERATE_FLAG, t.count, C.warning) +
      meterRow('High aberration', byVerdict.HIGH_ABERRATION, t.count, C.error) +
      '</div></div>';

    h += '<div class="card"><div class="card__head"><h6>Payment run</h6></div><div class="card__body stack gap-3">' +
      '<div class="row gap-3"><span class="t-body2 tone-secondary">Next run</span><span class="spacer"></span><span class="t-subtitle2">Mon 03 Aug 2026</span></div>' +
      '<div class="row gap-3"><span class="t-body2 tone-secondary">Cut-off for certification</span><span class="spacer"></span><span class="t-subtitle2">Fri 31 Jul, 17:00</span></div>' +
      '<div class="row gap-3"><span class="t-body2 tone-secondary">Above sign-off threshold</span><span class="spacer"></span>' +
      '<span class="badge badge--' + (t.seniorSignOff ? 'warning' : 'success') + '">' + plural(t.seniorSignOff, 'claim') + '</span></div>' +
      '<div class="divider"></div>' +
      '<p class="t-caption">Claims above ' + moneyM(DATA.THRESHOLDS.seniorSignOff) + ' require CFO sign-off. Missing the Friday cut-off pushes settlement to the 10 August run and breaches agreed payment terms on two contracts.</p>' +
      '</div></div>';

    h += '</div></div>'; /* end two columns */

    /* Agent trace + systems */
    h += '<div class="grid g-2 mt-6">';
    h += '<div class="card"><div class="card__head"><div class="stack gap-1"><h6>Agent run — last cycle</h6>' +
      '<span class="t-caption">Completed 06:40 · 10 claims · 120 checks executed</span></div></div>' +
      '<div class="card__body"><div class="trace">' +
      [
        { t: '06:31', n: 'Retrieval Agent', d: 'Pulled 10 claim packs, 10 purchase orders, 14 rate schedules and 38 months of payment history.', tone: 'success' },
        { t: '06:34', n: 'Validation Agent', d: 'Executed the 12-point check suite on every claim. 114 passed, 5 flagged, 1 awaiting vendor response.', tone: 'warning' },
        { t: '06:38', n: 'Validation Agent', d: 'Benchmarked 36 line items against 14 maintained norms and 22 comparable programs.', tone: 'success' },
        { t: '06:40', n: 'Communication Agent', d: 'Drafted 2 vendor queries and routed 2 claims to CFO sign-off. 1 query awaiting response for 5 days.', tone: 'brand' }
      ].map(function (r, i, arr) {
        var col = r.tone === 'warning' ? C.warning : r.tone === 'brand' ? C.brand : C.success;
        return '<div class="trace__row"><div class="trace__rail">' +
          '<span style="width:9px;height:9px;border-radius:50%;background:' + col + ';margin-top:5px;flex:none"></span>' +
          (i < arr.length - 1 ? '<span class="trace__line"></span>' : '') +
          '</div><div class="trace__body"><div class="row gap-2"><span class="t-subtitle2">' + r.n + '</span>' +
          '<span class="t-caption mono">' + r.t + '</span></div>' +
          '<p class="t-body2 tone-secondary">' + esc(r.d) + '</p></div></div>';
      }).join('') +
      '</div></div></div>';

    h += '<div class="card"><div class="card__head"><div class="stack gap-1"><h6>Connected sources</h6>' +
      '<span class="t-caption">Read-only. PaymentsIQ never writes back to a source system.</span></div></div>' +
      '<div class="card__body"><div class="stack gap-3">' +
      DATA.SYSTEMS.map(function (s) {
        return '<div class="row gap-3"><span class="pulse"></span><div class="stack" style="min-width:0">' +
          '<span class="t-subtitle2 tone-primary">' + esc(s.name) + '</span>' +
          '<span class="t-caption">' + esc(s.detail) + '</span></div>' +
          '<span class="spacer"></span><span class="badge badge--success">Connected</span></div>';
      }).join('') +
      '</div></div></div>';
    h += '</div>';

    return h;
  }

  /* ==========================================================================
     View: Payments (validation queue)
     ========================================================================== */
  function viewPayments() {
    var open = openClaims();
    var counts = { ALL: DATA.CLAIMS.length };
    Object.keys(DATA.VERDICT).forEach(function (k) {
      counts[k] = DATA.CLAIMS.filter(function (c) { return c.verdict === k; }).length;
    });

    var rows = DATA.CLAIMS.filter(function (c) {
      if (state.filter !== 'ALL' && c.verdict !== state.filter) return false;
      if (!state.search) return true;
      var q = state.search.toLowerCase();
      return (c.id + ' ' + c.vendor + ' ' + c.program + ' ' + c.category).toLowerCase().indexOf(q) > -1;
    });

    var h = '';
    h += '<div class="row gap-4 mb-6 wrap">' +
      '<div class="stack gap-1"><span class="t-overline">Period 6 · run date 03 Aug 2026</span>' +
      '<h4>Claim validation queue</h4>' +
      '<p class="t-body2 tone-secondary">Every claim is benchmarked line by line before it reaches a human. Only exceptions need a decision.</p></div>' +
      '<span class="spacer"></span>' +
      '<button class="btn btn--secondary" data-act="export">' + icon('file', 16) + 'Export queue</button>' +
      '<button class="btn btn--primary" data-act="release-clean">Release ' +
        open.filter(function (c) { return c.verdict === 'VALIDATED' || c.verdict === 'AUTO_APPROVE'; }).length +
        ' clean claims</button>' +
      '</div>';

    /* Filters */
    h += '<div class="row gap-2 mb-4 wrap">';
    h += '<button class="chip" aria-pressed="' + (state.filter === 'ALL') + '" data-filter="ALL">All <span class="chip__count">' + counts.ALL + '</span></button>';
    ['HIGH_ABERRATION', 'MODERATE_FLAG', 'AWAITING_VENDOR', 'VALIDATED', 'AUTO_APPROVE'].forEach(function (k) {
      h += '<button class="chip" aria-pressed="' + (state.filter === k) + '" data-filter="' + k + '">' +
        '<span class="badge__dot" style="background:' + verdictColor(k) + '"></span>' +
        DATA.VERDICT[k].label + ' <span class="chip__count">' + counts[k] + '</span></button>';
    });
    h += '<span class="spacer"></span>';
    h += '<div class="searchbox" style="width:260px">' + icon('search', 16, 'tone-tertiary') +
      '<input id="q" type="search" placeholder="Claim, vendor or program" value="' + esc(state.search) + '"></div>';
    h += '</div>';

    /* Table */
    h += '<div class="card"><div class="card__body card__body--flush"><div class="table-wrap"><table class="table">' +
      '<thead><tr>' +
      '<th>Claim</th><th>Vendor / program</th><th>Category</th><th class="align-right">Claim value</th>' +
      '<th>AI verdict</th><th class="align-right">At risk</th><th>Approver</th><th></th>' +
      '</tr></thead><tbody>';

    if (!rows.length) {
      h += '<tr><td colspan="8"><div class="empty"><p class="t-subtitle1">No claims match this filter.</p>' +
        '<p class="t-caption">Clear the search or pick another verdict.</p></div></td></tr>';
    }

    rows.forEach(function (c) {
      var dec = state.decisions[c.id];
      var tone = DATA.VERDICT[c.verdict].tone;
      h += '<tr class="is-clickable ' + (tone === 'error' ? 'row-error' : tone === 'warning' ? 'row-warning' : '') + '" data-claim="' + c.id + '">' +
        '<td><div class="stack gap-1"><span class="t-subtitle2 mono">' + c.id + '</span>' +
          '<span class="t-caption">' + esc(c.submitted) + ' · ' + esc(c.period) + '</span></div></td>' +
        '<td><div class="stack gap-1"><span class="t-body2">' + esc(c.vendor) + '</span>' +
          '<span class="t-caption">' + esc(c.program) + '</span></div></td>' +
        '<td><span class="badge badge--neutral">' + esc(c.category) + '</span></td>' +
        '<td class="align-right num t-subtitle2">' + money(c.amount) + '</td>' +
        '<td>' + (dec
          ? '<span class="badge badge--' + (dec.tone) + '">' + esc(dec.label) + '</span>'
          : verdictBadge(c.verdict)) + '</td>' +
        '<td class="align-right num ' + (c.exposure ? 'tone-error t-subtitle2' : 'tone-tertiary t-body2') + '">' +
          (c.exposure ? money(c.exposure) : '—') + '</td>' +
        '<td><span class="t-caption">' + esc(DATA.approverFor(c.amount)) + '</span></td>' +
        '<td class="tone-tertiary">' + icon('right', 16) + '</td>' +
      '</tr>';
    });

    h += '</tbody></table></div></div>' +
      '<div class="card__foot"><span class="t-caption">Showing ' + rows.length + ' of ' + DATA.CLAIMS.length + ' claims</span>' +
      '<span class="spacer"></span><span class="t-caption">Queue value <strong class="tone-primary num">' +
      money(rows.reduce(function (a, c) { return a + c.amount; }, 0)) + '</strong></span></div></div>';

    return h;
  }

  /* ==========================================================================
     View: Reports
     ========================================================================== */
  function viewReports() {
    var h = '';
    h += '<div class="row gap-4 mb-6 wrap"><div class="stack gap-1">' +
      '<span class="t-overline">Rolling 8 weeks · all categories</span>' +
      '<h4>Validation performance</h4>' +
      '<p class="t-body2 tone-secondary">How much value the check suite is intercepting before it leaves the business.</p>' +
      '</div><span class="spacer"></span>' +
      '<select class="select" style="width:190px"><option>Last 8 weeks</option><option>Quarter to date</option><option>Year to date</option></select>' +
      '</div>';

    h += '<div class="grid g-4 mb-6">' +
      kpi({ label: 'Value validated YTD', value: '$412M', hint: 'Across 318 supplier claims', accent: C.gray500 }) +
      kpi({ label: 'Recovered pre-payment', value: '$4.97M', hint: 'Withheld or corrected before release', accent: C.success,
            delta: '1.21% of validated value', deltaTone: 'tone-success', deltaIcon: 'up' }) +
      kpi({ label: 'Straight-through rate', value: '71%', hint: 'Claims closed with no human touch', accent: C.brand,
            delta: '+9 pts vs Q1', deltaTone: 'tone-success', deltaIcon: 'up' }) +
      kpi({ label: 'Median cycle time', value: '1.4 d', hint: 'Submission to certification', accent: C.gray500,
            delta: '−3.1 d vs manual baseline', deltaTone: 'tone-success', deltaIcon: 'down' }) +
      '</div>';

    h += '<div class="card mb-6"><div class="card__head"><div class="stack gap-1">' +
      '<h6>Weekly claim value — cleared vs flagged</h6>' +
      '<span class="t-caption">Bar totals are claim value in $M. Flagged value is held pending analyst decision.</span>' +
      '</div><span class="spacer"></span>' +
      '<button class="btn btn--secondary btn--sm" data-act="toggle-weekly-table">' + (state.showWeeklyTable ? 'Hide table' : 'Show table') + '</button>' +
      '</div><div class="card__body"><div id="chart-weekly"></div>' +
      '<div class="mt-4">' + legend([{ color: C.success, label: 'Cleared — released without intervention' }, { color: C.brand, label: 'Flagged — held for review' }]) + '</div>';

    if (state.showWeeklyTable) {
      h += '<div class="table-wrap mt-4"><table class="table"><thead><tr><th>Week</th>' +
        '<th class="align-right">Cleared ($M)</th><th class="align-right">Flagged ($M)</th><th class="align-right">At risk ($M)</th></tr></thead><tbody>' +
        DATA.WEEKLY.map(function (w) {
          return '<tr><td class="t-subtitle2">' + w.label + '</td><td class="align-right num">' + w.cleared.toFixed(1) +
            '</td><td class="align-right num">' + w.flagged.toFixed(1) + '</td><td class="align-right num">' + w.atRisk.toFixed(2) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    h += '</div></div>';

    h += '<div class="grid g-2 mb-6">' +
      '<div class="card"><div class="card__head"><div class="stack gap-1"><h6>Rate variance vs benchmark ceiling</h6>' +
      '<span class="t-caption">Average claimed rate against the maintained norm, weighted by spend.</span></div></div>' +
      '<div class="card__body"><div id="chart-variance"></div>' +
      '<div class="mt-4">' + legend([{ color: C.error, label: 'Above benchmark ceiling' }, { color: C.success, label: 'At or below ceiling' }]) + '</div></div></div>' +

      '<div class="card"><div class="card__head"><div class="stack gap-1"><h6>Value at risk per week</h6>' +
      '<span class="t-caption">Over-claim identified by the agents but not yet withheld.</span></div></div>' +
      '<div class="card__body"><div id="chart-atrisk"></div></div></div>' +
      '</div>';

    h += '<div class="grid g-2 grid--start">' +
      '<div class="card"><div class="card__head"><div class="stack gap-1"><h6>Recovered before payment</h6>' +
      '<span class="t-caption">Value withheld or corrected at source, by month.</span></div></div>' +
      '<div class="card__body"><div id="chart-recovery"></div></div></div>' +

      '<div class="card"><div class="card__head"><h6>Vendor risk register</h6></div>' +
      '<div class="card__body card__body--flush"><div class="table-wrap"><table class="table"><thead><tr>' +
      '<th>Vendor</th><th class="align-center">Claims</th><th class="align-center">Flagged</th>' +
      '<th class="align-right">Exposure</th><th>Trend</th></tr></thead><tbody>' +
      DATA.VENDOR_RISK.map(function (v) {
        var trendIcon = v.trend === 'up' ? icon('up', 14) : v.trend === 'down' ? icon('down', 14) : icon('minus', 14);
        var trendTone = v.trend === 'up' ? 'tone-error' : v.trend === 'down' ? 'tone-success' : 'tone-tertiary';
        return '<tr><td><div class="stack gap-1"><span class="t-body2">' + esc(v.vendor) + '</span>' +
          '<span class="t-caption">' + esc(v.note) + '</span></div></td>' +
          '<td class="align-center num t-body2">' + v.claims + '</td>' +
          '<td class="align-center">' + (v.flagged
            ? '<span class="badge badge--' + (v.flagged >= 3 ? 'error' : 'warning') + '">' + v.flagged + '</span>'
            : '<span class="badge badge--success">0</span>') + '</td>' +
          '<td class="align-right num ' + (v.exposure ? 'tone-error t-subtitle2' : 'tone-tertiary t-body2') + '">' +
            (v.exposure ? money(v.exposure) : '—') + '</td>' +
          '<td><span class="row gap-1 ' + trendTone + '">' + trendIcon + '</span></td></tr>';
      }).join('') +
      '</tbody></table></div></div></div>' +
      '</div>';

    return h;
  }

  function mountReportCharts() {
    var a = $('#chart-weekly');   if (a) a.appendChild(chartStackedWeekly());
    var b = $('#chart-variance'); if (b) b.appendChild(chartCategoryVariance());
    var c = $('#chart-atrisk');   if (c) c.appendChild(chartAtRisk());
    var d = $('#chart-recovery'); if (d) d.appendChild(chartRecovery());
  }

  /* ==========================================================================
     View: Settings
     ========================================================================== */
  function viewSettings() {
    var h = '';
    h += '<div class="stack gap-1 mb-6"><span class="t-overline">Configuration</span><h4>Benchmarks &amp; controls</h4>' +
      '<p class="t-body2 tone-secondary">Norms drive every variance the Validation Agent reports. Changes are versioned and take effect on the next agent cycle.</p></div>';

    /* Benchmarks */
    h += '<div class="card mb-6"><div class="card__head"><div class="stack gap-1"><h6>Benchmark norms</h6>' +
      '<span class="t-caption">' + state.benchmarks.length + ' maintained parameters across 6 spend categories</span></div>' +
      '<span class="spacer"></span><button class="btn btn--secondary btn--sm" data-act="reset-benchmarks">Reset to seed</button></div>' +
      '<div class="card__body card__body--flush"><div class="table-wrap"><table class="table"><thead><tr>' +
      '<th>Parameter</th><th>Category</th><th class="align-right">Norm min</th><th class="align-right">Norm max</th>' +
      '<th>Unit</th><th>Source</th><th>Last updated</th></tr></thead><tbody>';

    state.benchmarks.forEach(function (b) {
      h += '<tr><td class="t-subtitle2">' + esc(b.parameter) + '</td>' +
        '<td><span class="badge badge--neutral">' + esc(b.category) + '</span></td>' +
        '<td class="align-right"><input class="input input--sm num" style="width:96px;text-align:right" data-bm="' + b.id + '" data-k="min" value="' + b.min.toFixed(2) + '"></td>' +
        '<td class="align-right"><input class="input input--sm num" style="width:96px;text-align:right" data-bm="' + b.id + '" data-k="max" value="' + b.max.toFixed(2) + '"></td>' +
        '<td class="t-caption">' + esc(b.unit) + '</td>' +
        '<td class="t-caption">' + esc(b.source) + '</td>' +
        '<td><div class="stack gap-1"><span class="t-caption tone-primary">' + esc(b.updatedAt) + '</span>' +
        '<span class="t-caption">' + esc(b.updatedBy) + '</span></div></td></tr>';
    });
    h += '</tbody></table></div></div>' +
      '<div class="card__foot"><span class="t-caption">Edits are staged locally in this prototype.</span><span class="spacer"></span>' +
      '<button class="btn btn--primary btn--sm" data-act="save-benchmarks">Save benchmark set</button></div></div>';

    /* Thresholds + agents */
    h += '<div class="grid g-2 grid--start">';

    h += '<div class="card"><div class="card__head"><div class="stack gap-1"><h6>Approval delegation</h6>' +
      '<span class="t-caption">Determines who a claim is routed to once validated.</span></div></div>' +
      '<div class="card__body stack gap-4">' +
      [
        { r: 'Straight-through release', v: 'Below ' + money(DATA.THRESHOLDS.autoApprove), tone: 'success' },
        { r: 'Senior Finance Analyst',   v: money(DATA.THRESHOLDS.autoApprove) + ' – ' + money(DATA.THRESHOLDS.analyst), tone: 'neutral' },
        { r: 'VP Finance',               v: money(DATA.THRESHOLDS.analyst) + ' – ' + money(DATA.THRESHOLDS.vpFinance), tone: 'neutral' },
        { r: 'Chief Financial Officer',  v: 'Above ' + money(DATA.THRESHOLDS.vpFinance), tone: 'warning' }
      ].map(function (t) {
        return '<div class="row gap-3"><span class="badge badge--' + t.tone + '"><span class="badge__dot"></span>' + esc(t.r) + '</span>' +
          '<span class="spacer"></span><span class="t-subtitle2 num">' + t.v + '</span></div>';
      }).join('') +
      '<div class="divider"></div>' +
      '<p class="t-caption">A claim carrying a high aberration is always routed one level above its value band, regardless of amount.</p>' +
      '</div></div>';

    h += '<div class="card"><div class="card__head"><div class="stack gap-1"><h6>Agents</h6>' +
      '<span class="t-caption">Run on submission and again at 06:30 each working day.</span></div></div>' +
      '<div class="card__body stack gap-4">' +
      DATA.AGENTS.map(function (a) {
        return '<div class="row gap-3"><span class="pulse"></span><div class="stack" style="min-width:0">' +
          '<span class="t-subtitle2 tone-primary">' + esc(a.name) + '</span>' +
          '<span class="t-caption">' + esc(a.detail) + '</span></div>' +
          '<span class="spacer"></span><span class="badge badge--success">Active</span></div>';
      }).join('') +
      '<div class="divider"></div>' +
      '<div class="row gap-3"><span class="t-body2 tone-secondary">Vendor query response window</span><span class="spacer"></span>' +
      '<select class="select select--sm" style="width:158px"><option>5 working days</option><option>3 working days</option><option>10 working days</option></select></div>' +
      '<div class="row gap-3"><span class="t-body2 tone-secondary">Variance tolerance before flag</span><span class="spacer"></span>' +
      '<select class="select select--sm" style="width:158px"><option>±2.0%</option><option>±1.0%</option><option>±5.0%</option></select></div>' +
      '</div></div>';

    h += '</div>';
    return h;
  }

  /* ==========================================================================
     Claim drawer
     ========================================================================== */
  function drawerAnalysis(c) {
    var v = DATA.VERDICT[c.verdict];
    var h = '';

    h += '<div class="callout callout--' + (v.tone === 'neutral' ? 'neutral' : v.tone) + ' mb-6">' +
      '<div class="row gap-2 mb-2">' + icon(v.tone === 'success' ? 'check' : v.tone === 'neutral' ? 'clock' : 'alert', 18) +
      '<span class="t-overline tone-' + (v.tone === 'neutral' ? 'secondary' : v.tone) + '">' + esc(v.label) + '</span></div>' +
      '<p class="t-body1">' + esc(c.headline) + '</p>' +
      '<p class="t-body2 tone-secondary mt-2">' + esc(v.blurb) + '</p></div>';

    h += '<div class="grid g-4 mb-6">' +
      kpi({ label: 'Claim value', value: money(c.amount), hint: esc(c.period), accent: C.gray500 }) +
      kpi({ label: 'Value at risk', value: c.exposure ? money(c.exposure) : '—', hint: c.exposure ? 'Recommended withholding' : 'No exception found', accent: c.exposure ? C.error : C.success }) +
      kpi({ label: 'Certifiable now', value: money(c.amount - c.exposure), hint: 'Undisputed value', accent: C.success }) +
      kpi({ label: 'Routed to', value: '<span style="font-size:18px;line-height:1.3;display:block">' + esc(DATA.approverFor(c.amount)) + '</span>', hint: 'Per delegation matrix', accent: C.brand }) +
      '</div>';

    /* Aberrations */
    if (c.aberrations.length) {
      h += '<div class="card mb-6"><div class="card__head"><div class="stack gap-1">' +
        '<h6>What the agents found</h6><span class="t-caption">Ranked by value impact</span></div>' +
        '<span class="spacer"></span><span class="badge badge--' + v.tone + '">' + c.aberrations.length + ' findings</span></div>' +
        '<div class="card__body stack gap-4">' +
        c.aberrations.map(function (a, i) {
          return '<div class="row gap-3" style="align-items:flex-start">' +
            '<span class="badge badge--neutral mono" style="margin-top:2px">' + (i + 1) + '</span>' +
            '<p class="t-body2">' + esc(a) + '</p></div>';
        }).join('') +
        '</div></div>';
    }

    /* Line items */
    h += '<div class="card mb-6"><div class="card__head"><div class="stack gap-1"><h6>Line items vs benchmark</h6>' +
      '<span class="t-caption">' + esc(c.benchmarkNote) + '</span></div></div>' +
      '<div class="card__body card__body--flush"><div class="table-wrap"><table class="table"><thead><tr>' +
      '<th>Line item</th><th>Unit</th><th class="align-right">Qty</th><th class="align-right">Rate (USD)</th>' +
      '<th class="align-right">Amount (USD)</th><th>Benchmark</th><th class="align-right">Variance</th><th>Flag</th>' +
      '</tr></thead><tbody>';

    c.lineItems.forEach(function (li) {
      var cls = li.flag === 'HIGH' ? 'row-error' : li.flag === 'MODERATE' ? 'row-warning' : '';
      h += '<tr class="' + cls + '"><td class="t-subtitle2">' + esc(li.item) + '</td>' +
        '<td class="t-caption">' + esc(li.unit) + '</td>' +
        '<td class="align-right num t-body2">' + (li.qty === null ? '—' : li.qty.toLocaleString('en-US')) + '</td>' +
        '<td class="align-right num t-body2">' + (li.unit === '% of claim' ? li.rate.toFixed(1) + '%' : li.rate.toFixed(2)) + '</td>' +
        '<td class="align-right num t-subtitle2">' + money(li.amount) + '</td>' +
        '<td class="t-caption">' + esc(li.benchmark) + '</td>' +
        '<td class="align-right num ' + (li.variance > 0 ? 't-subtitle2 tone-error' : 't-body2 tone-tertiary') + '">' +
          (li.variance > 0 ? '+' + li.variance.toFixed(1) + '%' : '—') + '</td>' +
        '<td>' + flagBadge(li.flag) + '</td></tr>';
    });

    h += '</tbody><tfoot><tr><td colspan="4" class="t-subtitle2" style="padding:16px">Total claimed</td>' +
      '<td class="align-right num t-h6" style="padding:16px">' + money(c.amount) + '</td><td colspan="3"></td></tr></tfoot>' +
      '</table></div></div></div>';

    /* Comparables */
    h += '<div class="grid g-2">';
    h += '<div class="card"><div class="card__head"><div class="stack gap-1"><h6>Comparable claims</h6>' +
      '<span class="t-caption">Similar scope and volume, certified in the last 4 periods</span></div></div>' +
      '<div class="card__body card__body--flush"><div class="table-wrap"><table class="table"><thead><tr>' +
      '<th>Claim</th><th>Vendor</th><th>Period</th><th class="align-right">Value</th><th class="align-right">Key rate</th></tr></thead><tbody>' +
      c.comparables.map(function (p) {
        return '<tr><td class="mono t-caption">' + esc(p.id) + '</td>' +
          '<td class="t-body2">' + esc(p.vendor) + '</td>' +
          '<td class="t-caption">' + esc(p.date) + '</td>' +
          '<td class="align-right num t-body2">' + money(p.value) + '</td>' +
          '<td class="align-right num t-subtitle2">' + p.rate.toFixed(2) + '</td></tr>';
      }).join('') + '</tbody></table></div></div></div>';

    h += '<div class="card"><div class="card__head"><h6>Recommendation</h6></div>' +
      '<div class="card__body stack gap-4">' +
      '<div class="callout callout--' + (c.exposure ? 'warning' : 'success') + '"><p class="t-body2">' + esc(c.recommendation) + '</p></div>' +
      '<div class="dl">' +
        '<dt>Claimed</dt><dd class="num t-subtitle2">' + money(c.amount) + '</dd>' +
        '<dt>Recommended withholding</dt><dd class="num t-subtitle2 ' + (c.exposure ? 'tone-error' : '') + '">' + (c.exposure ? money(c.exposure) : 'None') + '</dd>' +
        '<dt>Recommended certification</dt><dd class="num t-subtitle2 tone-success">' + money(c.amount - c.exposure) + '</dd>' +
        '<dt>Payment run</dt><dd class="t-body2">Mon 03 Aug 2026</dd>' +
      '</div></div></div>';
    h += '</div>';

    return h;
  }

  function drawerChecks(c) {
    var checks = DATA.checksFor(c);
    var passed = checks.filter(function (x) { return x.result === 'PASSED'; }).length;
    var flagged = checks.filter(function (x) { return x.result === 'FLAGGED'; }).length;
    var waiting = checks.filter(function (x) { return x.result === 'WAITING'; }).length;

    var h = '<div class="grid g-3 mb-6">' +
      kpi({ label: 'Checks passed', value: passed + ' / ' + checks.length, hint: 'Automated, no human touch', accent: C.success }) +
      kpi({ label: 'Checks flagged', value: String(flagged), hint: flagged ? 'Require analyst judgement' : 'None', accent: flagged ? C.error : C.gray500 }) +
      kpi({ label: 'Awaiting response', value: String(waiting), hint: waiting ? 'Vendor query outstanding' : 'None', accent: waiting ? C.warning : C.gray500 }) +
      '</div>';

    h += '<div class="card"><div class="card__head"><div class="stack gap-1"><h6>12-point check suite</h6>' +
      '<span class="t-caption">Executed by the Validation Agent at 06:34 · every result is traceable to a source system</span></div></div>' +
      '<div class="card__body card__body--flush">';

    checks.forEach(function (x, i) {
      var kind = x.result === 'PASSED' ? 'pass' : x.result === 'FLAGGED' ? 'flag' : 'wait';
      var ic = x.result === 'PASSED' ? 'check' : x.result === 'FLAGGED' ? 'alert' : 'clock';
      h += '<div class="row gap-4" style="align-items:flex-start;padding:16px 24px;' +
        (i < checks.length - 1 ? 'border-bottom:1px solid var(--border-subtle);' : '') + '">' +
        '<span class="checkicon checkicon--' + kind + '">' + icon(ic, 13) + '</span>' +
        '<div class="stack gap-1" style="min-width:0;flex:1">' +
          '<div class="row gap-2 wrap"><span class="t-subtitle2 tone-primary">' + esc(x.name) + '</span>' +
          '<span class="badge badge--' + (kind === 'pass' ? 'success' : kind === 'flag' ? 'error' : 'warning') + '">' + esc(x.result) + '</span></div>' +
          '<p class="t-body2 tone-secondary">' + esc(x.detail) + '</p>' +
          '<span class="t-caption">Source: ' + esc(x.system) + '</span>' +
        '</div></div>';
    });

    h += '</div></div>';
    return h;
  }

  function drawerPO(c) {
    var p = c.po;
    var drawn = p.paidToDate + p.thisClaim;
    var h = '';

    h += '<div class="grid g-4 mb-6">' +
      kpi({ label: 'Total PO value', value: money(p.totalValue), hint: esc(p.ref), accent: C.gray500 }) +
      kpi({ label: 'Paid to date', value: money(p.paidToDate), hint: pct(p.paidToDate / p.totalValue * 100) + ' of PO', accent: C.gray500 }) +
      kpi({ label: 'This claim', value: money(p.thisClaim), hint: 'Certification pending', accent: C.brand }) +
      kpi({ label: 'Remaining after', value: money(p.totalValue - drawn), hint: pct((p.totalValue - drawn) / p.totalValue * 100) + ' of PO uncommitted', accent: C.success }) +
      '</div>';

    h += '<div class="card mb-6"><div class="card__head"><h6>PO drawdown</h6><span class="spacer"></span>' +
      '<span class="t-caption">' + pct(drawn / p.totalValue * 100) + ' committed after this claim</span></div>' +
      '<div class="card__body stack gap-4">' +
      '<div class="meter" style="height:14px;background:' + C.gray100 + '">' +
        '<span class="meter__fill" style="width:' + (p.paidToDate / p.totalValue * 100) + '%;background:' + C.gray500 + '"></span>' +
        '<span style="width:2px;background:' + C.canvas + '"></span>' +
        '<span class="meter__fill" style="width:' + (p.thisClaim / p.totalValue * 100) + '%;background:' + C.brand + '"></span>' +
      '</div>' +
      legend([{ color: C.gray500, label: 'Paid to date' }, { color: C.brand, label: 'This claim' }, { color: C.gray100, label: 'Uncommitted' }]) +
      '</div></div>';

    h += '<div class="grid g-2 mb-6">';
    h += '<div class="card"><div class="card__head"><h6>Purchase order</h6></div><div class="card__body"><div class="dl">' +
      '<dt>PO reference</dt><dd class="mono t-body2">' + esc(p.ref) + '</dd>' +
      '<dt>Description</dt><dd class="t-body2">' + esc(p.description) + '</dd>' +
      '<dt>Vendor (legal)</dt><dd class="t-body2">' + esc(p.vendorLegal) + '</dd>' +
      '<dt>Approved</dt><dd class="t-body2">' + esc(p.approvedDate) + ' by ' + esc(p.approvedBy) + '</dd>' +
      '<dt>Status</dt><dd><span class="badge badge--success">' + esc(p.status) + '</span></dd>' +
      '<dt>Payment terms</dt><dd class="t-body2">' + esc(p.terms) + '</dd>' +
      '<dt>Holdback</dt><dd class="t-body2">' + (p.holdback ? pct(p.holdback * 100, 0) + ' — ' + money(Math.round(c.amount * p.holdback)) + ' on this claim' : 'None') + '</dd>' +
      '</div></div></div>';

    h += '<div class="card"><div class="card__head"><h6>Claim history on this PO</h6></div>' +
      '<div class="card__body card__body--flush"><div class="table-wrap"><table class="table"><thead><tr>' +
      '<th>Claim</th><th>Period</th><th class="align-right">Claimed</th><th class="align-right">Certified</th><th>Status</th></tr></thead><tbody>' +
      (p.history.length ? p.history.map(function (r) {
        var part = r.approved < r.claimed;
        return '<tr><td class="mono t-caption">' + esc(r.ref) + '</td><td class="t-caption">' + esc(r.period) + '</td>' +
          '<td class="align-right num t-body2">' + money(r.claimed) + '</td>' +
          '<td class="align-right num t-subtitle2 ' + (part ? 'tone-warning' : '') + '">' + money(r.approved) + '</td>' +
          '<td><span class="badge badge--' + (part ? 'warning' : 'success') + '">' + esc(r.status) + '</span></td></tr>';
      }).join('') : '<tr><td colspan="5" class="t-caption" style="padding:24px">First claim against this PO.</td></tr>') +
      '</tbody></table></div></div></div>';
    h += '</div>';

    return h;
  }

  function drawerDocs(c) {
    var h = '<div class="card mb-6"><div class="card__head"><div class="stack gap-1"><h6>Claim pack</h6>' +
      '<span class="t-caption">Retrieved and parsed by the Retrieval Agent — every figure in this claim traces back to one of these</span></div></div>' +
      '<div class="card__body stack gap-3">' +
      c.documents.map(function (d) {
        return '<div class="row gap-3" style="padding:12px 16px;border:1px solid var(--border-subtle);border-radius:8px">' +
          '<span class="tone-tertiary">' + icon('file', 18) + '</span>' +
          '<div class="stack" style="min-width:0"><span class="t-subtitle2 tone-primary">' + esc(d.name) + '</span>' +
          '<span class="t-caption">' + esc(d.size) + '</span></div><span class="spacer"></span>' +
          '<span class="badge badge--success">' + icon('check', 11) + esc(d.state) + '</span></div>';
      }).join('') +
      '</div></div>';

    if (c.correspondence) {
      var m = c.correspondence;
      h += '<div class="card"><div class="card__head"><div class="row gap-2">' + icon('mail', 18, 'tone-tertiary') +
        '<h6>Vendor correspondence</h6></div><span class="spacer"></span>' +
        '<span class="badge badge--warning">' + esc(m.state) + '</span></div>' +
        '<div class="card__body stack gap-4">' +
        '<div class="dl">' +
          '<dt>From</dt><dd class="t-body2">' + esc(m.from) + '</dd>' +
          '<dt>To</dt><dd class="t-body2">' + esc(m.to) + '</dd>' +
          '<dt>Date</dt><dd class="t-body2">' + esc(m.date) + '</dd>' +
          '<dt>Subject</dt><dd class="t-subtitle2 tone-primary">' + esc(m.subject) + '</dd>' +
        '</div><div class="divider"></div>' +
        '<div class="stack gap-3">' + m.body.split('\n\n').map(function (para) {
          return '<p class="t-body2">' + esc(para) + '</p>';
        }).join('') + '</div>' +
        '<div class="row gap-2"><button class="btn btn--secondary btn--sm" data-act="chase">Send reminder</button>' +
        '<button class="btn btn--ghost btn--sm" data-act="escalate">Escalate to category lead</button></div>' +
        '</div></div>';
    } else {
      h += '<div class="card"><div class="card__body"><div class="empty">' +
        '<p class="t-subtitle1">No open correspondence</p>' +
        '<p class="t-caption mt-2">This claim cleared without a vendor query. The Communication Agent will draft one automatically if a check flags.</p>' +
        '</div></div></div>';
    }
    return h;
  }

  function renderDrawer() {
    var host = $('#drawer-root');
    host.innerHTML = '';
    if (!state.openClaim) return;
    var c = claimById(state.openClaim);
    if (!c) return;

    var dec = state.decisions[c.id];
    var tabs = [
      { k: 'analysis', l: 'Claim &amp; AI analysis' },
      { k: 'checks',   l: 'Validation checks' },
      { k: 'po',       l: 'PO &amp; financials' },
      { k: 'docs',     l: 'Documents' }
    ];

    var body = state.tab === 'checks' ? drawerChecks(c)
      : state.tab === 'po' ? drawerPO(c)
      : state.tab === 'docs' ? drawerDocs(c)
      : drawerAnalysis(c);

    var h = '<div class="scrim" data-close-scrim><div class="drawer" role="dialog" aria-modal="true" aria-label="Claim ' + c.id + '">';

    h += '<div class="drawer__head"><div class="row gap-4 wrap">' +
      '<div class="stack gap-1" style="min-width:0">' +
        '<div class="row gap-2 wrap"><span class="t-overline">' + esc(c.category) + ' · ' + esc(c.period) + '</span>' + verdictBadge(c.verdict) + '</div>' +
        '<h5>' + c.id + ' — ' + esc(c.vendor) + '</h5>' +
        '<span class="t-body2 tone-secondary">' + esc(c.program) + ' · submitted ' + esc(c.submitted) + ' · ' + money(c.amount) + '</span>' +
      '</div><span class="spacer"></span>' +
      '<button class="btn btn--ghost btn--sm" data-close>' + icon('close', 18) + '</button>' +
      '</div></div>';

    h += '<div class="drawer__tabs"><div class="tabs">' + tabs.map(function (t) {
      return '<button class="tab" role="tab" aria-selected="' + (state.tab === t.k) + '" data-tab="' + t.k + '">' + t.l + '</button>';
    }).join('') + '</div></div>';

    h += '<div class="drawer__body">' + body + '</div>';

    /* Footer — decision bar */
    h += '<div class="drawer__foot">';
    if (dec) {
      h += '<span class="badge badge--' + dec.tone + '"><span class="badge__dot"></span>' + esc(dec.label) + '</span>' +
        '<span class="t-caption">' + esc(dec.note) + '</span><span class="spacer"></span>' +
        '<button class="btn btn--ghost" data-act="undo">Undo decision</button>';
    } else {
      h += '<div class="field" style="width:230px"><span class="t-caption">Route to</span>' +
        '<select class="select select--sm" id="approver">' +
        ['Senior Finance Analyst', 'VP Finance', 'Chief Financial Officer'].map(function (o) {
          return '<option' + (DATA.approverFor(c.amount) === o ? ' selected' : '') + '>' + o + '</option>';
        }).join('') + '</select></div>';
      h += '<span class="spacer"></span>';
      h += '<button class="btn btn--ghost" data-act="reject">Reject claim</button>';
      if (c.correspondence || c.exposure) h += '<button class="btn btn--secondary" data-act="query">Raise vendor query</button>';
      if (c.exposure) h += '<button class="btn btn--warning" data-act="part">Certify ' + money(c.amount - c.exposure) + ', withhold ' + money(c.exposure) + '</button>';
      h += '<button class="btn btn--' + (c.exposure ? 'secondary' : 'success') + '" data-act="certify">Certify in full</button>';
    }
    h += '</div>';

    h += '</div></div>';

    host.appendChild(el(h));
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    state.openClaim = null;
    state.tab = 'analysis';
    $('#drawer-root').innerHTML = '';
    document.body.style.overflow = '';
  }

  /* ==========================================================================
     Render
     ========================================================================== */
  var TITLES = {
    home:     { t: 'Command centre', s: 'Period 6 close · payment run 03 Aug 2026' },
    payments: { t: 'Payments',       s: 'Supplier claim validation queue' },
    reports:  { t: 'Reports',        s: 'Validation performance and vendor risk' },
    settings: { t: 'Settings',       s: 'Benchmarks, delegation and agents' }
  };

  function render() {
    var t = totals();

    /* Sidebar */
    var nav = [
      { k: 'home',     l: 'Home',     i: 'home' },
      { k: 'payments', l: 'Payments', i: 'payments', c: t.count },
      { k: 'reports',  l: 'Reports',  i: 'reports' },
      { k: 'settings', l: 'Settings', i: 'settings' }
    ];
    $('.sidebar__nav').innerHTML = nav.map(function (n) {
      return '<button class="navitem" data-view="' + n.k + '"' + (state.view === n.k ? ' aria-current="page"' : '') + '>' +
        '<span class="navitem__icon">' + icon(n.i, 18) + '</span>' + n.l +
        (n.c ? '<span class="navitem__count">' + n.c + '</span>' : '') + '</button>';
    }).join('');

    /* Topbar */
    $('.topbar__title').innerHTML = '<span class="t-overline">' + esc(TITLES[state.view].s) + '</span>' +
      '<span class="t-h6">' + esc(TITLES[state.view].t) + '</span>';

    /* Content */
    var c = $('.content');
    c.innerHTML = state.view === 'payments' ? viewPayments()
      : state.view === 'reports' ? viewReports()
      : state.view === 'settings' ? viewSettings()
      : viewHome();

    if (state.view === 'reports') mountReportCharts();
    renderDrawer();
  }

  /* ==========================================================================
     Events — one delegated listener for the whole app
     ========================================================================== */
  function decide(c, kind) {
    var approver = $('#approver') ? $('#approver').value : DATA.approverFor(c.amount);
    var map = {
      certify: { label: 'Certified in full', tone: 'success', note: money(c.amount) + ' released to the 03 Aug run · approved by ' + approver },
      part:    { label: 'Part-certified',    tone: 'warning', note: money(c.amount - c.exposure) + ' certified, ' + money(c.exposure) + ' withheld · approved by ' + approver },
      query:   { label: 'Query raised',      tone: 'warning', note: 'Vendor query issued, 5 working day response window' },
      reject:  { label: 'Rejected',          tone: 'error',   note: 'Returned to vendor for resubmission · ' + approver }
    };
    state.decisions[c.id] = Object.assign({ action: kind, approver: approver }, map[kind]);
    toast(c.id + ' — ' + map[kind].label.toLowerCase() + '.', kind === 'reject' ? 'error' : kind === 'certify' ? '' : 'brand');
    closeDrawer();
    render();
  }

  document.addEventListener('click', function (e) {
    var n;

    if ((n = e.target.closest('[data-view]'))) { state.view = n.dataset.view; render(); return; }
    if ((n = e.target.closest('[data-filter]'))) { state.filter = n.dataset.filter; render(); return; }
    if ((n = e.target.closest('[data-tab]'))) { state.tab = n.dataset.tab; renderDrawer(); return; }
    if (e.target.closest('[data-close]')) { closeDrawer(); return; }
    if (e.target.matches('[data-close-scrim]')) { closeDrawer(); return; }

    if ((n = e.target.closest('[data-claim]'))) {
      state.openClaim = n.dataset.claim; state.tab = 'analysis'; renderDrawer(); return;
    }

    if ((n = e.target.closest('[data-act]'))) {
      var act = n.dataset.act;
      var c = state.openClaim ? claimById(state.openClaim) : null;

      if (act === 'goto-payments') { state.view = 'payments'; render(); return; }
      if (act === 'refresh') { toast('Agent cycle queued — results refresh in under a minute.', 'brand'); return; }
      if (act === 'export') { toast('Queue exported as CSV to your downloads.', 'brand'); return; }
      if (act === 'toggle-weekly-table') { state.showWeeklyTable = !state.showWeeklyTable; render(); return; }
      if (act === 'reset-benchmarks') {
        state.benchmarks = DATA.BENCHMARKS.map(function (b) { return Object.assign({}, b); });
        toast('Benchmark norms reset to the seeded values.'); render(); return;
      }
      if (act === 'save-benchmarks') { toast('Benchmark set saved. Applies from the next agent cycle.'); return; }
      if (act === 'release-clean') {
        var clean = openClaims().filter(function (x) { return x.verdict === 'VALIDATED' || x.verdict === 'AUTO_APPROVE'; });
        clean.forEach(function (x) {
          state.decisions[x.id] = { action: 'certify', approver: DATA.approverFor(x.amount), label: 'Certified in full', tone: 'success',
            note: money(x.amount) + ' released to the 03 Aug run · batch release' };
        });
        toast(clean.length + ' clean claims released — ' + money(clean.reduce(function (a, x) { return a + x.amount; }, 0)) + '.');
        render(); return;
      }
      if (act === 'chase') { toast('Reminder sent to the vendor accounts team.', 'brand'); return; }
      if (act === 'escalate') { toast('Escalated to the category lead.', 'brand'); return; }
      if (act === 'undo' && c) { delete state.decisions[c.id]; toast('Decision withdrawn — ' + c.id + ' is back in the queue.', 'brand'); closeDrawer(); render(); return; }
      if (c && ['certify', 'part', 'query', 'reject'].indexOf(act) > -1) { decide(c, act); return; }
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'q') {
      state.search = e.target.value;
      var pos = e.target.selectionStart;
      render();
      var q = $('#q'); if (q) { q.focus(); q.setSelectionRange(pos, pos); }
    }
    if (e.target.dataset && e.target.dataset.bm) {
      var id = +e.target.dataset.bm, k = e.target.dataset.k, v = parseFloat(e.target.value);
      state.benchmarks.forEach(function (b) { if (b.id === id && !isNaN(v)) { b[k] = v; b.updatedBy = 'You'; b.updatedAt = '29 Jul 2026'; } });
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state.openClaim) closeDrawer();
  });

  render();
})();
