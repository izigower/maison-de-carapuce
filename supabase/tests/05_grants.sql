-- Reproduit les droits que Supabase accorde par defaut aux roles API.
GRANT USAGE ON SCHEMA public, extensions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
