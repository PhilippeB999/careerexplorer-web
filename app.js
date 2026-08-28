/* =====================================================================
   Career Explorer — MOTEUR (app.js)
   Outil d'orientation bilingue FR/EN pour élèves du secondaire.
   Réutilise l'infrastructure des apps Quest (PWA, thème clair, Supabase
   publiable en dur, identité anonyme). AUCUN secret ici.
   Écrans : accueil → quiz → résultats → fiche métier → comparer.
   ===================================================================== */

/* ---------------- Supabase (analytique anonyme) ----------------
   Clé PUBLIABLE seulement (sûre côté client, protégée par la RLS).
   ⚠️ TODO Supabase : la RPC `enregistrer_evenement` n'existe pas encore.
   Tant qu'elle n'est pas créée, track() dégrade proprement (console).
   Aucun vrai nom / courriel / date de naissance n'est jamais transmis. */
const SUPABASE_URL = "https://gejmaxobebsamvfkkpoj.supabase.co";
const SUPABASE_KEY = "sb_publishable_jqf5eYy0Coka5d0-E86JJQ_bCiQDyvD";

/* Identifiant d'appareil anonyme, stable, généré localement (pas de vrai nom). */
function deviceId() {
  let id = localStorage.getItem("careerexplorer_device_id");
  if (!id) {
    id = "ce-" + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
    localStorage.setItem("careerexplorer_device_id", id);
  }
  return id;
}

/* Envoi d'un événement d'analytique. Non bloquant.
   Événements clés : quiz_started, quiz_completed, trade_viewed.
   But final (Eastern Shores) : mesurer combien d'élèves vont jusqu'au bout. */
async function track(event, props) {
  const payload = {
    p_eleve: deviceId(),
    p_event: event,
    p_props: props || {},
    p_lang: state.lang,
    p_ts: new Date().toISOString()
  };
  // On garde aussi une trace locale (utile pour déboguer / démo hors ligne).
  try {
    const log = JSON.parse(localStorage.getItem("careerexplorer_events") || "[]");
    log.push({ event, props: payload.p_props, ts: payload.p_ts });
    localStorage.setItem("careerexplorer_events", JSON.stringify(log.slice(-200)));
  } catch (e) { /* stockage plein : sans importance */ }

  if (!navigator.onLine) { console.info("[track] hors ligne, en attente:", event); return; }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/enregistrer_evenement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.warn(`[track] TODO Supabase : créer la RPC 'enregistrer_evenement' (HTTP ${res.status}). Événement '${event}' non enregistré côté serveur, gardé localement.`);
    }
  } catch (e) {
    console.warn("[track] réseau/RPC indisponible, événement gardé localement :", event);
  }
}

/* ---------------- État ---------------- */
const state = {
  lang: localStorage.getItem("careerexplorer_lang") || "fr",
  name: "",
  screen: "home",
  quizIndex: 0,
  answers: {},          // qid -> 0..4
  ranked: [],           // [{trade, pct}]
  currentTradeId: null,
  scenario: { step: 0, picks: [] },   // progression de la mise en situation en cours
  compare: []           // ids de métiers sélectionnés (max 2)
};

const root = document.getElementById("app");

/* ---------------- Textes d'interface (i18n) ---------------- */
const UI = {
  fr: {
    appName: "Explorateur de métiers",
    tagline: "Trouve le métier qui te ressemble.",
    welcome: "Réponds à quelques questions et découvre les métiers d'Eastern Shores faits pour toi. Aucune bonne ou mauvaise réponse — juste toi.",
    namePlaceholder: "Ton prénom (facultatif)",
    start: "Commencer",
    switchLang: "English",
    qOf: (a, b) => `Question ${a} sur ${b}`,
    next: "Suivant",
    back: "Retour",
    seeResults: "Voir mes résultats",
    resultsTitle: "Tes métiers les mieux appariés",
    resultsIntro: "Selon tes réponses, voici les métiers d'Eastern Shores qui collent le plus à tes intérêts. Clique pour explorer chacun.",
    affinity: "affinité",
    topMatch: "Meilleur jumelage",
    retake: "Refaire le quiz",
    compareBtn: "Comparer 2 métiers",
    whatIsIt: "C'est quoi ?",
    theProgram: "Le programme",
    salary: "Salaire médian",
    inDemand: "En demande ?",
    sourceLabel: "Salaire médian et perspectives",
    tryScenario: "Mise en situation",
    tryQuest: "Essayer l'app Quest",
    noQuest: "App Quest à venir",
    toValidate: "à valider",
    salaryPlaceholder: "À valider — Guichet-Emplois",
    demandPlaceholder: "À valider — perspectives Guichet-Emplois",
    scenarioIntro: "Mets-toi dans la peau du métier. Fais un choix à chaque étape.",
    scenarioDone: "Tu as terminé la mise en situation !",
    restart: "Recommencer",
    chooseTwo: "Choisis 2 métiers à comparer",
    compareTitle: "Comparaison",
    daily: "Le quotidien",
    swap: "Changer",
    yourProfile: "Ton profil d'intérêts",
    backHome: "Accueil",
    dailyLabel: "Au quotidien",
    demandLevels: { 1: "Perspectives limitées", 2: "Perspectives modérées", 3: "Bonnes perspectives" }
  },
  en: {
    appName: "Career Explorer",
    tagline: "Find the trade that fits you.",
    welcome: "Answer a few questions and discover the Eastern Shores trades made for you. No right or wrong answers — just you.",
    namePlaceholder: "Your first name (optional)",
    start: "Get started",
    switchLang: "Français",
    qOf: (a, b) => `Question ${a} of ${b}`,
    next: "Next",
    back: "Back",
    seeResults: "See my results",
    resultsTitle: "Your best-matched trades",
    resultsIntro: "Based on your answers, here are the Eastern Shores trades that fit your interests best. Tap to explore each one.",
    affinity: "match",
    topMatch: "Top match",
    retake: "Retake the quiz",
    compareBtn: "Compare 2 trades",
    whatIsIt: "What is it?",
    theProgram: "The program",
    salary: "Median wage",
    inDemand: "In demand?",
    sourceLabel: "Median wage and outlook",
    tryScenario: "Try a day on the job",
    tryQuest: "Try the Quest app",
    noQuest: "Quest app coming soon",
    toValidate: "to be confirmed",
    salaryPlaceholder: "To be confirmed — Job Bank",
    demandPlaceholder: "To be confirmed — Job Bank outlook",
    scenarioIntro: "Step into the job. Make a choice at each stage.",
    scenarioDone: "You finished the scenario!",
    restart: "Start over",
    chooseTwo: "Pick 2 trades to compare",
    compareTitle: "Comparison",
    daily: "Daily life",
    swap: "Change",
    yourProfile: "Your interest profile",
    backHome: "Home",
    dailyLabel: "Day to day",
    demandLevels: { 1: "Limited outlook", 2: "Moderate outlook", 3: "Good outlook" }
  }
};
function t(key) { return UI[state.lang][key]; }
function L(objFr, objEn) { return state.lang === "fr" ? objFr : objEn; }

/* ---------------- Utilitaires ---------------- */
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function tradeName(tr) { return state.lang === "fr" ? tr.nameFr : tr.nameEn; }
function tradeById(id) { return TRADES.find(x => x.id === id); }

function toggleLang() {
  state.lang = state.lang === "fr" ? "en" : "fr";
  localStorage.setItem("careerexplorer_lang", state.lang);
  render();
}

/* ---------------- Jumelage (matching) ----------------
   On construit le vecteur d'intérêts de l'élève à partir des réponses (0–4)
   pondérées par les dimensions de chaque énoncé, puis on le compare au profil
   de chaque métier par similarité cosinus → un % d'affinité, classé. */
function computeUserVector() {
  const vec = {};
  for (const key in DIMENSIONS) vec[key] = 0;
  QUIZ.forEach(q => {
    const ans = state.answers[q.id];
    if (typeof ans !== "number") return;
    for (const dim in q.dims) vec[dim] += ans * q.dims[dim];
  });
  return vec;
}
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (const k in DIMENSIONS) {
    const av = a[k] || 0, bv = b[k] || 0;
    dot += av * bv; na += av * av; nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
function rankTrades() {
  const user = computeUserVector();
  const ranked = TRADES.map(tr => ({ trade: tr, pct: Math.round(cosine(user, tr.dims) * 100) }));
  ranked.sort((a, b) => b.pct - a.pct);
  return ranked;
}

/* ---------------- Rendu : barre de langue ---------------- */
function langBar(showBack, backFn) {
  return `<div class="topbar">
    ${showBack ? `<button class="link" onclick="${backFn}()">← ${esc(t("back"))}</button>` : "<span></span>"}
    <button class="link" onclick="toggleLang()">${esc(t("switchLang"))}</button>
  </div>`;
}

/* ---------------- Écran 1 : Accueil ---------------- */
function renderHome() {
  root.innerHTML = `
  <div class="screen home">
    ${langBar(false)}
    <div class="hero">
      <div class="logo">🧭</div>
      <h1>${esc(t("appName"))}</h1>
      <p class="tagline">${esc(t("tagline"))}</p>
    </div>
    <p class="intro">${esc(t("welcome"))}</p>
    <input id="nameInput" class="text-input" type="text" maxlength="24"
      placeholder="${esc(t("namePlaceholder"))}" value="${esc(state.name)}"
      oninput="state.name=this.value" autocomplete="given-name" />
    <button class="cta" onclick="startQuiz()">${esc(t("start"))} →</button>
    <p class="footnote">Eastern Shores · <span class="prov">${esc(t("toValidate"))}</span></p>
  </div>`;
}

function startQuiz() {
  state.answers = {};
  state.quizIndex = 0;
  state.screen = "quiz";
  track("quiz_started", { hasName: !!state.name });
  render();
}

/* ---------------- Écran 2 : Quiz d'intérêts ---------------- */
function renderQuiz() {
  const i = state.quizIndex;
  const q = QUIZ[i];
  const total = QUIZ.length;
  const current = state.answers[q.id];
  const pct = Math.round((i / total) * 100);
  root.innerHTML = `
  <div class="screen quiz">
    ${langBar(true, "quizBack")}
    <div class="progress"><div class="progress-fill" style="width:${pct}%"></div></div>
    <p class="qcount">${esc(t("qOf")(i + 1, total))}</p>
    <h2 class="statement">${esc(L(q.fr, q.en))}</h2>
    <div class="scale">
      ${SCALE.map(s => `
        <button class="scale-btn ${current === s.v ? "sel" : ""}" onclick="answerQuiz(${s.v})">
          <span class="scale-dot"></span>
          <span class="scale-lbl">${esc(L(s.fr, s.en))}</span>
        </button>`).join("")}
    </div>
    <div class="quiz-nav">
      <button class="ghost" onclick="quizBack()" ${i === 0 ? "disabled" : ""}>← ${esc(t("back"))}</button>
      <button class="cta small" onclick="quizNext()" ${typeof current !== "number" ? "disabled" : ""}>
        ${i === total - 1 ? esc(t("seeResults")) : esc(t("next")) + " →"}
      </button>
    </div>
  </div>`;
}
function answerQuiz(v) {
  state.answers[QUIZ[state.quizIndex].id] = v;
  render();
}
function quizNext() {
  if (typeof state.answers[QUIZ[state.quizIndex].id] !== "number") return;
  if (state.quizIndex < QUIZ.length - 1) {
    state.quizIndex++;
    render();
  } else {
    finishQuiz();
  }
}
function quizBack() {
  if (state.quizIndex > 0) { state.quizIndex--; render(); }
  else { state.screen = "home"; render(); }
}
function finishQuiz() {
  state.ranked = rankTrades();
  state.screen = "results";
  const top = state.ranked[0];
  track("quiz_completed", { top: top ? top.trade.id : null, topPct: top ? top.pct : null });
  render();
}

/* ---------------- Écran 3 : Résultats / Jumelage ---------------- */
function renderResults() {
  const items = state.ranked.length ? state.ranked : rankTrades();
  root.innerHTML = `
  <div class="screen results">
    ${langBar(false)}
    <h2 class="screen-title">${esc(t("resultsTitle"))}</h2>
    <p class="intro small">${esc(t("resultsIntro"))}</p>
    ${renderProfileBars()}
    <div class="match-list">
      ${items.map((it, idx) => `
        <button class="match-card ${idx === 0 ? "best" : ""}" onclick="openTrade('${it.trade.id}')">
          <span class="match-emoji">${it.trade.emoji}</span>
          <span class="match-body">
            <span class="match-name">${esc(tradeName(it.trade))}</span>
            <span class="match-code">${esc(it.trade.code)}</span>
            ${idx === 0 ? `<span class="best-tag">★ ${esc(t("topMatch"))}</span>` : ""}
          </span>
          <span class="match-pct">
            <span class="pct-num">${it.pct}%</span>
            <span class="pct-lbl">${esc(t("affinity"))}</span>
          </span>
        </button>`).join("")}
    </div>
    <div class="results-actions">
      <button class="cta" onclick="openCompare()">⚖️ ${esc(t("compareBtn"))}</button>
      <button class="ghost" onclick="restartAll()">↺ ${esc(t("retake"))}</button>
    </div>
  </div>`;
}
function renderProfileBars() {
  const user = computeUserVector();
  const max = Math.max(1, ...Object.values(user));
  const dims = Object.keys(DIMENSIONS)
    .map(k => ({ k, v: user[k] }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 4);
  return `<div class="profile">
    <div class="profile-title">${esc(t("yourProfile"))}</div>
    ${dims.map(d => `
      <div class="profile-row">
        <span class="profile-lbl">${DIMENSIONS[d.k].emoji} ${esc(L(DIMENSIONS[d.k].fr, DIMENSIONS[d.k].en))}</span>
        <span class="profile-bar"><span class="profile-fill" style="width:${Math.round((d.v / max) * 100)}%"></span></span>
      </div>`).join("")}
  </div>`;
}
function restartAll() {
  state.answers = {};
  state.quizIndex = 0;
  state.ranked = [];
  state.screen = "home";
  render();
}

/* ---------------- Écran 4 : Fiche métier ---------------- */
function openTrade(id) {
  state.currentTradeId = id;
  state.scenario = { step: 0, picks: [] };
  state.screen = "trade";
  track("trade_viewed", { trade: id });
  render();
}
function backToResults() { state.screen = "results"; render(); }

function salaryText(tr) {
  const s = tr.salary || {};
  // Priorité : salaire médian HORAIRE (donnée réelle du Guichet-Emplois).
  if (typeof s.hourly === "number") {
    const dec = Number.isInteger(s.hourly) ? 0 : 2;
    const n = s.hourly.toLocaleString(state.lang === "fr" ? "fr-CA" : "en-CA",
      { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return state.lang === "fr" ? `${n} $ / h` : `$${n} / hr`;
  }
  if (typeof s.annual === "number") {
    return state.lang === "fr"
      ? `${s.annual.toLocaleString("fr-CA")} $ / an`
      : `$${s.annual.toLocaleString("en-CA")} / yr`;
  }
  return `<span class="prov">${esc(t("salaryPlaceholder"))}</span>`;
}
function demandText(tr) {
  if (tr.demand && (tr.demand.demandLevel === 1 || tr.demand.demandLevel === 2 || tr.demand.demandLevel === 3)) {
    return esc(t("demandLevels")[tr.demand.demandLevel]);
  }
  return `<span class="prov">${esc(t("demandPlaceholder"))}</span>`;
}
// Citation Guichet-Emplois (région + date), affichée seulement si une vraie donnée existe.
function salarySourceNote(tr) {
  const s = tr.salary || {};
  const hasData = typeof s.hourly === "number" || typeof s.annual === "number"
    || (tr.demand && [1, 2, 3].includes(tr.demand.demandLevel));
  if (!hasData || !s.region) return "";
  const src = state.lang === "fr" ? "Guichet-Emplois" : "Job Bank";
  const when = s.updated ? ` · ${esc(s.updated)}` : "";
  return `<p class="src-note">${esc(t("sourceLabel"))} : ${src} — ${esc(s.region)}${when}.</p>`;
}

function renderTrade() {
  const tr = tradeById(state.currentTradeId);
  if (!tr) { state.screen = "results"; return render(); }
  root.innerHTML = `
  <div class="screen trade">
    <div class="topbar">
      <button class="link" onclick="backToResults()">← ${esc(t("back"))}</button>
      <button class="link" onclick="toggleLang()">${esc(t("switchLang"))}</button>
    </div>
    <div class="trade-head">
      <span class="trade-emoji">${tr.emoji}</span>
      <div>
        <h2>${esc(tradeName(tr))}</h2>
        <span class="trade-code">${esc(tr.code)}</span>
      </div>
    </div>

    <section class="info-block">
      <h3>💡 ${esc(t("whatIsIt"))}</h3>
      <p>${esc(L(tr.whatFr, tr.whatEn))}</p>
    </section>

    <section class="info-block">
      <h3>🎓 ${esc(t("theProgram"))}</h3>
      <p>${esc(L(tr.programFr, tr.programEn))}</p>
    </section>

    <div class="info-grid">
      <div class="info-tile">
        <div class="tile-lbl">💵 ${esc(t("salary"))}</div>
        <div class="tile-val">${salaryText(tr)}</div>
      </div>
      <div class="info-tile">
        <div class="tile-lbl">📈 ${esc(t("inDemand"))}</div>
        <div class="tile-val">${demandText(tr)}</div>
      </div>
    </div>
    ${salarySourceNote(tr)}

    <section class="info-block scenario">
      <h3>🎬 ${esc(t("tryScenario"))} — ${esc(L(tr.scenario.titleFr, tr.scenario.titleEn))}</h3>
      <div id="scenarioBox">${renderScenarioBox(tr)}</div>
    </section>

    <div class="trade-actions">
      ${tr.questUrl
        ? `<a class="cta quest" href="${tr.questUrl}" target="_blank" rel="noopener">🎮 ${esc(t("tryQuest"))} →</a>`
        : `<span class="cta disabled">🔒 ${esc(t("noQuest"))}</span>`}
    </div>
  </div>`;
}

/* Mise en situation interactive : un choix par étape, feedback immédiat. */
function renderScenarioBox(tr) {
  const sc = tr.scenario;
  const sp = state.scenario;
  if (sp.step >= sc.steps.length) {
    return `<div class="scenario-done">
      <p class="done-msg">✅ ${esc(t("scenarioDone"))}</p>
      <ul class="recap">
        ${sp.picks.map(p => `<li>${p.ok ? "✔️" : "○"} ${esc(p.fb)}</li>`).join("")}
      </ul>
      <button class="ghost small" onclick="restartScenario()">↺ ${esc(t("restart"))}</button>
    </div>`;
  }
  const step = sc.steps[sp.step];
  return `<p class="scenario-intro">${sp.step === 0 ? esc(t("scenarioIntro")) : ""}</p>
    <p class="scenario-prompt">${esc(L(step.promptFr, step.promptEn))}</p>
    <div class="scenario-choices">
      ${step.choices.map((c, ci) => `
        <button class="choice-btn" onclick="pickScenario(${ci})">${esc(L(c.fr, c.en))}</button>`).join("")}
    </div>`;
}
function pickScenario(ci) {
  const tr = tradeById(state.currentTradeId);
  const step = tr.scenario.steps[state.scenario.step];
  const choice = step.choices[ci];
  // La 1re option de chaque étape est le « bon » réflexe (données rédigées ainsi).
  const ok = ci === 0;
  state.scenario.picks.push({ ok, fb: L(choice.fbFr, choice.fbEn) });
  state.scenario.step++;
  // Rerendu partiel de la boîte scénario, avec le feedback de l'étape.
  const box = document.getElementById("scenarioBox");
  if (box) {
    box.innerHTML = `<div class="feedback ${ok ? "good" : "warn"}">${ok ? "✔️" : "⚠️"} ${esc(L(choice.fbFr, choice.fbEn))}</div>
      ${renderScenarioBox(tr)}`;
  }
}
function restartScenario() {
  state.scenario = { step: 0, picks: [] };
  const tr = tradeById(state.currentTradeId);
  const box = document.getElementById("scenarioBox");
  if (box) box.innerHTML = renderScenarioBox(tr);
}

/* ---------------- Écran 5 : Comparer ---------------- */
function openCompare() {
  state.screen = "compare";
  if (!state.compare.length && state.ranked.length >= 2) {
    state.compare = [state.ranked[0].trade.id, state.ranked[1].trade.id];
  }
  render();
}
function toggleCompare(id) {
  const idx = state.compare.indexOf(id);
  if (idx >= 0) state.compare.splice(idx, 1);
  else if (state.compare.length < 2) state.compare.push(id);
  else state.compare = [state.compare[1], id]; // remplace le plus ancien
  render();
}
function renderCompare() {
  const chosen = state.compare.map(tradeById).filter(Boolean);
  root.innerHTML = `
  <div class="screen compare">
    <div class="topbar">
      <button class="link" onclick="backToResults()">← ${esc(t("back"))}</button>
      <button class="link" onclick="toggleLang()">${esc(t("switchLang"))}</button>
    </div>
    <h2 class="screen-title">⚖️ ${esc(t("compareTitle"))}</h2>
    <p class="intro small">${esc(t("chooseTwo"))}</p>
    <div class="chip-row">
      ${TRADES.map(tr => `
        <button class="chip ${state.compare.includes(tr.id) ? "on" : ""}" onclick="toggleCompare('${tr.id}')">
          ${tr.emoji} ${esc(tradeName(tr))}
        </button>`).join("")}
    </div>
    ${chosen.length === 2 ? `
    <div class="cmp-grid">
      <div class="cmp-col">
        <div class="cmp-emoji">${chosen[0].emoji}</div>
        <div class="cmp-name">${esc(tradeName(chosen[0]))}</div>
        <div class="cmp-code">${esc(chosen[0].code)}</div>
      </div>
      <div class="cmp-col">
        <div class="cmp-emoji">${chosen[1].emoji}</div>
        <div class="cmp-name">${esc(tradeName(chosen[1]))}</div>
        <div class="cmp-code">${esc(chosen[1].code)}</div>
      </div>

      <div class="cmp-row-lbl">💵 ${esc(t("salary"))}</div>
      <div class="cmp-cell">${salaryText(chosen[0])}</div>
      <div class="cmp-cell">${salaryText(chosen[1])}</div>

      <div class="cmp-row-lbl">📈 ${esc(t("inDemand"))}</div>
      <div class="cmp-cell">${demandText(chosen[0])}</div>
      <div class="cmp-cell">${demandText(chosen[1])}</div>

      <div class="cmp-row-lbl">🧭 ${esc(t("dailyLabel"))}</div>
      <div class="cmp-cell small">${esc(L(chosen[0].whatFr, chosen[0].whatEn))}</div>
      <div class="cmp-cell small">${esc(L(chosen[1].whatFr, chosen[1].whatEn))}</div>
    </div>
    <div class="cmp-actions">
      <button class="ghost small" onclick="openTrade('${chosen[0].id}')">${chosen[0].emoji} ${esc(tradeName(chosen[0]))} →</button>
      <button class="ghost small" onclick="openTrade('${chosen[1].id}')">${chosen[1].emoji} ${esc(tradeName(chosen[1]))} →</button>
    </div>` : `<p class="hint">${esc(t("chooseTwo"))} (${chosen.length}/2)</p>`}
  </div>`;
}

/* ---------------- Routeur ---------------- */
function render() {
  document.documentElement.lang = state.lang;
  switch (state.screen) {
    case "home": return renderHome();
    case "quiz": return renderQuiz();
    case "results": return renderResults();
    case "trade": return renderTrade();
    case "compare": return renderCompare();
    default: return renderHome();
  }
}

window.addEventListener("online", () => {
  // À la reconnexion, on pourrait rejouer les événements locaux vers la RPC
  // quand elle existera. TODO Supabase : file d'attente d'événements.
});

render();
