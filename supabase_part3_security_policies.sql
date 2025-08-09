-- =============================================
-- PART 3: ROW LEVEL SECURITY POLICIES
-- =============================================
-- Run this third and final in Supabase SQL Editor (after part1 and part2)

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE usr_prof ENABLE ROW LEVEL SECURITY;
ALTER TABLE de_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_heart_rate ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_sleep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_retrieval_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECURITY POLICIES FOR USER PROFILE
-- ============================================================================

-- Policies for usr_prof
CREATE POLICY "Users can view own profile" ON usr_prof
    FOR SELECT USING (auth.uid()::text = auth_user_id);

CREATE POLICY "Users can insert own profile" ON usr_prof
    FOR INSERT WITH CHECK (auth.uid()::text = auth_user_id);

CREATE POLICY "Users can update own profile" ON usr_prof
    FOR UPDATE USING (auth.uid()::text = auth_user_id);

-- ============================================================================
-- SECURITY POLICIES FOR DIARY ENTRIES
-- ============================================================================

-- Policies for de_entries
CREATE POLICY "Users can view own diary entries" ON de_entries
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own diary entries" ON de_entries
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can update own diary entries" ON de_entries
    FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- ============================================================================
-- SECURITY POLICIES FOR FITBIT DATA
-- ============================================================================

-- Policies for fb_heart_rate
CREATE POLICY "Users can view own heart rate data" ON fb_heart_rate
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own heart rate data" ON fb_heart_rate
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- Policies for fb_sleep_sessions
CREATE POLICY "Users can view own sleep data" ON fb_sleep_sessions
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own sleep data" ON fb_sleep_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- Policies for fb_daily_summary
CREATE POLICY "Users can view own daily summary" ON fb_daily_summary
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own daily summary" ON fb_daily_summary
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- ============================================================================
-- SECURITY POLICIES FOR AI MEMORIES
-- ============================================================================

-- Policies for ai_memories
CREATE POLICY "Users can view own memories" ON ai_memories
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own memories" ON ai_memories
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can update own memories" ON ai_memories
    FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can delete own memories" ON ai_memories
    FOR DELETE USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- ============================================================================
-- SECURITY POLICIES FOR MEMORY RETRIEVAL LOG
-- ============================================================================

-- Policies for memory_retrieval_log
CREATE POLICY "Users can view own retrieval log" ON memory_retrieval_log
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own retrieval log" ON memory_retrieval_log
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- ============================================================================
-- HELPER FUNCTIONS FOR TESTING
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

-- Function to get user profile ID from auth user ID
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
