/* ============================================================================
   Synthetic data for the Market Data Pipeline walkthrough.
   Everything here is fictional. "Summit Financial" is an invented institution;
   holdings, prices, articles, and movers are made up for demonstration. Edit
   this file to change what the demo shows — nothing is hard-coded in the UI.
   ========================================================================== */
window.PIPELINE_DATA = {
  institution: {
    name: "Summit Financial",
    tagline: "Fictional brokerage · demo only",
    demoUser: "demo_user"
  },

  portfolio: {
    value: 148230.55,
    dailyChange: 1284.10,
    dailyPct: 0.87,
    weeklyChange: -2140.30,
    weeklyPct: -1.42,
    holdings: [
      { symbol: "SMHX", name: "Semiconductor Index ETF", sector: "Semiconductors", shares: 120, price: 214.60, day: 2.1, gain: 18.4 },
      { symbol: "AVTC", name: "Aerospace & Defense Co.", sector: "Aerospace",       shares: 80,  price: 168.25, day: -1.8, gain: 9.2 },
      { symbol: "NBIT", name: "Cloud Software Inc.",      sector: "Technology",     shares: 60,  price: 312.90, day: 1.4, gain: 27.6 },
      { symbol: "PWEN", name: "Energy Holdings",          sector: "Energy",         shares: 150, price: 71.40,  day: -0.9, gain: -4.1 },
      { symbol: "FDCX", name: "Financials Sector ETF",    sector: "Financials",     shares: 100, price: 44.15,  day: 0.6, gain: 6.8 },
      { symbol: "CASH", name: "Cash & sweep",             sector: "Cash",           shares: 1,   price: 9860.00, day: 0.0, gain: 0.0 }
    ]
  },

  // Premium: AI-explained articles, personalized to the holdings above.
  articles: [
    { headline: "Chip demand forecast raised on data-center buildout", source: "Market Wire", time: "2h ago",
      tag: "Semiconductors", why: "Your portfolio has significant exposure to semiconductors (SMHX, ~17% of holdings), the sector this forecast covers." },
    { headline: "Defense budget bill advances through committee", source: "Capitol Desk", time: "5h ago",
      tag: "Aerospace", why: "You hold AVTC in aerospace & defense; appropriations news tends to move this sector directly." },
    { headline: "Cloud spending resilient despite macro caution", source: "Tech Daily", time: "6h ago",
      tag: "Technology", why: "NBIT is your largest single gainer (+27.6%); this piece speaks to the demand driving it." }
  ],

  // Premium: biggest movers, filtered to sectors the portfolio actually holds.
  movers: [
    { name: "Semiconductor Index ETF", sector: "Semiconductors", pct: 4.2 },
    { name: "Cloud Software Inc.",      sector: "Technology",     pct: 3.1 },
    { name: "Financials Sector ETF",    sector: "Financials",     pct: 2.4 },
    { name: "Energy Holdings",          sector: "Energy",         pct: -2.7 },
    { name: "Aerospace & Defense Co.",  sector: "Aerospace",      pct: -3.8 }
  ]
};
