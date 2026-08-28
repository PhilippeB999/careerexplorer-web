/* =====================================================================
   Career Explorer — DONNÉES DE CONTENU
   ---------------------------------------------------------------------
   ⚠️ CONTENU PROVISOIRE — À VALIDER.
   - Descriptions et mises en situation : rédigées de bonne foi, plausibles,
     mais NON validées par un conseiller pédagogique. À relire par Eastern Shores.
   - Durées de programme : marquées « à valider ».
   - Salaires : RÉELS. Champ `hourly` = salaire MÉDIAN horaire du Guichet-Emplois,
     région Gaspésie–Îles-de-la-Madeleine (maj 2026-08), sauf « navale » = niveau
     Québec (repli, pas de donnée régionale). `low`/`high` = fourchette si connue.
   - Demande / perspectives : RÉELLES. `demandLevel` mappé sur les perspectives
     Guichet-Emplois (1=limitées, 2=modérées, 3=bonnes), même région/date.
     ⚠️ « toilettage » : salaire régional mais perspectives au niveau Québec.
     ⚠️ « navale » : salaire ET perspectives au niveau Québec (repli).
   Aucun secret ici. Contenu statique, chargé avant app.js.
   ===================================================================== */

/* ---- Dimensions d'intérêt utilisées pour le jumelage ----
   Chaque métier est « tagué » avec un poids 0–3 par dimension.
   Le quiz mesure l'affinité de l'élève pour ces mêmes dimensions. */
const DIMENSIONS = {
  manuel:    { fr: "Travail manuel",         en: "Hands-on work",        emoji: "🔧" },
  aider:     { fr: "Aider les gens",         en: "Helping people",       emoji: "🤝" },
  technique: { fr: "Technique / informatique", en: "Tech / computers",   emoji: "💻" },
  creatif:   { fr: "Créativité",             en: "Creativity",           emoji: "🎨" },
  pleinair:  { fr: "Plein air / mouvement",  en: "Outdoors / active",    emoji: "🌲" },
  precision: { fr: "Précision / rigueur",    en: "Precision / rigour",   emoji: "🎯" },
  mecanique: { fr: "Mécanique / machines",   en: "Machines / mechanics", emoji: "⚙️" },
  client:    { fr: "Relation / service",     en: "People & service",     emoji: "💬" }
};

/* ---- Quiz d'intérêts ----
   12 énoncés. L'élève répond sur une échelle 0 (Pas moi) → 4 (Tout à fait moi).
   Chaque énoncé ajoute (réponse × poids) aux dimensions ciblées. */
const QUIZ = [
  { id: "q1",  fr: "J'aime réparer, assembler ou bâtir des choses avec mes mains.",
               en: "I like fixing, assembling or building things with my hands.",
               dims: { manuel: 3, mecanique: 1 } },
  { id: "q2",  fr: "Prendre soin des autres et les aider me rend fier(e).",
               en: "Taking care of others and helping them makes me proud.",
               dims: { aider: 3, client: 1 } },
  { id: "q3",  fr: "Je suis à l'aise avec les ordinateurs et la technologie.",
               en: "I'm comfortable with computers and technology.",
               dims: { technique: 3 } },
  { id: "q4",  fr: "J'aime imaginer, dessiner ou créer quelque chose d'original.",
               en: "I like imagining, drawing or creating something original.",
               dims: { creatif: 3 } },
  { id: "q5",  fr: "Je préfère bouger et travailler dehors plutôt qu'assis(e) à un bureau.",
               en: "I'd rather move and work outdoors than sit at a desk.",
               dims: { pleinair: 3, manuel: 1 } },
  { id: "q6",  fr: "Je fais attention aux détails et j'aime que tout soit exact.",
               en: "I pay attention to detail and like things to be exact.",
               dims: { precision: 3 } },
  { id: "q7",  fr: "Les moteurs, les machines et les équipements me fascinent.",
               en: "Engines, machines and equipment fascinate me.",
               dims: { mecanique: 3, technique: 1 } },
  { id: "q8",  fr: "J'aime parler avec les gens et leur rendre service.",
               en: "I like talking with people and helping them out.",
               dims: { client: 3, aider: 1 } },
  { id: "q9",  fr: "Conduire un gros véhicule ou de la machinerie m'attire.",
               en: "Driving a big vehicle or machinery appeals to me.",
               dims: { mecanique: 2, pleinair: 2 } },
  { id: "q10", fr: "J'aime organiser, classer des chiffres ou de l'information.",
               en: "I like organizing and sorting numbers or information.",
               dims: { precision: 2, technique: 2 } },
  { id: "q11", fr: "Travailler avec des enfants ou des animaux me plairait.",
               en: "Working with children or animals would suit me.",
               dims: { aider: 2, creatif: 1, client: 1 } },
  { id: "q12", fr: "J'aime suivre des étapes précises pour obtenir un résultat sûr.",
               en: "I like following precise steps to get a safe, reliable result.",
               dims: { precision: 2, manuel: 1, technique: 1 } }
];

/* Échelle de réponse (0–4), bilingue. */
const SCALE = [
  { v: 0, fr: "Pas moi",        en: "Not me" },
  { v: 1, fr: "Un peu",         en: "A little" },
  { v: 2, fr: "Moyen",          en: "Neutral" },
  { v: 3, fr: "Pas mal",        en: "Quite a bit" },
  { v: 4, fr: "Tout à fait moi", en: "Totally me" }
];

/* ---- Les 12 métiers d'Eastern Shores ----
   dims : poids 0–3 par dimension → sert au jumelage.
   salary.annual / demand.demandLevel = null tant que non validés (placeholder). */
const TRADES = [
  {
    id: "comptabilite", code: "DEP 5231", codeEn: "DVS 5731", emoji: "🧮",
    nameFr: "Comptabilité", nameEn: "Accounting",
    questUrl: "https://compta.questedu.ca",
    dims: { precision: 3, technique: 2, client: 1 },
    whatFr: "Tenir les comptes d'une entreprise : factures, paies, taxes, états financiers. Un travail de bureau précis où les chiffres doivent balancer au cent près.",
    whatEn: "Keeping a company's books: invoices, payroll, taxes, financial statements. Precise office work where the numbers must balance to the cent.",
    programFr: "DEP en Comptabilité. Durée à valider (~1 an). À quoi s'attendre : logiciels comptables, tenue de livres, paie, taxes (TPS/TVQ) et beaucoup de rigueur.",
    programEn: "Accounting DVS. Duration to be confirmed (~1 year). Expect: accounting software, bookkeeping, payroll, sales taxes and a lot of rigour.",
    salary: { hourly: 28.00, region: "Gaspésie–Îles-de-la-Madeleine", updated: "2026-08" },
    demand: { demandLevel: 3 },
    scenario: {
      titleFr: "Une facture ne balance pas", titleEn: "An invoice doesn't add up",
      steps: [
        { promptFr: "Le total du client ne correspond pas au tien. Que fais-tu d'abord ?",
          promptEn: "The client's total doesn't match yours. What do you do first?",
          choices: [
            { fr: "Vérifier chaque ligne du calcul", en: "Check each line of the calculation",
              fbFr: "Bon réflexe : en comptabilité, on remonte la piste chiffre par chiffre.", fbEn: "Good instinct: in accounting you trace it figure by figure." },
            { fr: "Changer le total pour que ça balance", en: "Change the total so it balances",
              fbFr: "Risqué : falsifier un chiffre cache l'erreur au lieu de la corriger.", fbEn: "Risky: fudging a figure hides the error instead of fixing it." } ] },
        { promptFr: "Tu trouves une taxe mal appliquée. Ensuite ?",
          promptEn: "You find a tax applied incorrectly. Next?",
          choices: [
            { fr: "Corriger et documenter la correction", en: "Correct it and document the fix",
              fbFr: "Exactement : la trace écrite protège tout le monde.", fbEn: "Exactly: the paper trail protects everyone." },
            { fr: "Laisser passer, c'est un petit montant", en: "Let it slide, it's small",
              fbFr: "Même petit, un écart de taxe peut coûter cher en audit.", fbEn: "Even small, a tax error can be costly at audit." } ] },
        { promptFr: "Le client rappelle, inquiet. Ton ton ?",
          promptEn: "The client calls back, worried. Your tone?",
          choices: [
            { fr: "Calme, j'explique la correction", en: "Calm, I explain the fix",
              fbFr: "La confiance se gagne avec de la clarté.", fbEn: "Trust is built through clarity." } ] }
      ]
    }
  },
  {
    id: "charpenterie", code: "DEP 5319", codeEn: "DVS 5819", emoji: "🔨",
    nameFr: "Charpenterie-menuiserie", nameEn: "Carpentry",
    questUrl: "https://charpenterie.questedu.ca",
    dims: { manuel: 3, precision: 2, pleinair: 2, creatif: 1 },
    whatFr: "Construire des structures de bois : charpentes, murs, escaliers, coffrages. On lit des plans, on mesure, on coupe, on assemble sur les chantiers.",
    whatEn: "Building wood structures: framing, walls, stairs, formwork. You read plans, measure, cut and assemble on job sites.",
    programFr: "DEP en Charpenterie-menuiserie. Durée à valider (~1 an et demi). À quoi s'attendre : lecture de plans, outils électriques, sécurité de chantier, travail d'équipe dehors.",
    programEn: "Carpentry DVS. Duration to be confirmed (~1.5 years). Expect: reading plans, power tools, site safety, outdoor teamwork.",
    salary: { hourly: 36.84, region: "Gaspésie–Îles-de-la-Madeleine", updated: "2026-08" },
    demand: { demandLevel: 2 },
    scenario: {
      titleFr: "Un mur à monter", titleEn: "Framing a wall",
      steps: [
        { promptFr: "Ton plan indique 8 pieds. Avant de couper, tu…",
          promptEn: "Your plan says 8 feet. Before cutting, you…",
          choices: [
            { fr: "Mesure deux fois, coupe une fois", en: "Measure twice, cut once",
              fbFr: "La règle d'or du métier. Le bois coupé ne repousse pas.", fbEn: "The trade's golden rule. Cut wood doesn't grow back." },
            { fr: "Coupe vite pour gagner du temps", en: "Cut fast to save time",
              fbFr: "Une erreur de mesure = du bois gaspillé et du temps perdu.", fbEn: "A mis-measure means wasted wood and lost time." } ] },
        { promptFr: "Il commence à pleuvoir sur le chantier. Que fais-tu du bois ?",
          promptEn: "Rain starts on site. What about the lumber?",
          choices: [
            { fr: "Le protéger sous une bâche", en: "Cover it with a tarp",
              fbFr: "Bien vu : le bois gonflé fausse tous les assemblages.", fbEn: "Smart: swollen wood throws off every joint." },
            { fr: "Continuer, ce n'est pas grave", en: "Keep going, no big deal",
              fbFr: "Le bois mouillé peut gauchir et compromettre la structure.", fbEn: "Wet wood can warp and weaken the structure." } ] },
        { promptFr: "Le mur est monté mais penche de 2°. Ta décision ?",
          promptEn: "The wall is up but leans 2°. Your call?",
          choices: [
            { fr: "Le redresser à l'aplomb", en: "Bring it back to plumb",
              fbFr: "Un mur droit, c'est la base de tout le reste.", fbEn: "A plumb wall is the base for everything else." } ] }
      ]
    }
  },
  {
    id: "chantier", code: "DEP 5220", codeEn: "DVS 5720", emoji: "🚜",
    nameFr: "Conduite d'engins de chantier", nameEn: "Construction Equipment Operation",
    questUrl: "https://chantier.questedu.ca",
    dims: { mecanique: 3, pleinair: 3, manuel: 1, precision: 1 },
    whatFr: "Opérer de la grosse machinerie : pelles, chargeuses, bouteurs. On déplace de la terre, on creuse, on nivelle sur les chantiers, souvent dehors et par tous les temps.",
    whatEn: "Operating heavy machinery: excavators, loaders, dozers. You move earth, dig and grade on job sites, often outdoors in all weather.",
    programFr: "DEP en Conduite d'engins de chantier. Durée à valider (~1 an). À quoi s'attendre : maniement d'engins, sécurité, entretien de base, longues journées en plein air.",
    programEn: "Construction Equipment Operation DVS. Duration to be confirmed (~1 year). Expect: operating machines, safety, basic maintenance, long days outdoors.",
    salary: { hourly: 30.00, region: "Gaspésie–Îles-de-la-Madeleine", updated: "2026-08" },
    demand: { demandLevel: 1 },
    scenario: {
      titleFr: "Une tranchée à creuser", titleEn: "Digging a trench",
      steps: [
        { promptFr: "Avant de creuser, la première étape ?",
          promptEn: "Before digging, the first step?",
          choices: [
            { fr: "Vérifier où sont les câbles souterrains", en: "Check where underground lines are",
              fbFr: "Vital : couper un câble électrique ou de gaz peut être mortel.", fbEn: "Vital: cutting a power or gas line can be deadly." },
            { fr: "Commencer, on verra bien", en: "Just start and see",
              fbFr: "Jamais. La localisation des services est obligatoire.", fbEn: "Never. Locating utilities first is mandatory." } ] },
        { promptFr: "Le sol est mou après la pluie. La pelle risque de s'enliser.",
          promptEn: "The ground is soft after rain. The excavator could sink.",
          choices: [
            { fr: "Installer des plaques de roulage", en: "Lay down ground mats",
              fbFr: "Bon jugement : la stabilité de la machine passe avant tout.", fbEn: "Good judgment: machine stability comes first." },
            { fr: "Foncer avant que ça empire", en: "Push through before it worsens",
              fbFr: "Une machine enlisée coûte des heures et peut basculer.", fbEn: "A stuck machine costs hours and can tip." } ] },
        { promptFr: "Fin de journée. Avant de quitter l'engin ?",
          promptEn: "End of day. Before leaving the machine?",
          choices: [
            { fr: "Inspection et rapport d'entretien", en: "Inspection and maintenance log",
              fbFr: "L'entretien quotidien évite les pannes coûteuses.", fbEn: "Daily upkeep prevents costly breakdowns." } ] }
      ]
    }
  },
  {
    id: "sasi", code: "DEP 5325", codeEn: "DVS 5825", emoji: "🩺",
    nameFr: "Santé, assistance et soins infirmiers", nameEn: "Health, Assistance & Nursing",
    questUrl: "https://sasi.questedu.ca",
    dims: { aider: 3, precision: 2, client: 2 },
    whatFr: "Donner des soins aux patients sous la supervision d'infirmières : signes vitaux, hygiène, médicaments, réconfort. Un métier humain, en hôpital ou en CHSLD.",
    whatEn: "Providing patient care under nurses' supervision: vital signs, hygiene, medication, comfort. A caring role in hospitals or long-term care.",
    programFr: "DEP en Santé, assistance et soins infirmiers. Durée à valider (~1 an et demi). À quoi s'attendre : anatomie, soins, stages en milieu clinique, empathie et rigueur.",
    programEn: "Health, Assistance & Nursing DVS. Duration to be confirmed (~1.5 years). Expect: anatomy, care techniques, clinical placements, empathy and rigour.",
    salary: { hourly: 29.00, low: 21.00, high: 32.32, region: "Gaspésie–Îles-de-la-Madeleine", updated: "2026-08" },
    demand: { demandLevel: 3 },
    scenario: {
      titleFr: "Un patient anxieux", titleEn: "An anxious patient",
      steps: [
        { promptFr: "Un patient a peur avant une prise de sang. Tu…",
          promptEn: "A patient is scared before a blood draw. You…",
          choices: [
            { fr: "L'écoutes et le rassures calmement", en: "Listen and reassure calmly",
              fbFr: "Le contact humain fait partie du soin autant que le geste technique.", fbEn: "Human contact is as much a part of care as the technical act." },
            { fr: "Fais vite pour en finir", en: "Rush to get it over with",
              fbFr: "Précipiter augmente le stress et le risque d'erreur.", fbEn: "Rushing raises stress and the risk of error." } ] },
        { promptFr: "Tu remarques un signe vital anormal. Que fais-tu ?",
          promptEn: "You notice an abnormal vital sign. What do you do?",
          choices: [
            { fr: "Le noter et prévenir l'infirmière", en: "Record it and alert the nurse",
              fbFr: "Exact : tu observes et rapportes, l'infirmière décide.", fbEn: "Right: you observe and report, the nurse decides." },
            { fr: "Attendre de voir si ça passe", en: "Wait and see if it passes",
              fbFr: "Un signe anormal se signale tout de suite, sans exception.", fbEn: "An abnormal sign is reported at once, no exception." } ] },
        { promptFr: "La famille te pose une question médicale précise. Ta réponse ?",
          promptEn: "The family asks a precise medical question. Your answer?",
          choices: [
            { fr: "Rediriger vers l'infirmière ou le médecin", en: "Redirect to the nurse or doctor",
              fbFr: "Rester dans son champ de compétence protège le patient.", fbEn: "Staying within your scope protects the patient." } ] }
      ]
    }
  },
  {
    id: "pab", code: "DEP 5358", codeEn: "DVS 5858", emoji: "🧑‍🦽",
    nameFr: "Assistance à la personne", nameEn: "Support for Assistive Services",
    questUrl: "https://pab.questedu.ca",
    dims: { aider: 3, client: 2, precision: 1 },
    whatFr: "Accompagner les personnes en perte d'autonomie au quotidien : aide aux repas, à l'hygiène, aux déplacements, présence rassurante. Un métier de cœur et de patience.",
    whatEn: "Supporting people who've lost autonomy day to day: help with meals, hygiene, mobility and a reassuring presence. A job of heart and patience.",
    programFr: "DEP en Assistance à la personne (à domicile / en établissement). Durée à valider (~1 an). À quoi s'attendre : soins de base, déplacements sécuritaires, écoute, stages.",
    programEn: "Support for Assistive Services DVS (home / facility). Duration to be confirmed (~1 year). Expect: basic care, safe transfers, active listening, placements.",
    salary: { hourly: 25.46, region: "Gaspésie–Îles-de-la-Madeleine", updated: "2026-08" },
    demand: { demandLevel: 3 },
    scenario: {
      titleFr: "Aider un déplacement", titleEn: "Assisting a transfer",
      steps: [
        { promptFr: "Une personne veut se lever du lit mais est fragile. Tu…",
          promptEn: "A person wants to get out of bed but is frail. You…",
          choices: [
            { fr: "Utilises la bonne technique de transfert", en: "Use the proper transfer technique",
              fbFr: "Tu protèges la personne ET ton propre dos.", fbEn: "You protect the person AND your own back." },
            { fr: "La tires par le bras rapidement", en: "Pull them up quickly by the arm",
              fbFr: "Dangereux : risque de chute et de blessure pour les deux.", fbEn: "Dangerous: risk of a fall and injury for both." } ] },
        { promptFr: "La personne refuse son bain aujourd'hui. Ta réaction ?",
          promptEn: "The person refuses their bath today. Your reaction?",
          choices: [
            { fr: "Respecter, proposer plus tard avec douceur", en: "Respect it, gently offer again later",
              fbFr: "La dignité et le choix de la personne comptent.", fbEn: "The person's dignity and choice matter." },
            { fr: "Insister, c'est pour son bien", en: "Insist, it's for their own good",
              fbFr: "Forcer brise le lien de confiance et peut être un abus.", fbEn: "Forcing breaks trust and can be abusive." } ] },
        { promptFr: "Tu remarques un bleu inexpliqué. Que fais-tu ?",
          promptEn: "You notice an unexplained bruise. What do you do?",
          choices: [
            { fr: "Le signaler et le documenter", en: "Report and document it",
              fbFr: "Observer et rapporter fait partie de ta responsabilité.", fbEn: "Observing and reporting is part of your duty." } ] }
      ]
    }
  },
  {
    id: "secretariat", code: "DEP 5357", codeEn: "DVS 5857", emoji: "🗂️",
    nameFr: "Secrétariat", nameEn: "Secretarial Studies",
    questUrl: "https://secretariat.questedu.ca",
    dims: { technique: 2, precision: 2, client: 2, creatif: 1 },
    whatFr: "Faire tourner un bureau : rédaction, agenda, courriels, classement, accueil. On jongle avec la suite bureautique et le contact avec les gens.",
    whatEn: "Keeping an office running: writing, scheduling, email, filing, reception. You juggle office software and contact with people.",
    programFr: "DEP en Secrétariat. Durée à valider (~1 an). À quoi s'attendre : traitement de texte, français écrit, gestion de l'agenda, service à la clientèle.",
    programEn: "Secretarial Studies DVS. Duration to be confirmed (~1 year). Expect: word processing, written skills, calendar management, customer service.",
    salary: { hourly: 25.00, low: 18.50, high: 32.00, region: "Gaspésie–Îles-de-la-Madeleine", updated: "2026-08" },
    demand: { demandLevel: 2 },
    scenario: {
      titleFr: "Une matinée chargée", titleEn: "A busy morning",
      steps: [
        { promptFr: "Trois demandes arrivent en même temps. Tu…",
          promptEn: "Three requests land at once. You…",
          choices: [
            { fr: "Priorises l'urgent et notes le reste", en: "Prioritize the urgent, note the rest",
              fbFr: "L'organisation, c'est le cœur du métier.", fbEn: "Organization is the heart of the job." },
            { fr: "Réponds à tout en même temps", en: "Handle everything at once",
              fbFr: "Se disperser mène aux oublis et aux erreurs.", fbEn: "Spreading thin leads to mistakes and things forgotten." } ] },
        { promptFr: "Une lettre importante part chez un client. Avant l'envoi ?",
          promptEn: "An important letter is going to a client. Before sending?",
          choices: [
            { fr: "Relire l'orthographe et le ton", en: "Proofread spelling and tone",
              fbFr: "Une lettre soignée, c'est l'image de l'entreprise.", fbEn: "A polished letter is the company's image." },
            { fr: "Envoyer vite, ça ira", en: "Send it fast, it's fine",
              fbFr: "Une faute chez un client peut coûter cher en crédibilité.", fbEn: "A typo to a client can cost credibility." } ] },
        { promptFr: "Un visiteur impatient au comptoir. Ton attitude ?",
          promptEn: "An impatient visitor at the desk. Your attitude?",
          choices: [
            { fr: "Courtoise et efficace", en: "Courteous and efficient",
              fbFr: "L'accueil donne la première impression de tout le bureau.", fbEn: "Reception is the whole office's first impression." } ] }
      ]
    }
  },
  {
    id: "soutieninfo", code: "DEP 5229", codeEn: "DVS 5729", emoji: "💻",
    nameFr: "Soutien informatique", nameEn: "Information Technology Support",
    questUrl: null,
    dims: { technique: 3, precision: 2, client: 2, mecanique: 1 },
    whatFr: "Dépanner les ordinateurs et les réseaux : installer, configurer, résoudre les pannes, aider les usagers. Moitié technique, moitié service à la clientèle.",
    whatEn: "Troubleshooting computers and networks: install, configure, fix issues, help users. Half technical, half customer service.",
    programFr: "DEP en Soutien informatique. Durée à valider (~1 an et demi). À quoi s'attendre : matériel, systèmes d'exploitation, réseaux, dépannage et patience avec les usagers.",
    programEn: "IT Support DVS. Duration to be confirmed (~1.5 years). Expect: hardware, operating systems, networks, troubleshooting and patience with users.",
    salary: { hourly: 32.98, region: "Gaspésie–Îles-de-la-Madeleine", updated: "2026-08" },
    demand: { demandLevel: 1 },
    scenario: {
      titleFr: "Un poste qui ne démarre plus", titleEn: "A PC that won't boot",
      steps: [
        { promptFr: "Un usager appelle, paniqué. Ta première étape ?",
          promptEn: "A user calls, panicking. Your first step?",
          choices: [
            { fr: "Poser des questions pour cerner le problème", en: "Ask questions to pin down the problem",
              fbFr: "Diagnostiquer avant d'agir, c'est 80 % du dépannage.", fbEn: "Diagnosing before acting is 80% of the fix." },
            { fr: "Tout réinstaller par défaut", en: "Just reinstall everything",
              fbFr: "Écraser sans diagnostic peut détruire des données.", fbEn: "Wiping without a diagnosis can destroy data." } ] },
        { promptFr: "C'est un câble débranché. Ta réaction ?",
          promptEn: "It's an unplugged cable. Your reaction?",
          choices: [
            { fr: "Le rebrancher et rester poli", en: "Plug it back in and stay polite",
              fbFr: "Jamais faire sentir l'usager idiot : le service compte.", fbEn: "Never make the user feel foolish: service matters." },
            { fr: "Se moquer de l'usager", en: "Mock the user",
              fbFr: "Le mépris détruit la relation de confiance.", fbEn: "Contempt destroys the trust relationship." } ] },
        { promptFr: "Le problème pourrait revenir. Que fais-tu ?",
          promptEn: "The problem could recur. What do you do?",
          choices: [
            { fr: "Documenter la solution au registre", en: "Log the solution in the ticket system",
              fbFr: "La documentation aide toute l'équipe la prochaine fois.", fbEn: "Documentation helps the whole team next time." } ] }
      ]
    }
  },
  {
    id: "camion", code: "DEP 5291", codeEn: "DVS 5791", emoji: "🚚",
    nameFr: "Transport par camion", nameEn: "Trucking",
    questUrl: null,
    dims: { mecanique: 3, pleinair: 2, precision: 2 },
    whatFr: "Conduire des camions lourds sur de longues distances : livraisons, chargement, respect des horaires et de la sécurité routière. Beaucoup d'autonomie sur la route.",
    whatEn: "Driving heavy trucks over long distances: deliveries, loading, meeting schedules and road safety. A lot of autonomy on the road.",
    programFr: "DEP en Transport par camion. Durée à valider (~6 mois). À quoi s'attendre : permis classe 1, manœuvres, inspection du véhicule, règles de la route, longues heures.",
    programEn: "Trucking DVS. Duration to be confirmed (~6 months). Expect: class 1 licence, manoeuvres, vehicle inspection, road rules, long hours.",
    salary: { hourly: 26.00, region: "Gaspésie–Îles-de-la-Madeleine", updated: "2026-08" },
    demand: { demandLevel: 1 },
    scenario: {
      titleFr: "Avant le départ", titleEn: "Before departure",
      steps: [
        { promptFr: "Ta journée commence. Première chose avant de rouler ?",
          promptEn: "Your day starts. First thing before driving?",
          choices: [
            { fr: "Faire la ronde de sécurité du camion", en: "Do the truck's safety walk-around",
              fbFr: "Obligatoire : freins, pneus, feux. Ça sauve des vies.", fbEn: "Mandatory: brakes, tires, lights. It saves lives." },
            { fr: "Partir, tu es en retard", en: "Just leave, you're late",
              fbFr: "Un défaut non vu peut causer un accident grave.", fbEn: "An unseen defect can cause a serious crash." } ] },
        { promptFr: "Tu es fatigué après plusieurs heures. Ta décision ?",
          promptEn: "You're tired after several hours. Your decision?",
          choices: [
            { fr: "Respecter les pauses obligatoires", en: "Respect mandatory rest breaks",
              fbFr: "La fatigue au volant est aussi dangereuse que l'alcool.", fbEn: "Driving tired is as dangerous as driving drunk." },
            { fr: "Pousser pour livrer plus vite", en: "Push on to deliver faster",
              fbFr: "Dépasser les heures de conduite est illégal et risqué.", fbEn: "Exceeding driving hours is illegal and risky." } ] },
        { promptFr: "Verglas soudain sur l'autoroute. Comment réagir ?",
          promptEn: "Sudden black ice on the highway. How do you react?",
          choices: [
            { fr: "Ralentir en douceur, garder ses distances", en: "Slow gently, keep your distance",
              fbFr: "Sur un poids lourd, la douceur évite le dérapage.", fbEn: "On a heavy truck, smoothness prevents skidding." } ] }
      ]
    }
  },
  {
    id: "barbier", code: "AEP", codeEn: "STC", emoji: "💈",
    nameFr: "Barbier", nameEn: "Barbering",
    questUrl: null,
    dims: { creatif: 3, client: 3, precision: 2, manuel: 1 },
    whatFr: "Couper, tailler et styliser cheveux et barbes. Un métier créatif et social : chaque client repart avec un look, et souvent avec le sourire.",
    whatEn: "Cutting, trimming and styling hair and beards. A creative, social trade: every client leaves with a new look, and often a smile.",
    programFr: "AEP en Barbier. Durée à valider (quelques mois). À quoi s'attendre : techniques de coupe, taille de barbe, hygiène, service à la clientèle et sens artistique.",
    programEn: "Barbering AVS. Duration to be confirmed (a few months). Expect: cutting techniques, beard trimming, hygiene, customer service and an artistic eye.",
    salary: { hourly: 21.63, region: "Gaspésie–Îles-de-la-Madeleine", updated: "2026-08" },
    demand: { demandLevel: 3 },
    scenario: {
      titleFr: "Un nouveau client", titleEn: "A new client",
      steps: [
        { promptFr: "Un client s'assoit sans idée précise. Tu…",
          promptEn: "A client sits down with no clear idea. You…",
          choices: [
            { fr: "Poses des questions sur son style de vie", en: "Ask about their lifestyle",
              fbFr: "La bonne coupe s'adapte à la personne, pas l'inverse.", fbEn: "The right cut fits the person, not the reverse." },
            { fr: "Fais ta coupe préférée", en: "Do your favourite cut",
              fbFr: "Le client doit se reconnaître dans le résultat.", fbEn: "The client must recognize themselves in the result." } ] },
        { promptFr: "En pleine coupe, il change d'avis. Ta réaction ?",
          promptEn: "Mid-cut, they change their mind. Your reaction?",
          choices: [
            { fr: "S'adapter calmement", en: "Adapt calmly",
              fbFr: "La souplesse fait revenir les clients.", fbEn: "Flexibility brings clients back." },
            { fr: "Refuser, c'est trop tard", en: "Refuse, it's too late",
              fbFr: "Un client frustré ne reviendra pas.", fbEn: "A frustrated client won't return." } ] },
        { promptFr: "La coupe est finie. Dernière touche ?",
          promptEn: "The cut is done. Final touch?",
          choices: [
            { fr: "Montrer le résultat au miroir", en: "Show the result in the mirror",
              fbFr: "La validation du client, c'est ta signature.", fbEn: "The client's approval is your signature." } ] }
      ]
    }
  },
  {
    id: "toilettage", code: "AEP", codeEn: "STC", emoji: "🐩",
    nameFr: "Toilettage d'animaux", nameEn: "Pet Grooming",
    questUrl: null,
    dims: { creatif: 2, aider: 2, manuel: 2, precision: 2, client: 1 },
    whatFr: "Laver, tondre et soigner le pelage des animaux de compagnie. Il faut de la patience, de la douceur et un bon coup de ciseaux pour des chiens pas toujours coopératifs.",
    whatEn: "Washing, clipping and grooming pets' coats. It takes patience, gentleness and a steady hand with dogs that don't always cooperate.",
    programFr: "AEP en Toilettage d'animaux. Durée à valider (quelques mois). À quoi s'attendre : soins du pelage, manipulation sécuritaire, hygiène et lecture du comportement animal.",
    programEn: "Pet Grooming AVS. Duration to be confirmed (a few months). Expect: coat care, safe handling, hygiene and reading animal behaviour.",
    salary: { hourly: 18.57, low: 16.60, high: 25.00, region: "Gaspésie–Îles-de-la-Madeleine", updated: "2026-08" },
    demand: { demandLevel: 2 },
    scenario: {
      titleFr: "Un chien nerveux", titleEn: "A nervous dog",
      steps: [
        { promptFr: "Un chien tremble sur la table. Tu…",
          promptEn: "A dog trembles on the table. You…",
          choices: [
            { fr: "Le rassures avant de commencer", en: "Reassure it before starting",
              fbFr: "Un animal calme, c'est un toilettage sécuritaire.", fbEn: "A calm animal means safe grooming." },
            { fr: "Commences la tonte tout de suite", en: "Start clipping right away",
              fbFr: "Un chien stressé peut mordre ou se blesser.", fbEn: "A stressed dog may bite or hurt itself." } ] },
        { promptFr: "Tu trouves une rougeur sur la peau. Ta réaction ?",
          promptEn: "You find a red patch on the skin. Your reaction?",
          choices: [
            { fr: "Le signaler au propriétaire", en: "Point it out to the owner",
              fbFr: "Tu repères, tu informes ; le vétérinaire diagnostique.", fbEn: "You spot and inform; the vet diagnoses." },
            { fr: "Raser par-dessus sans rien dire", en: "Shave over it without a word",
              fbFr: "Ignorer un problème de peau peut l'aggraver.", fbEn: "Ignoring a skin issue can make it worse." } ] },
        { promptFr: "Le toilettage est fini. Avant de rendre l'animal ?",
          promptEn: "Grooming done. Before handing the pet back?",
          choices: [
            { fr: "Vérifier oreilles, griffes, propreté", en: "Check ears, nails, cleanliness",
              fbFr: "Le souci du détail fait ta réputation.", fbEn: "Attention to detail builds your reputation." } ] }
      ]
    }
  },
  {
    id: "sdg", code: "AEP", codeEn: "STC", emoji: "🧸",
    nameFr: "Éducation en service de garde", nameEn: "School Daycare Educator",
    questUrl: null,
    dims: { aider: 3, creatif: 2, client: 2, precision: 1 },
    whatFr: "Encadrer et animer des groupes d'enfants en milieu scolaire : jeux, devoirs, sécurité, développement. Un métier vivant qui demande énergie et bienveillance.",
    whatEn: "Guiding and leading groups of children in schools: games, homework, safety, development. A lively job needing energy and kindness.",
    programFr: "AEP en Éducation en service de garde en milieu scolaire. Durée à valider (quelques mois). À quoi s'attendre : animation, développement de l'enfant, sécurité, gestion de groupe.",
    programEn: "School Daycare Educator AVS. Duration to be confirmed (a few months). Expect: activity leading, child development, safety, group management.",
    salary: { hourly: 24.00, region: "Gaspésie–Îles-de-la-Madeleine", updated: "2026-08" },
    demand: { demandLevel: 2 },
    scenario: {
      titleFr: "La récréation", titleEn: "Recess time",
      steps: [
        { promptFr: "Deux enfants se disputent un jouet. Tu…",
          promptEn: "Two kids fight over a toy. You…",
          choices: [
            { fr: "Les aides à trouver une solution ensemble", en: "Help them find a solution together",
              fbFr: "Tu enseignes à régler les conflits, pas juste à séparer.", fbEn: "You teach conflict resolution, not just separation." },
            { fr: "Confisques le jouet et passes", en: "Confiscate the toy and move on",
              fbFr: "Punir sans expliquer n'apprend rien à l'enfant.", fbEn: "Punishing without explaining teaches nothing." } ] },
        { promptFr: "Un enfant tombe et pleure. Première chose ?",
          promptEn: "A child falls and cries. First thing?",
          choices: [
            { fr: "Le rassurer et vérifier s'il est blessé", en: "Reassure and check for injury",
              fbFr: "Sécurité et réconfort d'abord, toujours.", fbEn: "Safety and comfort first, always." },
            { fr: "Lui dire d'arrêter de pleurer", en: "Tell them to stop crying",
              fbFr: "Minimiser une peur brise le lien de confiance.", fbEn: "Dismissing a fear breaks trust." } ] },
        { promptFr: "Il reste 10 minutes. Comment occuper le groupe ?",
          promptEn: "10 minutes left. How to keep the group busy?",
          choices: [
            { fr: "Proposer un jeu calme et inclusif", en: "Offer a calm, inclusive game",
              fbFr: "Anticiper les transitions évite le chaos.", fbEn: "Planning transitions prevents chaos." } ] }
      ]
    }
  },
  {
    id: "navale", code: "AEP", codeEn: "STC", emoji: "⚓",
    nameFr: "Construction navale", nameEn: "Shipbuilding",
    questUrl: null,
    dims: { manuel: 3, mecanique: 2, precision: 2, pleinair: 1 },
    whatFr: "Assembler et réparer des coques et structures de bateaux : découpe du métal, soudure, montage. Un travail robuste, précis, souvent au bord de l'eau.",
    whatEn: "Assembling and repairing ship hulls and structures: metal cutting, welding, fitting. Rugged, precise work, often by the water.",
    programFr: "AEP en Construction navale. Durée à valider (quelques mois). À quoi s'attendre : lecture de plans, soudure, découpe, assemblage et sécurité en chantier naval.",
    programEn: "Shipbuilding AVS. Duration to be confirmed (a few months). Expect: reading plans, welding, cutting, fitting and shipyard safety.",
    salary: { hourly: 26.80, region: "Québec (province)", updated: "2026-08" },
    demand: { demandLevel: 1 },
    scenario: {
      titleFr: "Une soudure sur coque", titleEn: "A weld on the hull",
      steps: [
        { promptFr: "Avant de souder, ton équipement ?",
          promptEn: "Before welding, your gear?",
          choices: [
            { fr: "Masque, gants, ventilation vérifiés", en: "Mask, gloves, ventilation checked",
              fbFr: "La sécurité d'abord : arc et fumées ne pardonnent pas.", fbEn: "Safety first: arc and fumes are unforgiving." },
            { fr: "Souder vite sans protection", en: "Weld fast without protection",
              fbFr: "Brûlures et fumées toxiques : jamais sans équipement.", fbEn: "Burns and toxic fumes: never without gear." } ] },
        { promptFr: "Ta soudure a un défaut visible. Ta décision ?",
          promptEn: "Your weld has a visible flaw. Your decision?",
          choices: [
            { fr: "La reprendre proprement", en: "Redo it cleanly",
              fbFr: "Sur une coque, un défaut peut couler un bateau.", fbEn: "On a hull, a flaw can sink a ship." },
            { fr: "La laisser, ça devrait tenir", en: "Leave it, should hold",
              fbFr: "En construction navale, « devrait » ne suffit pas.", fbEn: "In shipbuilding, 'should' isn't good enough." } ] },
        { promptFr: "Le contrôle qualité passe. Ton attitude ?",
          promptEn: "Quality control comes by. Your attitude?",
          choices: [
            { fr: "Montrer son travail avec fierté", en: "Show your work with pride",
              fbFr: "Un travail vérifié, c'est un bateau qui flotte.", fbEn: "Verified work means a ship that floats." } ] }
      ]
    }
  }
];
