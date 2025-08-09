const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertEnv(name, value) {
  if (!value) {
    throw new Error(`[supabase.js] Missing required env ${name}. Set it in ai/.env`);
  }
}

assertEnv('SUPABASE_URL', SUPABASE_URL);
assertEnv('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY);

// Single server-side client using service role key (RLS disabled scenario)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Alias: expose as both supabase and supabaseAdmin for existing imports
const supabase = supabaseAdmin;

module.exports = { supabase, supabaseAdmin };
