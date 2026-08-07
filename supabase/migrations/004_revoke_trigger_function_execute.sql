-- ============================================================
-- 004 — Hygiène : sortir les fonctions de trigger de l'API REST
-- ============================================================
-- Signalé par le linter Supabase : PostgREST expose toute fonction du schéma
-- public en /rest/v1/rpc/. Les fonctions de trigger n'ont pas à l'être.
-- Révoquer EXECUTE ne casse pas les triggers : Postgres ne vérifie pas ce
-- droit lors du déclenchement (vérifié en production, 160 lignes réindexées).

REVOKE EXECUTE ON FUNCTION public.protect_role_change()            FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_verification_from_votes() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cards_refresh_search_text()      FROM anon, authenticated;

-- approve_contribution / reject_contribution restent appelables à dessein :
-- elles vérifient is_admin() en interne et renvoient 'insufficient_privilege'
-- à tout appelant non conservateur.
