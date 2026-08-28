-- =====================================================================
--  Career Explorer — Analytique anonyme (à exécuter dans Supabase)
--  Projet partagé : gejmaxobebsamvfkkpoj  (SQL Editor → New query → Run)
--  Crée : 1 table d'événements + 1 fonction RPC appelée par l'app.
--  Aucune donnée personnelle : seulement un identifiant d'appareil
--  anonyme (ce-...), le type d'événement, la langue et l'horodatage.
-- =====================================================================

-- 1) Table des événements ------------------------------------------------
create table if not exists public.careerexplorer_evenements (
  id       bigint generated always as identity primary key,
  eleve    text        not null,                       -- id d'appareil anonyme (ce-...)
  event    text        not null,                       -- quiz_started | quiz_completed | trade_viewed
  props    jsonb       not null default '{}'::jsonb,    -- ex. {"top":"charpenterie","topPct":87}
  lang     text,                                        -- fr | en
  ts       timestamptz not null default now(),          -- horodatage envoyé par l'app
  cree_le  timestamptz not null default now()           -- horodatage serveur (fiable)
);

create index if not exists idx_ce_ev_event on public.careerexplorer_evenements (event);
create index if not exists idx_ce_ev_ts    on public.careerexplorer_evenements (ts);
create index if not exists idx_ce_ev_eleve on public.careerexplorer_evenements (eleve);

-- 2) RLS : aucun accès direct. Tout passe par la RPC (security definer) ---
alter table public.careerexplorer_evenements enable row level security;
-- (Aucune policy volontairement : la clé « publishable » ne peut donc ni
--  lire ni écrire la table directement. Seule la fonction ci-dessous écrit.)

-- 3) RPC appelée par l'app (avec la clé publishable = rôle anon) ----------
create or replace function public.enregistrer_evenement(
  p_eleve text,
  p_event text,
  p_props jsonb        default '{}'::jsonb,
  p_lang  text         default null,
  p_ts    timestamptz  default now()
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Garde-fous simples anti-abus / anti-bruit.
  if p_event is null or length(p_event) > 64 then
    return;
  end if;
  insert into public.careerexplorer_evenements (eleve, event, props, lang, ts)
  values (
    left(coalesce(p_eleve, 'anon'), 128),
    p_event,
    coalesce(p_props, '{}'::jsonb),
    left(p_lang, 8),
    coalesce(p_ts, now())
  );
end;
$$;

-- Autoriser l'appel par les rôles anonyme et authentifié (clé publishable = anon)
grant execute on function public.enregistrer_evenement(text, text, jsonb, text, timestamptz)
  to anon, authenticated;

-- =====================================================================
--  4) VUES pratiques pour lire les résultats (facultatif mais utile)
-- =====================================================================

-- Entonnoir : combien commencent vs terminent le quiz (par jour).
create or replace view public.careerexplorer_entonnoir as
select
  date_trunc('day', ts)                                             as jour,
  count(*) filter (where event = 'quiz_started')                    as quiz_commences,
  count(*) filter (where event = 'quiz_completed')                  as quiz_termines,
  count(distinct eleve) filter (where event = 'quiz_started')       as eleves_uniques,
  round(
    100.0 * count(*) filter (where event = 'quiz_completed')
    / nullif(count(*) filter (where event = 'quiz_started'), 0), 1
  )                                                                  as taux_completion_pct
from public.careerexplorer_evenements
group by 1
order by 1 desc;

-- Métiers les plus consultés.
create or replace view public.careerexplorer_metiers_populaires as
select
  props->>'trade'          as metier,
  count(*)                 as vues,
  count(distinct eleve)    as eleves_uniques
from public.careerexplorer_evenements
where event = 'trade_viewed' and props ? 'trade'
group by 1
order by 2 desc;

-- Les vues ne doivent PAS être lisibles avec la clé publique (anon) : l'analytique
-- se consulte ici (SQL Editor) ou avec la clé secrète, jamais côté client.
revoke select on public.careerexplorer_entonnoir           from anon, authenticated;
revoke select on public.careerexplorer_metiers_populaires  from anon, authenticated;

-- =====================================================================
--  Pour tester après exécution (doit renvoyer 200, insère 1 ligne test) :
--   select public.enregistrer_evenement('ce-test','quiz_started','{}'::jsonb,'fr', now());
--   select * from public.careerexplorer_evenements order by id desc limit 5;
-- =====================================================================
