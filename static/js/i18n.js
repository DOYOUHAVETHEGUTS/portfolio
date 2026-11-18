/* Lightweight i18n for the site chrome. UI strings carry a data-i18n key; this
   swaps their text between English and neutral Latin American Spanish and
   persists the choice, mirroring how the theme toggle works. Case-study body
   content stays in English (a notice is shown on those pages). No dependency. */
(function () {
  "use strict";

  var DICT = {
    "nav.work":        { en: "Work",              es: "Proyectos" },
    "nav.portfolio":   { en: "Portfolio",         es: "Portafolio" },
    "nav.lab":         { en: "Lab",               es: "Laboratorio" },
    "nav.about":       { en: "About",             es: "Acerca de" },
    "nav.resume":      { en: "Résumé",            es: "Currículum" },
    "hero.see":        { en: "See the work",      es: "Ver el trabajo" },
    "hero.resume":     { en: "Download résumé",   es: "Descargar currículum" },
    "home.selected":   { en: "Selected work",     es: "Trabajo destacado" },
    "home.built":      { en: "Things I've built", es: "Cosas que he construido" },
    "home.lede":       { en: "Each one is a full case study — the problem, the data, what I built, and what it produced. Several run as live demos in the browser.",
                         es: "Cada uno es un caso de estudio completo: el problema, los datos, lo que construí y lo que produjo. Varios funcionan como demos en vivo en el navegador." },
    "home.allwriteups":{ en: "All writeups →",    es: "Ver todos los apuntes →" },
    "home.fromlab":    { en: "From the lab",      es: "Desde el laboratorio" },
    "home.whatiwork":  { en: "What I work with",  es: "Con qué trabajo" },
    "board.projects":  { en: "projects",          es: "proyectos" },
    "foot.getintouch": { en: "Get in touch",      es: "Ponte en contacto" },
    "foot.elsewhere":  { en: "Elsewhere",         es: "En otros lugares" },
    "foot.colophon":   { en: "Colophon",          es: "Colofón" },
    "foot.opento":     { en: "Open to conversations about data science, analytics, and security engineering roles.",
                         es: "Abierto a conversaciones sobre puestos en ciencia de datos, analítica e ingeniería de seguridad." },
    "lang.toggle":     { en: "Español",           es: "English" },
    "lang.label":      { en: "Switch to Spanish", es: "Cambiar a inglés" },
    "notice.english":  { en: "",
                         es: "Nota: el texto detallado de este caso de estudio está disponible en inglés." }
  };

  function apply(lang) {
    document.documentElement.setAttribute("lang", lang);
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var entry = DICT[el.getAttribute("data-i18n")];
      if (entry && entry[lang] != null) el.textContent = entry[lang];
    });
    // Case-study English notice (only rendered on pages that include it).
    var notice = document.getElementById("lang-notice");
    if (notice) {
      notice.textContent = DICT["notice.english"][lang] || "";
      notice.style.display = lang === "es" ? "" : "none";
    }
    var btn = document.getElementById("lang-toggle");
    if (btn) {
      btn.textContent = DICT["lang.toggle"][lang];
      btn.setAttribute("aria-label", DICT["lang.label"][lang]);
    }
  }

  var pageDefault = document.documentElement.getAttribute("data-lang-default");
  var saved = (pageDefault === "es") ? "es" : "en";
  try {
    var stored = localStorage.getItem("lang");
    if (stored === "es" || stored === "en") saved = stored;
  } catch (e) {}
  apply(saved);

  var btn = document.getElementById("lang-toggle");
  if (btn) {
    btn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("lang") === "es" ? "en" : "es";
      try { localStorage.setItem("lang", next); } catch (e) {}
      apply(next);
    });
  }
})();
