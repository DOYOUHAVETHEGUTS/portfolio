/* Parlay simulator sample dataset.
   Mock odds across three books; match results are fixed so a slip can be
   graded. Nothing here is live data and no book is queried. */

window.PARLAY_DATA = {
  books: ["DraftKings", "FanDuel", "Bet365"],

  competitions: [
    { id: "wc26", label: "World Cup 2026", available: true },
    { id: "epl", label: "Premier League", available: true },
    { id: "ufc", label: "UFC", available: false }
  ],

  /* odds: American price per book, indexed [home, draw, away].
     result: "home" | "draw" | "away" */
  matches: [
    { id: "m01", comp: "wc26", date: "2026-06-13", home: "Brazil", away: "Morocco",
      odds: { DraftKings: [-155, 265, 430], FanDuel: [-160, 260, 425], Bet365: [-150, 270, 410] },
      result: "draw" },
    { id: "m02", comp: "wc26", date: "2026-06-14", home: "France", away: "Canada",
      odds: { DraftKings: [-185, 300, 520], FanDuel: [-180, 310, 540], Bet365: [-190, 295, 515] },
      result: "home" },
    { id: "m03", comp: "wc26", date: "2026-06-15", home: "Norway", away: "Japan",
      odds: { DraftKings: [135, 225, 195], FanDuel: [140, 220, 190], Bet365: [130, 230, 200] },
      result: "home" },
    { id: "m04", comp: "wc26", date: "2026-06-16", home: "Ecuador", away: "Netherlands",
      odds: { DraftKings: [260, 215, -115], FanDuel: [255, 220, -110], Bet365: [270, 210, -120] },
      result: "home" },
    { id: "m05", comp: "wc26", date: "2026-06-17", home: "England", away: "Ghana",
      odds: { DraftKings: [-250, 380, 700], FanDuel: [-260, 375, 690], Bet365: [-245, 390, 715] },
      result: "home" },
    { id: "m06", comp: "wc26", date: "2026-06-18", home: "Argentina", away: "Croatia",
      odds: { DraftKings: [-120, 240, 330], FanDuel: [-125, 235, 340], Bet365: [-115, 245, 325] },
      result: "away" },
    { id: "m07", comp: "wc26", date: "2026-06-19", home: "Portugal", away: "Uruguay",
      odds: { DraftKings: [-140, 250, 370], FanDuel: [-135, 255, 380], Bet365: [-145, 245, 365] },
      result: "home" },
    { id: "m08", comp: "wc26", date: "2026-06-20", home: "Spain", away: "Senegal",
      odds: { DraftKings: [-200, 320, 560], FanDuel: [-195, 325, 570], Bet365: [-205, 315, 555] },
      result: "draw" },
    { id: "m09", comp: "wc26", date: "2026-06-21", home: "Germany", away: "Mexico",
      odds: { DraftKings: [-170, 280, 470], FanDuel: [-175, 275, 460], Bet365: [-165, 285, 480] },
      result: "home" },
    { id: "m10", comp: "wc26", date: "2026-06-22", home: "Belgium", away: "Colombia",
      odds: { DraftKings: [-110, 235, 300], FanDuel: [-105, 240, 295], Bet365: [-115, 230, 305] },
      result: "away" },

    { id: "e01", comp: "epl", date: "2026-05-02", home: "Arsenal", away: "Brighton",
      odds: { DraftKings: [-165, 285, 450], FanDuel: [-170, 280, 440], Bet365: [-160, 290, 455] },
      result: "home" },
    { id: "e02", comp: "epl", date: "2026-05-02", home: "Liverpool", away: "Everton",
      odds: { DraftKings: [-230, 350, 620], FanDuel: [-225, 355, 630], Bet365: [-235, 345, 610] },
      result: "home" },
    { id: "e03", comp: "epl", date: "2026-05-03", home: "Chelsea", away: "Newcastle",
      odds: { DraftKings: [125, 230, 210], FanDuel: [130, 225, 205], Bet365: [120, 235, 215] },
      result: "draw" },
    { id: "e04", comp: "epl", date: "2026-05-03", home: "Man City", away: "Aston Villa",
      odds: { DraftKings: [-275, 400, 750], FanDuel: [-280, 395, 740], Bet365: [-270, 405, 760] },
      result: "home" },
    { id: "e05", comp: "epl", date: "2026-05-04", home: "Tottenham", away: "Fulham",
      odds: { DraftKings: [-145, 260, 390], FanDuel: [-150, 255, 385], Bet365: [-140, 265, 395] },
      result: "away" },
    { id: "e06", comp: "epl", date: "2026-05-04", home: "Man United", away: "West Ham",
      odds: { DraftKings: [-130, 245, 350], FanDuel: [-135, 250, 345], Bet365: [-125, 240, 355] },
      result: "home" },
    { id: "e07", comp: "epl", date: "2026-05-05", home: "Nottingham Forest", away: "Bournemouth",
      odds: { DraftKings: [115, 225, 230], FanDuel: [110, 230, 235], Bet365: [120, 220, 225] },
      result: "away" },
    { id: "e08", comp: "epl", date: "2026-05-05", home: "Crystal Palace", away: "Wolves",
      odds: { DraftKings: [-105, 220, 285], FanDuel: [-110, 225, 280], Bet365: [-100, 215, 290] },
      result: "draw" }
  ]
};
