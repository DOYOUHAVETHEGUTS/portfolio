/* ==========================================================================
   arcade.js — hidden arcade mode. Loaded only in the retro theme build.

   Ways in
     · Konami code: ↑ ↑ ↓ ↓ ← → ← → B A  (phones: swipe the arrows, then tap twice)
     · Type "interstellar" or "1up" anywhere outside a form field
     · The INSERT COIN slot in the footer
     · Attract mode: after 45 s idle a small visitor walks across the page
     · play() in the browser console (a greeting is logged on load)
     · The StarStruck constellation demo (trace the hidden invader; it posts a
       message to this page) and /?arcade=1

   Guardrails
     · Esc (or the EXIT button) rebuilds the site at any point in the game
     · prefers-reduced-motion: teardown/rebuild become a short fade, the idle
       visitor stands still, the starfield stops moving
     · Shortcuts are ignored while typing in an input, textarea or editor
   High score lives in this browser only (localStorage, wrapped in try/catch).
   ========================================================================== */
(function () {
  "use strict";
  if (window.KWArcade) return;

  var RM = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var HI_KEY = "kw-arcade-hi";
  var FONT = "'Press Start 2P', 'JetBrains Mono', monospace";
  var PAL = { bg: "#0C0B16", ink: "#F2ECD8", green: "#46E5A0", amber: "#FFC24B",
              violet: "#B7A9D6", pink: "#FF5C8A", faint: "#7E739C", rule: "#3A3358" };
  var busy = false;

  function reduced() { return !!RM.matches; }
  function getHi() { try { return parseInt(localStorage.getItem(HI_KEY), 10) || 0; } catch (e) { return 0; } }
  function setHi(v) { try { localStorage.setItem(HI_KEY, String(v)); } catch (e) {} }
  function isTyping(t) {
    t = t || document.activeElement;
    return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function pad(n) { return ("00000" + n).slice(-5); }

  // ── Sprites (original designs; '#' = pixel) ─────────────────────────────
  var SPR = {
    pod: [
      ["..####..", ".#.##.#.", "########", "#.#..#.#", "########", ".#....#.", "#.#..#.#", "........"],
      ["..####..", ".#.##.#.", "########", "#..##..#", "########", ".#....#.", ".#....#.", "#......#"]
    ],
    manta: [
      ["#....##....#", "##..####..##", "############", ".###.##.###.", "..########..", "....#..#....", "...#....#..."],
      ["....####....", "#..######..#", "############", ".###.##.###.", "..########..", "....#..#....", "....#..#...."]
    ],
    eye: [
      ["..######..", ".########.", "###....###", "###.##.###", "###....###", ".########.", ".#.#..#.#.", "#..#..#..#"],
      ["..######..", ".########.", "###....###", "###.##.###", "###....###", ".########.", ".#..##..#.", "..#....#.."]
    ],
    ship: [
      ["......#......", ".....###.....", ".....#.#.....", "....#####....", ".#..#####..#.", "#############", "###.#####.###", "#.#..#.#..#.#"]
    ],
    boss: [
      ["....########....", "..############..", ".##.##.##.##.##.", "################", "..###..##..###..", "...#........#..."]
    ]
  };
  function compile(rows) {
    var c = [];
    rows.forEach(function (r, y) { for (var x = 0; x < r.length; x++) if (r[x] === "#") c.push([x, y]); });
    return { w: rows[0].length, h: rows.length, c: c, rows: rows };
  }
  var S = {};
  Object.keys(SPR).forEach(function (k) { S[k] = SPR[k].map(compile); });

  function drawSprite(ctx, s, x, y, P, color) {
    ctx.fillStyle = color;
    for (var i = 0; i < s.c.length; i++) ctx.fillRect(Math.round(x + s.c[i][0] * P), Math.round(y + s.c[i][1] * P), P, P);
  }
  function spriteSVG(frames, color) {
    var f0 = frames[0];
    return '<svg viewBox="0 0 ' + f0.w + " " + f0.h + '" shape-rendering="crispEdges" aria-hidden="true">' +
      frames.map(function (f, i) {
        return '<g class="f' + (i + 1) + '" fill="' + color + '">' +
          f.c.map(function (p) { return '<rect x="' + p[0] + '" y="' + p[1] + '" width="1.02" height="1.02"/>'; }).join("") + "</g>";
      }).join("") + "</svg>";
  }

  // ── Styles (injected once) ─────────────────────────────────────────────
  var cssDone = false;
  function injectCSS() {
    if (cssDone) return; cssDone = true;
    var st = document.createElement("style");
    st.textContent =
      "#kw-arcade{position:fixed;inset:0;z-index:2147483000;touch-action:none;cursor:crosshair}" +
      "#kw-arcade canvas{position:absolute;inset:0;width:100%;height:100%;display:block;outline:none}" +
      "#kw-arcade .kw-exit{position:absolute;top:10px;right:10px;z-index:2;font:9px/1 " + FONT + ";letter-spacing:.06em;color:#F2ECD8;background:#0C0B16;border:2px solid #46E5A0;box-shadow:3px 3px 0 #3A3358;padding:8px 10px;cursor:pointer}" +
      "#kw-arcade .kw-exit:hover{color:#0C0B16;background:#46E5A0}" +
      "#kw-arcade .kw-exit:focus-visible{outline:2px solid #FFC24B;outline-offset:2px}" +
      "#kw-arcade .kw-sr{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
      "#kw-arcade.kw-fade{transition:opacity .22s linear}" +
      "html.kw-arcade-on body>*:not(#kw-arcade){visibility:hidden!important}" +
      "html.kw-arcade-lock,html.kw-arcade-lock body{overflow:hidden!important}" +
      ".kw-glitch{outline:2px solid #46E5A0!important;outline-offset:-1px;animation:kwjit .12s steps(2) infinite}" +
      "@keyframes kwjit{0%{transform:translate(0,0)}50%{transform:translate(2px,-1px)}100%{transform:translate(-2px,1px)}}" +
      ".kw-pop{animation:kwpop .3s steps(4) both}" +
      "@keyframes kwpop{from{opacity:.25;transform:scale(.97)}to{opacity:1;transform:none}}" +
      ".kw-visitor{position:fixed;bottom:16px;left:0;z-index:2147482000;width:50px;height:40px;padding:0;border:0;background:none;cursor:pointer}" +
      ".kw-visitor svg{width:100%;height:100%;display:block;filter:drop-shadow(0 0 6px #FFC24B66)}" +
      ".kw-visitor .f2{opacity:0}" +
      ".kw-visitor.walk{animation:kwwalk 16s linear forwards}" +
      ".kw-visitor.walk .f1{animation:kwf1 .5s linear infinite}.kw-visitor.walk .f2{animation:kwf2 .5s linear infinite}" +
      "@keyframes kwf1{0%,49.9%{opacity:1}50%,100%{opacity:0}}@keyframes kwf2{0%,49.9%{opacity:0}50%,100%{opacity:1}}" +
      "@keyframes kwwalk{from{transform:translateX(-60px)}to{transform:translateX(calc(100vw + 60px))}}" +
      ".kw-visitor.still{left:auto;right:20px}" +
      ".kw-visitor:focus-visible{outline:2px solid #FFC24B;outline-offset:4px}" +
      ".kw-visitor .tip{position:absolute;bottom:115%;left:50%;transform:translateX(-50%);white-space:nowrap;font:8px/1.4 " + FONT + ";color:#FFC24B;background:#0C0B16;padding:4px 6px;border:1px solid #FFC24B;opacity:0;transition:opacity .2s;pointer-events:none}" +
      ".kw-visitor:hover .tip,.kw-visitor:focus-visible .tip,.kw-visitor.still .tip{opacity:1}";
    document.head.appendChild(st);
  }

  // ── Triggers ───────────────────────────────────────────────────────────
  var KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  var WORDS = ["interstellar", "1up"];
  var seq = [], typed = "";
  function pushSeq(tok) {
    seq.push(tok);
    if (seq.length > KONAMI.length) seq.shift();
    if (seq.join() === KONAMI.join()) { seq = []; start("konami"); }
  }
  document.addEventListener("keydown", function (e) {
    if (busy || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
    var k = e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pushSeq(k);
    if (k && k.length === 1 && /[a-z0-9]/.test(k)) {
      typed = (typed + k).slice(-16);
      for (var i = 0; i < WORDS.length; i++) {
        if (typed.slice(-WORDS[i].length) === WORDS[i]) { typed = ""; start(WORDS[i]); return; }
      }
    }
  });
  // Phones: swipe up, up, down, down, left, right, left, right, then tap, tap.
  var touch0 = null;
  addEventListener("touchstart", function (e) {
    if (busy || e.touches.length > 1) { touch0 = null; return; }
    var t = e.touches[0]; touch0 = { x: t.clientX, y: t.clientY, t: Date.now() };
  }, { passive: true });
  addEventListener("touchend", function (e) {
    if (busy || !touch0) return;
    var t = e.changedTouches[0], dx = t.clientX - touch0.x, dy = t.clientY - touch0.y;
    var ax = Math.abs(dx), ay = Math.abs(dy), tok = null;
    if (Math.max(ax, ay) < 12 && Date.now() - touch0.t < 350) {
      if (seq.slice(-8).join() === KONAMI.slice(0, 8).join()) tok = "b";
      else if (seq.slice(-9).join() === KONAMI.slice(0, 9).join()) tok = "a";
      else tok = "tap";
    } else if (Math.max(ax, ay) > 40) {
      tok = ax > ay ? (dx > 0 ? "ArrowRight" : "ArrowLeft") : (dy > 0 ? "ArrowDown" : "ArrowUp");
    }
    touch0 = null;
    if (tok) pushSeq(tok);
  }, { passive: true });

  // Coin slot in the footer.
  function bindCoin() {
    var b = document.querySelector("[data-arcade-coin]");
    if (!b) return;
    b.addEventListener("click", function () {
      if (busy) return;
      var label = b.querySelector(".coin-label");
      b.classList.add("dropping");
      setTimeout(function () { if (label) label.textContent = "CREDIT 01"; }, 380);
      setTimeout(function () { start("coin"); }, reduced() ? 150 : 700);
      setTimeout(function () { b.classList.remove("dropping"); if (label) label.textContent = "INSERT COIN"; }, 2600);
    });
  }

  // Attract mode: a visitor appears after 45 s without input.
  var IDLE_MS = 45000, idleTimer = 0, visitor = null;
  function resetIdle() {
    clearTimeout(idleTimer);
    if (!busy) idleTimer = setTimeout(showVisitor, IDLE_MS);
  }
  ["mousemove", "keydown", "scroll", "touchstart", "pointerdown", "wheel"].forEach(function (ev) {
    addEventListener(ev, resetIdle, { passive: true });
  });
  function showVisitor() {
    if (busy || visitor) return;
    if (document.hidden) { resetIdle(); return; }
    injectCSS();
    visitor = document.createElement("button");
    visitor.type = "button";
    visitor.className = "kw-visitor " + (reduced() ? "still" : "walk");
    visitor.setAttribute("aria-label", "A small visitor from deep space. Activate to play the hidden arcade game.");
    visitor.innerHTML = spriteSVG(S.eye, PAL.amber) + '<span class="tip">PSST · CLICK ME</span>';
    visitor.addEventListener("click", function () { removeVisitor(); start("visitor"); });
    visitor.addEventListener("animationend", function (e) { if (e.animationName === "kwwalk") removeVisitor(); });
    document.body.appendChild(visitor);
    if (reduced()) setTimeout(removeVisitor, 12000);
  }
  function removeVisitor() {
    if (visitor) { visitor.remove(); visitor = null; }
    resetIdle();
  }

  // Console greeting and play().
  try {
    var art = S.eye[0].rows.map(function (r) { return r.replace(/#/g, "██").replace(/\./g, "  "); }).join("\n");
    console.log("%c" + art, "color:#FFC24B;font-family:monospace;line-height:1");
    console.log("%cIncoming transmission. Type play() to answer it.", "color:#46E5A0;font-family:monospace;font-size:12px");
  } catch (e) {}
  window.play = function () { start("console"); return "Transmission accepted. Look up from the console."; };

  // StarStruck (same-origin iframe or popup) asks this page to start.
  addEventListener("message", function (e) {
    if (e.origin !== location.origin || !e.data || e.data.kwArcade !== "start") return;
    try { if (document.activeElement && document.activeElement.tagName === "IFRAME") document.activeElement.blur(); } catch (x) {}
    try { window.focus(); } catch (x) {}
    start(e.data.from || "message");
  });

  function checkQuery() {
    if (!/[?&]arcade=1(&|$)/.test(location.search)) return;
    try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {}
    setTimeout(function () { start("link"); }, 600);
  }

  // ── Run: teardown → game → rebuild ─────────────────────────────────────
  function start(source) {
    if (busy || !document.body) return;
    busy = true;
    clearTimeout(idleTimer);
    if (visitor) { visitor.remove(); visitor = null; }
    try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {}
    injectCSS();
    run(source);
  }

  function collectBlocks(W, H) {
    var sel = "header, nav a, h1, h2, h3, h4, p, li, img, figure, pre, blockquote, table, iframe, svg, dt, dd, " +
              ".btn, .chip, .card, .tag, label, input, button, summary, footer .eyebrow, footer a";
    var out = [];
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.closest("#kw-arcade") || el.closest(".kw-visitor")) return;
      var r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 6 || r.bottom <= 0 || r.top >= H || r.right <= 0 || r.left >= W) return;
      var cs = getComputedStyle(el);
      if (cs.visibility === "hidden" && !document.documentElement.classList.contains("kw-arcade-on")) return;
      if (cs.opacity === "0") return;
      out.push({ el: el, r: { left: Math.max(0, r.left), top: Math.max(0, r.top),
                              width: Math.min(W, r.right) - Math.max(0, r.left),
                              height: Math.min(H, r.bottom) - Math.max(0, r.top) } });
    });
    // keep the innermost blocks so text turns into bricks where it actually sits
    out = out.filter(function (a) { return !out.some(function (b) { return b !== a && a.el.contains(b.el); }); });
    return out.slice(0, 160);
  }

  function buildBricks(blocks, target) {
    var area = 0;
    blocks.forEach(function (b) { area += b.r.width * b.r.height; });
    var B = clamp(Math.round(Math.sqrt(area / Math.max(1, target))), 6, 34);
    var bricks = [];
    blocks.forEach(function (b) {
      var r = b.r, cs = getComputedStyle(b.el), tag = b.el.tagName.toUpperCase();
      var media = /^(IMG|IFRAME|SVG|CANVAS|VIDEO|PICTURE|FIGURE)$/.test(tag);
      var bg = cs.backgroundColor, hasBg = bg && bg !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(bg);
      var tc = cs.color || PAL.ink;
      var cols = Math.max(1, Math.round(r.width / B)), rows = Math.max(1, Math.round(r.height / B));
      var bw = r.width / cols, bh = r.height / rows;
      for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
        var c, a = 1;
        if (media) { c = (x + y) % 3 ? PAL.green : PAL.violet; a = (x + y) % 2 ? 0.9 : 0.6; }
        else if (hasBg) { c = bg; }
        else { c = tc; a = y % 2 ? 0.35 : 0.85; }
        bricks.push({ x: r.left + x * bw, y: r.top + y * bh, w: bw, h: bh, c: c, a: a });
      }
    });
    return bricks;
  }
  function drawBrick(ctx, x, y, w, h) {
    if (w > 3 && h > 3) ctx.fillRect(x + 0.5, y + 0.5, w - 1, h - 1); else ctx.fillRect(x, y, w, h);
  }

  function run(source) {
    var root = document.documentElement, body = document.body;
    var sbw = innerWidth - root.clientWidth, padSave = body.style.paddingRight;
    var W = innerWidth, H = innerHeight;
    var blocksIn = collectBlocks(W, H);
    root.classList.add("kw-arcade-lock");
    if (sbw > 0) body.style.paddingRight = sbw + "px";

    var wrap = document.createElement("div");
    wrap.id = "kw-arcade";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", "Hidden arcade game");
    var cv = document.createElement("canvas");
    cv.tabIndex = 0;
    cv.setAttribute("aria-label", "Arcade game. Arrow keys move, Space fires, P pauses, Escape returns to the site.");
    var exitBtn = document.createElement("button");
    exitBtn.type = "button"; exitBtn.className = "kw-exit"; exitBtn.textContent = ("ontouchstart" in window || navigator.maxTouchPoints > 0) ? "EXIT" : "EXIT · ESC";
    exitBtn.setAttribute("aria-label", "Exit the game and rebuild the site (Escape)");
    exitBtn.hidden = true;
    var sr = document.createElement("p");
    sr.className = "kw-sr"; sr.setAttribute("aria-live", "polite");
    wrap.appendChild(cv); wrap.appendChild(exitBtn); wrap.appendChild(sr);
    body.appendChild(wrap);

    var ctx = cv.getContext("2d"), DPR = 1, P = 3, fs = 10;
    var touchUI = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    function size() {
      DPR = Math.min(2, window.devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      P = clamp(Math.round(Math.min(W, H * 1.25) / 240), 2, 5);
      fs = W < 520 ? 8 : 11;
    }
    size();

    var mode = "intro", score = 0, hi = getHi(), lives = 3, wave = 1, overT = 0, newHi = false;
    var aliens = [], pShots = [], aShots = [], parts = [], texts = [], stars = [], boss = null, form = null;
    var player = null, timers = null, banner = { text: "", t: 0 };
    var keys = { left: false, right: false, fire: false }, touchX = null, touchFire = false;
    var tr = null, trDone = null, raf = 0, last = performance.now();

    var TYPES = [
      { s: S.eye, c: PAL.amber, pts: 30 },
      { s: S.manta, c: PAL.green, pts: 20 },
      { s: S.manta, c: PAL.green, pts: 20 },
      { s: S.pod, c: PAL.violet, pts: 10 },
      { s: S.pod, c: PAL.violet, pts: 10 }
    ];
    function groundY() { return H - (touchUI ? 46 : 30); }
    function makeWave() {
      var cols = W < 520 ? 6 : W < 900 ? 8 : 10;
      var cellW = 18 * P, cellH = 12 * P;
      cols = Math.min(cols, Math.floor((W - 40) / cellW));
      var x0 = Math.round((W - cols * cellW) / 2), y0 = Math.round(52 + 10 * P);
      aliens = [];
      for (var r = 0; r < TYPES.length; r++) for (var c = 0; c < cols; c++) {
        var t = TYPES[r], sw = t.s[0].w * P;
        aliens.push({ t: t, r: r, c: c, ox: c * cellW + Math.round((cellW - sw) / 2), oy: r * cellH,
                      x: 0, y: 0, w: sw, h: t.s[0].h * P, alive: true, dive: null });
      }
      form = { x: x0, y: y0, dir: 1, frame: 0, acc: 0, total: aliens.length };
      place();
      pShots = []; aShots = []; boss = null;
      timers = { dive: rand(2.5, 4.5), boss: rand(14, 22), shot: rand(0.6, 1.2) };
    }
    function place() {
      aliens.forEach(function (a) { if (!a.dive) { a.x = form.x + a.ox; a.y = form.y + a.oy; } });
    }
    function newPlayer() {
      var s = S.ship[0];
      player = { x: W / 2 - (s.w * P) / 2, y: groundY() - s.h * P - 8, w: s.w * P, h: s.h * P,
                 alive: true, inv: 1.5, cd: 0, respawn: 0 };
    }
    function makeStars() {
      stars = [];
      for (var i = 0; i < 90; i++) stars.push({ x: rand(0, W), y: rand(0, H), s: Math.random() < 0.15 ? 2 : 1, v: rand(12, 50) });
    }
    function hit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
    function burst(x, y, c, n) {
      if (reduced()) n = Math.min(n, 4);
      for (var i = 0; i < n; i++) parts.push({ x: x, y: y, vx: rand(-170, 170), vy: rand(-220, 60), t: rand(0.3, 0.65), c: c });
    }
    function say(msg) { sr.textContent = msg; }
    function setMode(m) {
      mode = m;
      exitBtn.hidden = (m === "intro" || m === "outro");
      if (m === "ready") say("Arcade mode. " + (touchUI ? "Tap" : "Press Space") + " to start. Press Escape to return to the site.");
      if (m === "pause") say("Paused. Press P to resume.");
      if (m === "over") say("Game over. Score " + score + ". Press Enter to play again or Escape to return to the site.");
    }
    function begin() { score = 0; lives = 3; wave = 1; newHi = false; setMode("play"); }
    function restart() { makeWave(); newPlayer(); begin(); }
    function fireAlien(a) {
      aShots.push({ x: a.x + a.w / 2 - P / 2, y: a.y + a.h, w: P, h: 3 * P, v: 190 + wave * 15 });
    }
    function killPlayer() {
      player.alive = false; lives--;
      burst(player.x + player.w / 2, player.y + player.h / 2, PAL.ink, 30);
      player.respawn = 1.4; aShots = [];
    }
    function gameOver() {
      overT = 0;
      if (score > getHi()) { setHi(score); newHi = score > 0; }
      hi = Math.max(hi, score);
      setMode("over");
    }

    function update(dt) {
      if (!reduced()) stars.forEach(function (s) { s.y += s.v * dt; if (s.y > H) { s.y = 0; s.x = rand(0, W); } });
      parts = parts.filter(function (p) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 320 * dt; return p.t > 0; });
      texts = texts.filter(function (t) { t.t -= dt; t.y -= 30 * dt; return t.t > 0; });
      if (banner.t > 0) banner.t -= dt;
      if (mode === "over") overT += dt;
      if (mode !== "play") return;

      var alive = aliens.filter(function (a) { return a.alive; });
      if (!alive.length) { wave++; banner = { text: "WAVE " + wave, t: 1.6 }; say("Wave " + wave); makeWave(); return; }

      // formation march
      var stepEvery = Math.max(0.05, (0.55 * (alive.length / form.total) + 0.05) / (1 + (wave - 1) * 0.15));
      form.acc += dt;
      if (form.acc >= stepEvery) {
        form.acc = 0; form.frame ^= 1;
        var minX = Infinity, maxX = -Infinity, step = 2 * P;
        alive.forEach(function (a) { var ax = form.x + a.ox; minX = Math.min(minX, ax); maxX = Math.max(maxX, ax + a.w); });
        if ((form.dir > 0 && maxX + step > W - 10) || (form.dir < 0 && minX - step < 10)) { form.dir *= -1; form.y += 4 * P; }
        else form.x += step * form.dir;
        place();
      }

      // divers swoop toward the player
      timers.dive -= dt;
      if (timers.dive <= 0) {
        timers.dive = rand(2.2, 4.2) / (1 + (wave - 1) * 0.2);
        var cands = alive.filter(function (a) { return !a.dive; });
        if (cands.length && player.alive) {
          var d = cands[(Math.random() * cands.length) | 0];
          d.dive = { t: 0, phase: rand(0, 6.28), back: false, shots: wave > 2 ? 2 : 1 };
        }
      }
      alive.forEach(function (a) {
        var d = a.dive; if (!d) return;
        d.t += dt;
        if (!d.back) {
          var tx = player.x + player.w / 2 - a.w / 2;
          a.x += clamp(tx - a.x, -1, 1) * (90 + wave * 12) * dt + Math.sin(d.t * 4 + d.phase) * 120 * dt;
          a.y += (150 + wave * 15) * dt;
          if (d.shots > 0 && a.y > H * 0.4 && Math.random() < dt * 2) { d.shots--; fireAlien(a); }
          if (a.y > H + 20) { d.back = true; a.y = -a.h - 10; }
        } else {
          var hx = form.x + a.ox, hy = form.y + a.oy, k = Math.min(1, dt * 3);
          a.x += (hx - a.x) * k; a.y += (hy - a.y) * k;
          if (Math.abs(hx - a.x) < 2 && Math.abs(hy - a.y) < 2) { a.dive = null; a.x = hx; a.y = hy; }
        }
      });

      // formation fire from the bottom of each column
      timers.shot -= dt;
      if (timers.shot <= 0) {
        timers.shot = rand(0.5, 1.3) / (1 + (wave - 1) * 0.2);
        if (aShots.length < 3 + wave) {
          var bottoms = {};
          alive.forEach(function (a) { if (!a.dive && (!bottoms[a.c] || a.r > bottoms[a.c].r)) bottoms[a.c] = a; });
          var bl = Object.keys(bottoms).map(function (k) { return bottoms[k]; });
          if (bl.length) fireAlien(bl[(Math.random() * bl.length) | 0]);
        }
      }

      // mystery ship
      timers.boss -= dt;
      if (!boss && timers.boss <= 0) {
        var dir = Math.random() < 0.5 ? 1 : -1, bw = S.boss[0].w * P;
        boss = { x: dir > 0 ? -bw : W, y: 34, w: bw, h: S.boss[0].h * P, dir: dir, v: 110 + wave * 8 };
        timers.boss = rand(16, 26);
      }
      if (boss) { boss.x += boss.dir * boss.v * dt; if (boss.x < -boss.w - 6 || boss.x > W + 6) boss = null; }

      // player
      if (player.alive) {
        if (touchX != null) {
          var dx = touchX - player.w / 2 - player.x, lim = 480 * dt;
          player.x += clamp(dx, -lim, lim);
        } else {
          player.x += ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * 340 * dt;
        }
        player.x = clamp(player.x, 6, W - player.w - 6);
        player.cd -= dt;
        if (player.inv > 0) player.inv -= dt;
        if ((keys.fire || touchFire) && player.cd <= 0 && pShots.length < 2) {
          pShots.push({ x: player.x + player.w / 2 - P / 2, y: player.y - 3 * P, w: P, h: 4 * P });
          player.cd = 0.28;
        }
      } else {
        player.respawn -= dt;
        if (player.respawn <= 0) { if (lives > 0) newPlayer(); else { gameOver(); return; } }
      }

      // shots
      pShots.forEach(function (s) { s.y -= 560 * dt; });
      aShots.forEach(function (s) { s.y += s.v * dt; });
      pShots = pShots.filter(function (s) {
        if (s.y + s.h < 0) return false;
        for (var i = 0; i < aliens.length; i++) {
          var a = aliens[i];
          if (a.alive && hit(s, a)) {
            a.alive = false;
            var pts = a.t.pts * (a.dive ? 2 : 1);
            score += pts;
            if (a.dive) texts.push({ s: "+" + pts, x: a.x + a.w / 2, y: a.y, t: 0.8, c: a.t.c });
            burst(a.x + a.w / 2, a.y + a.h / 2, a.t.c, 14);
            return false;
          }
        }
        if (boss && hit(s, boss)) {
          var bp = [50, 100, 150, 300][(Math.random() * 4) | 0];
          score += bp;
          texts.push({ s: "+" + bp, x: boss.x + boss.w / 2, y: boss.y, t: 1.1, c: PAL.pink });
          burst(boss.x + boss.w / 2, boss.y + boss.h / 2, PAL.pink, 24);
          boss = null;
          return false;
        }
        for (var j = 0; j < aShots.length; j++) if (hit(s, aShots[j])) { aShots.splice(j, 1); return false; }
        return true;
      });
      aShots = aShots.filter(function (s) {
        if (s.y > H) return false;
        if (player.alive && player.inv <= 0 && hit(s, player)) { killPlayer(); return false; }
        return true;
      });
      if (player.alive && player.inv <= 0) {
        aliens.forEach(function (a) {
          if (player.alive && a.alive && a.dive && hit(a, player)) {
            a.alive = false; burst(a.x + a.w / 2, a.y + a.h / 2, a.t.c, 12); killPlayer();
          }
        });
      }
      // invasion: the formation reached the ship's row
      var lowest = 0;
      aliens.forEach(function (a) { if (a.alive && !a.dive) lowest = Math.max(lowest, a.y + a.h); });
      if (lowest >= groundY() - S.ship[0].h * P - 8) {
        lives = 0;
        if (player.alive) killPlayer();
      }
      if (score > hi) hi = score;
    }

    function drawStars(alpha) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = PAL.faint;
      stars.forEach(function (s) { ctx.fillRect(Math.round(s.x), Math.round(s.y), s.s, s.s); });
      ctx.globalAlpha = 1;
    }
    function text(s, x, y, size, color, align) {
      ctx.font = size + "px " + FONT;
      ctx.fillStyle = color; ctx.textAlign = align || "center"; ctx.textBaseline = "top";
      ctx.fillText(s, Math.round(x), Math.round(y));
    }
    function blink() { return reduced() || ((performance.now() / 450) | 0) % 2 === 0; }

    function draw() {
      ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, W, H);
      drawStars(1);
      var flashOn = ((performance.now() / 120) | 0) % 2 === 1;
      aliens.forEach(function (a) {
        if (!a.alive) return;
        var fr = a.dive ? (((performance.now() / 150) | 0) % 2) : form.frame;
        drawSprite(ctx, a.t.s[fr], a.x, a.y, P, a.dive && flashOn ? PAL.pink : a.t.c);
      });
      if (boss) drawSprite(ctx, S.boss[0], boss.x, boss.y, P, PAL.pink);
      if (player.alive && !(player.inv > 0 && ((performance.now() / 100) | 0) % 2)) drawSprite(ctx, S.ship[0], player.x, player.y, P, PAL.ink);
      ctx.fillStyle = PAL.ink;
      pShots.forEach(function (s) { ctx.fillRect(Math.round(s.x), Math.round(s.y), s.w, s.h); });
      ctx.fillStyle = PAL.pink;
      aShots.forEach(function (s) {
        var o = ((s.y / (2 * P)) | 0) % 2 ? P : 0;
        ctx.fillRect(Math.round(s.x - P / 2 + o), Math.round(s.y), P, P);
        ctx.fillRect(Math.round(s.x + P / 2 - o), Math.round(s.y + P), P, P);
        ctx.fillRect(Math.round(s.x - P / 2 + o), Math.round(s.y + 2 * P), P, P);
      });
      parts.forEach(function (p) {
        ctx.globalAlpha = clamp(p.t * 2, 0, 1); ctx.fillStyle = p.c;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), P, P);
      });
      ctx.globalAlpha = 1;
      texts.forEach(function (t) { text(t.s, t.x, t.y, fs, t.c); });

      // ground and HUD
      var gy = groundY();
      ctx.fillStyle = PAL.green; ctx.globalAlpha = 0.6; ctx.fillRect(0, gy, W, 2); ctx.globalAlpha = 1;
      text("SCORE", 14, 12, fs, PAL.faint, "left");
      text(pad(score), 14, 12 + fs + 6, fs, PAL.ink, "left");
      text("HI", W / 2, 12, fs, PAL.faint);
      text(pad(Math.max(hi, getHi())), W / 2, 12 + fs + 6, fs, PAL.amber);
      var lp = Math.max(1, P - 2), sx = 14;
      for (var i = 0; i < Math.max(0, lives - (player.alive ? 1 : 0)); i++) {
        drawSprite(ctx, S.ship[0], sx, gy + 8, lp, PAL.green); sx += S.ship[0].w * lp + 6;
      }
      text("WAVE " + wave, W - 14, gy + 9, fs, PAL.faint, "right");

      var cy = H * 0.3, fb = 0;
      aliens.forEach(function (a) { if (a.alive) fb = Math.max(fb, a.y + a.h); });
      if (mode === "ready") {
        cy = Math.max(cy, fb + 28);
        ctx.globalAlpha = 0.82; ctx.fillStyle = PAL.bg; ctx.fillRect(0, cy - 30, W, 300); ctx.globalAlpha = 1;
        text("INCOMING!", W / 2, cy, fs * 2.2, PAL.green);
        text("DEFEND THE PORTFOLIO", W / 2, cy + fs * 3.4, fs, PAL.ink);
        var rows = [[S.eye[0], PAL.amber, "= 30 PTS"], [S.manta[0], PAL.green, "= 20 PTS"], [S.pod[0], PAL.violet, "= 10 PTS"], [S.boss[0], PAL.pink, "= ??? PTS"]];
        var ty = cy + fs * 6, sp = Math.max(1, P - 1);
        rows.forEach(function (r) {
          drawSprite(ctx, r[0], W / 2 - 18 - r[0].w * sp, ty, sp, r[1]);
          text(r[2], W / 2 - 6, ty + (r[0].h * sp - fs) / 2, fs, PAL.ink, "left");
          ty += Math.max(r[0].h * sp, fs) + 10;
        });
        if (blink()) text(touchUI ? "TAP TO START" : "PRESS SPACE TO START", W / 2, ty + 12, fs, PAL.amber);
        text(touchUI ? "DRAG TO MOVE · HOLD TO FIRE · EXIT TOP RIGHT" : "ARROWS MOVE · SPACE FIRE · P PAUSE · ESC EXIT",
             W / 2, ty + 12 + fs * 2.4, Math.max(7, fs - 2), PAL.faint);
      } else if (mode === "pause") {
        text("PAUSED", W / 2, cy + 40, fs * 2, PAL.amber);
        text("P TO RESUME · ESC TO EXIT", W / 2, cy + 40 + fs * 3.4, fs, PAL.faint);
      } else if (mode === "over") {
        ctx.globalAlpha = 0.82; ctx.fillStyle = PAL.bg; ctx.fillRect(0, cy - 10, W, fs * 14); ctx.globalAlpha = 1;
        text("GAME OVER", W / 2, cy + 10, fs * 2.2, PAL.pink);
        text("SCORE " + pad(score), W / 2, cy + 10 + fs * 3.6, fs, PAL.ink);
        if (newHi && blink()) text("NEW HIGH SCORE!", W / 2, cy + 10 + fs * 5.4, fs, PAL.amber);
        text(touchUI ? "TAP TO PLAY AGAIN" : "ENTER TO PLAY AGAIN", W / 2, cy + 10 + fs * 7.6, fs, PAL.green);
        text(touchUI ? "EXIT TO REBUILD THE SITE" : "ESC TO REBUILD THE SITE", W / 2, cy + 10 + fs * 9.4, fs, PAL.faint);
      }
      if (banner.t > 0) text(banner.text, W / 2, cy + 60, fs * 2, PAL.amber);
    }

    // sprite pixels for the hand-off between bricks and the game
    function pixels(aliveOnly) {
      var out = [];
      function add(s, x, y, c) {
        s.c.forEach(function (p) { out.push({ x: x + p[0] * P, y: y + p[1] * P, c: c, k: x + p[0] * P + rand(-30, 30) }); });
      }
      aliens.forEach(function (a) { if (!aliveOnly || a.alive) add(a.t.s[aliveOnly ? form.frame : 0], a.x, a.y, a.t.c); });
      if (boss && aliveOnly) add(S.boss[0], boss.x, boss.y, PAL.pink);
      if (player && (!aliveOnly || player.alive)) add(S.ship[0], player.x, player.y, PAL.ink);
      return out;
    }

    // ── teardown: page → bricks → game ──────────────────────────────────
    function intro(blocks) {
      var targets = pixels(false);
      var bricks = buildBricks(blocks, targets.length);
      if (!bricks.length) { root.classList.add("kw-arcade-on"); setMode("ready"); return; }
      blocks.forEach(function (b) { b.el.classList.add("kw-glitch"); });
      var t0 = performance.now(), lastT = t0, hidden = false, assigned = false, missing = [];
      var T_HIDE = 380, T_ASM = 1900, T_END = 3300;
      bricks.forEach(function (b) {
        b.delay = T_HIDE + (1 - b.y / H) * 450 + rand(0, 160);
        b.vx = rand(-90, 90); b.vy = rand(-160, -20); b.rest = false;
      });
      tr = function (now) {
        var t = now - t0, dt = Math.min(0.05, (now - lastT) / 1000);
        lastT = now;
        if (!hidden && t >= T_HIDE) {
          hidden = true;
          blocks.forEach(function (b) { b.el.classList.remove("kw-glitch"); });
          root.classList.add("kw-arcade-on");
        }
        ctx.clearRect(0, 0, W, H);
        if (!hidden) return false;
        ctx.globalAlpha = clamp((t - 500) / 1400, 0, 1);
        ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        if (t < T_ASM) {
          bricks.forEach(function (b) {
            if (t > b.delay && !b.rest) {
              b.vy += 2200 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
              if (b.y + b.h > H) {
                b.y = H - b.h; b.vy *= -0.28; b.vx *= 0.6;
                if (Math.abs(b.vy) < 60) { b.vy = 0; b.rest = true; }
              }
            }
            ctx.globalAlpha = b.a; ctx.fillStyle = b.c; drawBrick(ctx, b.x, b.y, b.w, b.h);
          });
          ctx.globalAlpha = 1;
          return false;
        }
        if (!assigned) {
          assigned = true;
          bricks.forEach(function (b) { b.k = b.x + rand(-60, 60); });
          bricks.sort(function (a, b) { return a.k - b.k; });
          targets.sort(function (a, b) { return a.k - b.k; });
          var used = new Array(targets.length);
          bricks.forEach(function (b, i) {
            var j = Math.floor(i * targets.length / bricks.length), tg = targets[j];
            used[j] = true;
            b.sx = b.x; b.sy = b.y; b.sw = b.w; b.sh = b.h;
            b.tx = tg.x; b.ty = tg.y; b.tc = tg.c; b.d2 = rand(0, 350); b.arc = rand(20, 120);
          });
          missing = targets.filter(function (_, j) { return !used[j]; });
        }
        var k = t - T_ASM;
        drawStars(clamp(k / 1200, 0, 1));
        bricks.forEach(function (b) {
          var p = clamp((k - b.d2) / 950, 0, 1), e = ease(p);
          var x = b.sx + (b.tx - b.sx) * e, y = b.sy + (b.ty - b.sy) * e - Math.sin(p * Math.PI) * b.arc;
          var w = b.sw + (P - b.sw) * e, h = b.sh + (P - b.sh) * e;
          ctx.globalAlpha = b.a + (1 - b.a) * e;
          ctx.fillStyle = e > 0.5 ? b.tc : b.c;
          drawBrick(ctx, x, y, w, h);
        });
        ctx.globalAlpha = clamp((k - 800) / 600, 0, 1);
        missing.forEach(function (m) { ctx.fillStyle = m.c; ctx.fillRect(Math.round(m.x), Math.round(m.y), P, P); });
        ctx.globalAlpha = 1;
        return t >= T_END;
      };
      trDone = function () { setMode("ready"); };
    }

    // ── rebuild: game → bricks → page ───────────────────────────────────
    function outro() {
      setMode("outro");
      keys.left = keys.right = keys.fire = false; touchX = null; touchFire = false;
      var blocks = collectBlocks(W, H);
      var sources = pixels(true);
      if (!sources.length) sources = [{ x: W / 2, y: H / 2, c: PAL.green }];
      var bricks = buildBricks(blocks, Math.max(600, sources.length));
      bricks.forEach(function (b, i) {
        var s = sources[Math.floor(i * sources.length / Math.max(1, bricks.length))];
        b.sx = s.x; b.sy = s.y; b.sc = s.c; b.d2 = rand(0, 420); b.arc = rand(10, 90);
      });
      var t0 = performance.now(), T_END = 1500;
      tr = function (now) {
        var t = now - t0;
        ctx.clearRect(0, 0, W, H);
        ctx.globalAlpha = 1 - clamp((t - 300) / 1000, 0, 1);
        ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, W, H);
        drawStars(1 - clamp(t / 700, 0, 1));
        bricks.forEach(function (b) {
          var p = clamp((t - b.d2) / 950, 0, 1), e = ease(p);
          var x = b.sx + (b.x - b.sx) * e, y = b.sy + (b.y - b.sy) * e - Math.sin(p * Math.PI) * b.arc;
          var w = P + (b.w - P) * e, h = P + (b.h - P) * e;
          ctx.globalAlpha = e > 0.5 ? b.a : 1;
          ctx.fillStyle = e > 0.5 ? b.c : b.sc;
          drawBrick(ctx, x, y, w, h);
        });
        ctx.globalAlpha = 1;
        return t >= T_END;
      };
      trDone = function () { cleanup(blocks); };
    }

    function exit() {
      if (mode === "intro" || mode === "outro") return;
      if (score > getHi()) setHi(score);
      if (reduced()) {
        setMode("outro");
        root.classList.remove("kw-arcade-on");
        wrap.classList.add("kw-fade");
        wrap.style.opacity = "0";
        setTimeout(function () { cleanup(null); }, 240);
      } else {
        outro();
      }
    }

    function cleanup(blocks) {
      cancelAnimationFrame(raf);
      removeEventListener("keydown", onKey, true);
      removeEventListener("keyup", onKey, true);
      removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      root.classList.remove("kw-arcade-on", "kw-arcade-lock");
      body.style.paddingRight = padSave;
      wrap.remove();
      if (blocks && !reduced()) {
        blocks.forEach(function (b) { b.el.classList.add("kw-pop"); });
        setTimeout(function () { blocks.forEach(function (b) { b.el.classList.remove("kw-pop"); }); }, 400);
      }
      busy = false;
      resetIdle();
    }

    // ── input ───────────────────────────────────────────────────────────
    function onKey(e) {
      var k = e.key, down = e.type === "keydown";
      if (k === "Escape") { e.preventDefault(); e.stopPropagation(); if (down) exit(); return; }
      if (k === "Enter" && e.target === exitBtn) return;       // let Enter press the EXIT button
      if (k === "Tab") return;
      if (mode === "intro" || mode === "outro") { e.preventDefault(); e.stopPropagation(); return; }
      if (k === "ArrowLeft" || k === "a" || k === "A") keys.left = down;
      else if (k === "ArrowRight" || k === "d" || k === "D") keys.right = down;
      else if (k === " " || k === "Spacebar" || k === "ArrowUp" || k === "w" || k === "W") {
        keys.fire = down;
        if (down && !e.repeat) { if (mode === "ready") begin(); else if (mode === "over" && overT > 0.8) restart(); }
      } else if (down && (k === "p" || k === "P")) {
        if (mode === "play") setMode("pause"); else if (mode === "pause") setMode("play");
      } else if (down && k === "Enter") {
        if (mode === "ready") begin(); else if (mode === "over" && overT > 0.8) restart();
      } else if (k !== "ArrowDown") return;
      e.preventDefault(); e.stopPropagation();
    }
    function onResize() {
      size();
      if (!player) return;
      player.y = groundY() - player.h - 8;
      player.x = clamp(player.x, 6, W - player.w - 6);
      if (mode === "ready") { makeWave(); newPlayer(); }
      makeStars();
    }
    function onVis() { if (document.hidden && mode === "play") setMode("pause"); }
    addEventListener("keydown", onKey, true);
    addEventListener("keyup", onKey, true);
    addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    exitBtn.addEventListener("click", exit);
    cv.addEventListener("pointerdown", function (e) {
      if (mode === "intro" || mode === "outro") return;
      if (e.pointerType !== "mouse") { touchX = e.clientX; touchFire = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} }
      if (mode === "ready") begin();
      else if (mode === "over" && overT > 0.8) restart();
      else if (mode === "pause") setMode("play");
    });
    cv.addEventListener("pointermove", function (e) { if (e.pointerType !== "mouse" && touchX != null) touchX = e.clientX; });
    function endTouch(e) { if (e.pointerType !== "mouse") { touchX = null; touchFire = false; } }
    cv.addEventListener("pointerup", endTouch);
    cv.addEventListener("pointercancel", endTouch);

    // ── loop ────────────────────────────────────────────────────────────
    function loop(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (tr) {
        if (tr(now)) { tr = null; var d = trDone; trDone = null; if (d) d(); }
      } else {
        if (mode !== "pause") update(dt);
        draw();
      }
      if (wrap.isConnected) raf = requestAnimationFrame(loop);
    }

    makeStars(); makeWave(); newPlayer();
    try { cv.focus({ preventScroll: true }); } catch (e) {}
    var go = function () {
      if (reduced()) {
        setMode("ready");
        wrap.classList.add("kw-fade");
        wrap.style.opacity = "0";
        draw();
        requestAnimationFrame(function () { wrap.style.opacity = "1"; });
        setTimeout(function () { root.classList.add("kw-arcade-on"); }, 240);
      } else {
        intro(blocksIn);
      }
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    // let the pixel font load so the first frames use it; never wait long
    if (document.fonts && document.fonts.load) {
      Promise.race([document.fonts.load("10px 'Press Start 2P'"), new Promise(function (r) { setTimeout(r, 300); })]).then(go, go);
    } else go();
  }

  window.KWArcade = { start: start, attract: showVisitor };

  function init() { bindCoin(); checkQuery(); resetIdle(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
