-- =============================================
-- PART 3: NO ROW LEVEL SECURITY (SERVER-SIDE ONLY)
-- =============================================
-- Run this third and final in Supabase SQL Editor (after part1 and part2)
-- RLS is DISABLED for all tables since everything is server-side

-- ============================================================================
-- DISABLE ROW LEVEL SECURITY FOR ALL TABLES
-- ============================================================================
-- Since everything is server-side, we don't need RLS complexity

ALTER TABLE usr_prof DISABLE ROW LEVEL SECURITY;
ALTER TABLE de_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE fb_heart_rate DISABLE ROW LEVEL SECURITY;
ALTER TABLE fb_sleep_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE fb_daily_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE memory_retrieval_log DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS FOR TESTING (NO RLS NEEDED)
-- ============================================================================

-- Function to test if vector extension is working
CREATE OR REPLACE FUNCTION test_vector_extension()
RETURNS TEXT AS $$
BEGIN
    -- Try to create a simple vector and return success message
    PERFORM '[1,2,3]'::vector(3);
    RETURN 'Vector extension is working correctly!';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Vector extension error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to get user profile ID from auth user ID (simplified without RLS)
CREATE OR REPLACE FUNCTION get_user_profile_id(auth_user_id TEXT)
RETURNS UUID AS $$
DECLARE
    profile_id UUID;
BEGIN
    SELECT id INTO profile_id 
    FROM usr_prof 
    WHERE usr_prof.auth_user_id = get_user_profile_id.auth_user_id;
    
    RETURN profile_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile if it doesn't exist
CREATE OR REPLACE FUNCTION create_user_profile_if_not_exists(auth_user_id TEXT, user_name TEXT DEFAULT 'User')
RETURNS UUID AS $$
DECLARE
    profile_id UUID;
BEGIN
    -- First try to get existing profile
    SELECT id INTO profile_id 
    FROM usr_prof 
    WHERE usr_prof.auth_user_id = create_user_profile_if_not_exists.auth_user_id;
    
    -- If profile exists, return it
    IF profile_id IS NOT NULL THEN
        RETURN profile_id;
    END IF;
    
    -- Create new profile
    INSERT INTO usr_prof (auth_user_id, bi_legal_name, created_at)
    VALUES (auth_user_id, user_name, NOW())
    RETURNING id INTO profile_id;
    
    RETURN profile_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if tables exist and RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usr_prof', 'ai_memories', 'de_entries', 'fb_heart_rate', 'fb_sleep_sessions', 'fb_daily_summary', 'memory_retrieval_log')
ORDER BY tablename;
