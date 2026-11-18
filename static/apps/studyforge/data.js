/* StudyForge demo dataset. Flashcards and quiz questions generated from two real
   chapters that were run through the actual pipeline — the Network+ OSI models
   chapter and the Security+ security-controls chapter. Content is faithful to the
   source material; this is a static rebuild of the study view, no LLM is called. */

window.STUDYFORGE_DATA = {
  materials: [
    {
      id: "netplus",
      exam: "CompTIA Network+ N10-008",
      section: "Chapter 1: Network Models",
      pages: "pp. 1–14",
      grounded: true,
      flashcards: [
        { q: "What two things does the OSI model give network technicians?",
          a: "A troubleshooting tool (isolate which layer a problem occurs at) and a common language (terms like \"Layer 3 device\" are universally understood)." },
        { q: "List the OSI seven layers, top to bottom.",
          a: "Application, Presentation, Session, Transport, Network, Data Link, Physical. Mnemonic: \"All People Seem To Need Data Processing.\"" },
        { q: "What is the PDU at Layers 2, 3, and 4?",
          a: "Layer 2 = Frame, Layer 3 = Packet, Layer 4 = Segment (TCP) or Datagram (UDP)." },
        { q: "Describe a MAC address.",
          a: "A 48-bit physical address burned into the NIC, written in hex. First 24 bits = OUI (vendor), last 24 bits = device ID. Also called MAC-48 / EUI-48." },
        { q: "How do a hub, switch, and router differ by OSI layer?",
          a: "Hub = Layer 1 (copies frames to all ports except the source). Switch = Layer 2 (filters by MAC, sends only to the destination port). Router = Layer 3 (forwards by IP address)." },
        { q: "TCP vs. UDP?",
          a: "TCP is connection-oriented — verifies the connection before sending (e.g., SMTP). UDP is connectionless — sends without verifying the receiver is ready (e.g., VoIP)." },
        { q: "What is encapsulation?",
          a: "Wrapping data as it moves down the stack — each layer adds its own header so the data reaches the right destination. Decapsulation is the reverse: stripping headers as data moves back up on the receiving end." },
        { q: "Which OSI layer is the only one with sublayers, and what are they?",
          a: "The Data Link layer. LLC (Logical Link Control) talks to the OS via drivers; MAC (Media Access Control) creates and addresses frames and checks the FCS." }
      ],
      quiz: [
        { q: "Which device operates at Layer 2 and filters traffic by MAC address?",
          choices: ["Hub", "Switch", "Router", "Repeater"], answer: 1,
          why: "A switch reads the destination MAC and forwards the frame only to the associated port. A hub (Layer 1) copies to all ports; a router works at Layer 3 by IP." },
        { q: "What is the PDU of the Transport layer when TCP is used?",
          choices: ["Frame", "Packet", "Segment", "Datagram"], answer: 2,
          why: "TCP creates a Segment (with sequence numbers). UDP creates a Datagram. Frame is Layer 2, Packet is Layer 3." },
        { q: "The broadcast MAC address is:",
          choices: ["00-00-00-00-00-00", "FF-FF-FF-FF-FF-FF", "192.168.4.232", "01-00-5E-00-00-01"], answer: 1,
          why: "FF-FF-FF-FF-FF-FF is processed by every NIC on the network." },
        { q: "Which protocol pair is connection-oriented vs. connectionless?",
          choices: ["TCP oriented / UDP connectionless", "UDP oriented / TCP connectionless", "Both oriented", "Both connectionless"], answer: 0,
          why: "TCP verifies a connection before sending; UDP does not. That's why SMTP uses TCP and VoIP uses UDP." }
      ]
    },
    {
      id: "secplus",
      exam: "CompTIA Security+ SY0-701",
      section: "Chapter 1: Compare and contrast various types of security controls",
      pages: "pp. 70–88",
      grounded: false,
      flashcards: [
        { q: "What are the two ways to classify security controls?",
          a: "Control Categories — what the control is (technical, managerial, operational, physical). Control Types — how the control functions (preventive, deterrent, detective, corrective, compensating, directive)." },
        { q: "Can a single control belong to a category and a type at the same time?",
          a: "Yes. For example, a firewall is a technical (category) and preventive (type) control simultaneously." },
        { q: "What are the four control categories?",
          a: "Technical, Managerial, Operational, and Physical." },
        { q: "Name the six control types.",
          a: "Preventive, Deterrent, Detective, Corrective, Compensating, and Directive." },
        { q: "What is a technical control?",
          a: "A technology-based measure that protects systems, networks, and data — implemented by the security team. Firewalls are a common example." }
      ],
      quiz: [
        { q: "A firewall is best described as which category and type?",
          choices: ["Managerial, detective", "Technical, preventive", "Physical, deterrent", "Operational, corrective"], answer: 1,
          why: "A firewall is technology-based (technical) and stops events before they happen (preventive)." },
        { q: "\"What the control is\" refers to its:",
          choices: ["Control type", "Control category", "Control owner", "Control cost"], answer: 1,
          why: "Category = what the control is (technical/managerial/operational/physical). Type = how it functions." },
        { q: "Which of these is a control TYPE, not a category?",
          choices: ["Technical", "Physical", "Deterrent", "Managerial"], answer: 2,
          why: "Deterrent is a type (how it functions). The other three are categories (what it is)." },
        { q: "How many control types does the objective define?",
          choices: ["Four", "Five", "Six", "Seven"], answer: 2,
          why: "Six: preventive, deterrent, detective, corrective, compensating, directive." }
      ]
    }
  ]
};

/* Languages tab. Reflects a real Spanish learning path run through StudyForge —
   a professional/workplace goal, an honest self-estimate (explicitly not an
   official CEFR result), and a slice of the generated weekly plan. */
window.STUDYFORGE_LANGUAGES = {
  language: "Spanish",
  goal: "Professional / work",
  cadence: "A few times a week",
  target: "2026-12-31",
  level: "approx. B2",
  disclaimer: "StudyForge estimate — not an official CEFR result",
  skills: [
    { label: "Grammar", score: 62 },
    { label: "Vocabulary", score: 58 },
    { label: "Reading", score: 65 },
    { label: "Writing", score: 55 },
    { label: "Listening", score: 60 },
    { label: "Speaking", score: 65 }
  ],
  priorities: [
    "Formal register and tone for workplace writing (emails, reports)",
    "Business and industry-specific vocabulary building",
    "Subjunctive and formal grammatical constructions in professional contexts",
    "Listening comprehension for meetings and presentations"
  ],
  weeklyPlan: [
    { week: 1, focus: "Formal register fundamentals + business vocabulary (finance/management terms)" },
    { week: 2, focus: "Email writing practice with formal phrases and subjunctive mood review" },
    { week: 3, focus: "Listening practice with workplace audio (meetings, voicemails) + note-taking strategies" },
    { week: 4, focus: "Reading professional documents (reports, memos) and sector-specific vocabulary" },
    { week: 5, focus: "Speaking practice for meetings — stating opinions, agreeing/disagreeing formally" },
    { week: 6, focus: "Writing structured reports and proposals with formal tone and subjunctive constructions" },
    { week: 7, focus: "Cultural norms in professional contexts + negotiation vocabulary" },
    { week: 8, focus: "Integrated review — mock meeting simulation, written report, listening assessment" }
  ]
};

/* Interview Prep tab. The real feature points at a specific job posting and
   generates targeted questions and a rehearsal flow. This example is fully
   genericized — fictional role and company, same structure and question types
   as the real output. */
window.STUDYFORGE_INTERVIEW = {
  role: "Regional Operations Analyst",
  company: "Meridian Freight Holdings (example, fictional)",
  status: "Ready",
  questions: [
    { type: "Behavioral",
      q: "Tell me about a time you identified a problem before anyone asked you to.",
      approach: "Pick a specific, bounded example. Name the signal that tipped you off, what you checked before raising it, and what changed as a result. End with the outcome in a measurable term if you have one." },
    { type: "Behavioral",
      q: "Describe handling competing urgent priorities with an unhappy stakeholder.",
      approach: "Show the triage logic, not just the resolution — how you decided what came first, and how you communicated that decision to the stakeholder who didn't get priority." },
    { type: "Behavioral",
      q: "Tell me about a time you proposed a change that wasn't technically your job to propose.",
      approach: "Lead with the trigger that made you speak up, then the ownership you took to see it through, not just the idea itself. Initiative reads better as follow-through than as a suggestion." },
    { type: "Case / Reasoning",
      q: "A key metric has moved sharply worse this month. Walk me through how you'd investigate.",
      approach: "State a structure out loud before diving in: clarify the ask, frame what data you'd pull, segment to isolate where the change concentrates, quantify the impact, then recommend a fix and a recurring control so it doesn't require manual re-investigation next time." },
    { type: "Case / Reasoning",
      q: "Three data sources disagree on the same number. How do you reconcile them?",
      approach: "Establish which source is authoritative and why, check definitions and time windows before assuming a data error, and describe how you'd document the reconciliation so it doesn't have to be redone." },
    { type: "Rapid Technical",
      q: "How have you used AI or automation tools in an actual analytics task?",
      approach: "Have two concrete, specific examples ready — what the task was, what the tool did versus what you did, and why it was faster or more reliable than doing it by hand. Avoid a general answer about being interested in AI." }
  ]
};
