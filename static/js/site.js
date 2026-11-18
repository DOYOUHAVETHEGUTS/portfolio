/* Track filtering. Progressive enhancement: without JS every project shows. */

(function () {
  var chipGroups = document.querySelectorAll(".filters");
  if (!chipGroups.length) return;

  var blurbs = {};
  var blurbEl = document.querySelector("[data-blurb]");
  var defaultBlurb = blurbEl ? blurbEl.textContent : "";

  // Track descriptions are rendered into the chips' data attributes by build.py.
  document.querySelectorAll(".chip").forEach(function (chip) {
    if (chip.dataset.blurb) blurbs[chip.dataset.track] = chip.dataset.blurb;
  });

  function apply(track) {
    var items = document.querySelectorAll("[data-track]:not(.chip)");
    var shown = 0;

    items.forEach(function (item) {
      var match = track === "all" || item.dataset.track === track;
      item.classList.toggle("is-hidden", !match);
      if (match) shown++;
    });

    document.querySelectorAll(".chip").forEach(function (chip) {
      var active = chip.dataset.track === track;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", active ? "true" : "false");
    });

    var empty = document.querySelector(".board-empty");
    if (empty) empty.hidden = shown > 0;

    if (blurbEl) blurbEl.textContent = blurbs[track] || defaultBlurb;

    // Renumber the visible rows so the ref column stays sequential.
    var n = 0;
    document.querySelectorAll(".board-row:not(.board-header)").forEach(function (row) {
      if (row.classList.contains("is-hidden")) return;
      n++;
      var ref = row.querySelector(".cell-ref");
      if (ref) ref.textContent = n < 10 ? "0" + n : String(n);
    });

    if (history.replaceState) {
      history.replaceState(null, "", track === "all" ? location.pathname : "?track=" + track);
    }
  }

  document.addEventListener("click", function (event) {
    var chip = event.target.closest(".chip");
    if (chip) apply(chip.dataset.track);
  });

  var initial = new URLSearchParams(location.search).get("track");
  if (initial) apply(initial);
})();


/* Theme toggle. The no-flash script in <head> has already set the initial
   theme from localStorage; this only handles the click and keeps the button's
   accessible state in sync. Default (no stored value) is light. */
(function () {
  var toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  function sync() {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    toggle.setAttribute("aria-pressed", dark ? "true" : "false");
    toggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }

  sync();

  toggle.addEventListener("click", function () {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    if (dark) {
      document.documentElement.setAttribute("data-theme", "light");
      try { localStorage.setItem("theme", "light"); } catch (e) {}
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      try { localStorage.setItem("theme", "dark"); } catch (e) {}
    }
    sync();
  });
})();
