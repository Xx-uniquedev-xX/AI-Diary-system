// This file creates a "client" that helps our AI system talk to Supabase database
// Based on the aromabless project's proven integration pattern (adapted for CommonJS)

// Import the createClient function from Supabase library
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Uses your existing .env file

// Get our database URL and API key from the .env.local file
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create the regular client for public operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Create the admin client with service role key (bypasses RLS for AI operations)
// This is needed for the AI to automatically store memories across users
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Export using CommonJS pattern
module.exports = {
  supabase,
  supabaseAdmin
};
