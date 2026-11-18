/* ============================================================================
   Constellation career-map data
   ----------------------------------------------------------------------------
   The graph is data, not code. Rendering components read this and stay dumb —
   to add a field, a skill, or a career, edit this file and nothing else.

   Node kinds form a chain:   field → skill → education → role
   Each `skill` can carry `goals`: concrete, checkable objectives that the
   Waypoint progress tracker consumes when a visitor sends a skill across.

   window.MAP_DATA = { nodes: [...], links: [...] }
   ========================================================================== */
window.MAP_DATA = (function () {
  // ---- Nodes ---------------------------------------------------------------
  // kind: field | skill | education | role
  // Every node: id, kind, label, summary. Skills add: goals[]. Roles add: demand.
  var nodes = [
    // ── Fields ──────────────────────────────────────────────────────────
    { id: "data-science", kind: "field", label: "Data Science",
      summary: "Turning data into models and decisions — statistics, machine learning, and the engineering to run them." },
    { id: "analytics", kind: "field", label: "Analytics & BI",
      summary: "Measuring how a business actually performs and building the reporting that keeps it honest." },
    { id: "security", kind: "field", label: "Cybersecurity",
      summary: "Defending systems by understanding how they break — detection, hardening, and response." },
    { id: "software", kind: "field", label: "Software Engineering",
      summary: "Designing and shipping applications: interfaces, services, and the systems beneath them." },

    // ── Skills ──────────────────────────────────────────────────────────
    // Data science
    { id: "python", kind: "skill", label: "Python", field: "data-science",
      summary: "The working language of data science — analysis, modeling, and automation.",
      goals: [
        { title: "Write a script that loads, cleans, and summarizes a CSV", credits: 4 },
        { title: "Build a reusable function library with tests", credits: 6 }
      ] },
    { id: "ml", kind: "skill", label: "Machine Learning", field: "data-science",
      summary: "Fitting models that generalize, and knowing when they don't.",
      goals: [
        { title: "Train a baseline model and beat it with a second approach", credits: 8 },
        { title: "Evaluate with a proper holdout and a calibration check", credits: 6 }
      ] },
    { id: "cv", kind: "skill", label: "Computer Vision", field: "data-science",
      summary: "Making sense of images and video — features, matching, and detection.",
      goals: [
        { title: "Extract and compare image features across two sources", credits: 7 },
        { title: "Ship a similarity search over a small media set", credits: 9 }
      ] },

    // Analytics
    { id: "sql", kind: "skill", label: "SQL", field: "analytics",
      summary: "Asking precise questions of data where it lives.",
      goals: [
        { title: "Write joins and aggregations against a real schema", credits: 4 },
        { title: "Reconcile two sources into one correct joined view", credits: 6 }
      ] },
    { id: "pipelines", kind: "skill", label: "Data Pipelines", field: "analytics",
      summary: "Moving data reliably from source to report without a human in the loop.",
      goals: [
        { title: "Build an idempotent ingest that can re-run safely", credits: 7 },
        { title: "Add a failure alert so a silent pipeline can't hide", credits: 4 }
      ] },
    { id: "dataviz", kind: "skill", label: "Data Visualization", field: "analytics",
      summary: "Making a number legible enough to drive a decision.",
      goals: [
        { title: "Turn a flat table into a chart that answers a question", credits: 4 },
        { title: "Build an interactive view a non-analyst can read", credits: 6 }
      ] },

    // Security
    { id: "linux", kind: "skill", label: "Linux & Networking", field: "security",
      summary: "The ground floor: shells, permissions, and how traffic actually moves.",
      goals: [
        { title: "Stand up an isolated lab network you fully control", credits: 6 },
        { title: "Capture and read traffic for one protocol end to end", credits: 5 }
      ] },
    { id: "detection", kind: "skill", label: "Detection Engineering", field: "security",
      summary: "Knowing what an attack leaves behind and writing the query that catches it.",
      goals: [
        { title: "Map one technique to its log artifacts", credits: 6 },
        { title: "Write a detection that survives normal noise", credits: 8 }
      ] },

    // Software
    { id: "frontend", kind: "skill", label: "Frontend", field: "software",
      summary: "Interfaces people can actually use, including the states nobody screenshots.",
      goals: [
        { title: "Build a component with real empty and error states", credits: 5 },
        { title: "Make it responsive and keyboard-accessible", credits: 5 }
      ] },
    { id: "apis", kind: "skill", label: "APIs & Services", field: "software",
      summary: "The contracts between systems — designing them and keeping them honest.",
      goals: [
        { title: "Design and document one small HTTP service", credits: 6 },
        { title: "Add auth scoping so callers only see their own data", credits: 7 }
      ] },

    // ── Education ───────────────────────────────────────────────────────
    { id: "edu-stats", kind: "education", label: "Statistics & Probability",
      summary: "Coursework or self-study in inference, distributions, and experimental design — the backbone of honest modeling." },
    { id: "edu-cs", kind: "education", label: "CS Fundamentals",
      summary: "Data structures, algorithms, and systems — the shared vocabulary of every technical role here." },
    { id: "edu-certs", kind: "education", label: "Security Certifications",
      summary: "Structured coverage of security concepts (Security+, CySA+) that establishes the vocabulary a lab then makes real." },

    // ── Roles ───────────────────────────────────────────────────────────
    { id: "role-ds", kind: "role", label: "Data Scientist", demand: "high",
      summary: "Builds models and analyses that inform decisions. Wants evidence you can go from messy data to a defensible result." },
    { id: "role-analyst", kind: "role", label: "Analytics Engineer", demand: "high",
      summary: "Owns the pipeline and the reporting. Wants reliability and clear communication more than exotic models." },
    { id: "role-mle", kind: "role", label: "ML / CV Engineer", demand: "medium",
      summary: "Ships models into products. Wants working systems, not notebooks — latency, scale, and evaluation." },
    { id: "role-secops", kind: "role", label: "Security Analyst", demand: "high",
      summary: "Detects and responds to threats. Wants practical, lab-backed evidence you can see what an attack leaves behind." },
    { id: "role-swe", kind: "role", label: "Software Engineer", demand: "high",
      summary: "Builds and maintains applications. Wants proof you can ship something whole and reason about its failure modes." }
  ];

  // ---- Links ---------------------------------------------------------------
  // Directed source → target. The chain reads field → skill → education → role,
  // with skills feeding the roles they support and drawing on the education
  // that grounds them.
  var links = [
    // field → skill
    ["data-science", "python"], ["data-science", "ml"], ["data-science", "cv"],
    ["analytics", "sql"], ["analytics", "pipelines"], ["analytics", "dataviz"],
    ["security", "linux"], ["security", "detection"],
    ["software", "frontend"], ["software", "apis"],

    // skill → education (what grounds the skill)
    ["ml", "edu-stats"], ["python", "edu-cs"], ["cv", "edu-stats"],
    ["detection", "edu-certs"], ["linux", "edu-certs"], ["apis", "edu-cs"],
    ["sql", "edu-cs"],

    // skill → role (what the skill leads to)
    ["python", "role-ds"], ["ml", "role-ds"], ["ml", "role-mle"], ["cv", "role-mle"],
    ["sql", "role-analyst"], ["pipelines", "role-analyst"], ["dataviz", "role-analyst"],
    ["pipelines", "role-ds"],
    ["linux", "role-secops"], ["detection", "role-secops"],
    ["frontend", "role-swe"], ["apis", "role-swe"], ["apis", "role-mle"]
  ].map(function (p) { return { source: p[0], target: p[1] }; });

  return { nodes: nodes, links: links };
})();
