-- =============================================
-- COMPLETE PERSONAL AI DATABASE SCHEMA WITH JINA EMBEDDINGS
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- Core user profile table
CREATE TABLE usr_prof (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    auth_user_id TEXT UNIQUE, -- Links to Supabase auth.users
    
    -- Basic Identity
    bi_legal_name TEXT,
    bi_nicknames TEXT[],
    bi_birth_date DATE,
    bi_gender_identity TEXT,
    bi_pronouns TEXT[],
    bi_height NUMERIC,
    bi_weight NUMERIC
);

-- Diary Entries (essential for AI analysis)
CREATE TABLE de_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    de_entry_date DATE NOT NULL,
    de_mood_rating INTEGER CHECK (de_mood_rating >= 1 AND de_mood_rating <= 10),
    de_energy_level INTEGER CHECK (de_energy_level >= 1 AND de_energy_level <= 10),
    de_stress_level INTEGER CHECK (de_stress_level >= 1 AND de_stress_level <= 10),
    de_sleep_quality INTEGER CHECK (de_sleep_quality >= 1 AND de_sleep_quality <= 10),
    de_reflection_notes TEXT,
    de_significant_events TEXT[],
    de_emotional_state TEXT[],
    de_gratitude_items TEXT[],
    de_challenges_faced TEXT[],
    de_accomplishments TEXT[]
);

-- ============================================================================
-- FITBIT INTEGRATION TABLES
-- ============================================================================

-- Fitbit Heart Rate Data
CREATE TABLE fb_heart_rate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    
    fb_date DATE NOT NULL,
    fb_resting_heart_rate INTEGER,
    fb_heart_rate_zones JSONB, -- Fat burn, cardio, peak zones
    fb_heart_rate_intraday JSONB -- Minute-by-minute data if available
);

-- Fitbit Sleep Sessions
CREATE TABLE fb_sleep_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    
    fb_date DATE NOT NULL,
    fb_sleep_start_time TIMESTAMP,
    fb_sleep_end_time TIMESTAMP,
    fb_total_sleep_minutes INTEGER,
    fb_sleep_efficiency NUMERIC(5,2),
    fb_time_in_bed INTEGER,
    fb_awake_minutes INTEGER,
    fb_light_sleep_minutes INTEGER,
    fb_deep_sleep_minutes INTEGER,
    fb_rem_sleep_minutes INTEGER,
    fb_awake_count INTEGER,
    fb_restless_count INTEGER
);

-- Fitbit Daily Summary
CREATE TABLE fb_daily_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    
    fb_date DATE NOT NULL,
    fb_steps INTEGER,
    fb_distance NUMERIC(8,2),
    fb_calories_burned INTEGER,
    fb_active_minutes INTEGER,
    fb_sedentary_minutes INTEGER,
    fb_floors_climbed INTEGER
);

-- ============================================================================
-- AI MEMORIES WITH JINA EMBEDDINGS
-- ============================================================================

-- Enhanced Memory Storage with Vector Embeddings
CREATE TABLE ai_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Content Information
    memory_type VARCHAR NOT NULL, -- 'conversation', 'insight', 'pattern', 'preference', 'context'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_type VARCHAR, -- 'user_input', 'ai_analysis', 'system_observation'
    source_id UUID,
    
    -- Semantic Search Support (Jina v4 constrained to 2000 dimensions - pgvector limit)
    embedding VECTOR(2000),
    keywords TEXT[],
    semantic_tags TEXT[],
    
    -- Memory Metadata
    importance_score NUMERIC(3,2) DEFAULT 0.5,
    emotional_valence NUMERIC(3,2) DEFAULT 0.0,
    confidence_score NUMERIC(3,2) DEFAULT 0.8,
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false
);

-- Memory Retrieval Log
CREATE TABLE memory_retrieval_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    memory_id UUID REFERENCES ai_memories(id),
    query_text TEXT,
    similarity_score NUMERIC(5,4),
    retrieved_at TIMESTAMP DEFAULT NOW(),
    context_type VARCHAR
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Vector search indexes
CREATE INDEX ai_memories_embedding_idx ON ai_memories USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ai_memories_usr_prof_idx ON ai_memories(usr_prof_id);
CREATE INDEX ai_memories_type_idx ON ai_memories(memory_type);
CREATE INDEX ai_memories_importance_idx ON ai_memories(importance_score DESC);

-- General indexes
CREATE INDEX de_entries_usr_prof_idx ON de_entries(usr_prof_id);
CREATE INDEX de_entries_date_idx ON de_entries(de_entry_date DESC);
CREATE INDEX fb_heart_rate_usr_prof_idx ON fb_heart_rate(usr_prof_id);
CREATE INDEX fb_sleep_usr_prof_idx ON fb_sleep_sessions(usr_prof_id);
CREATE INDEX fb_daily_usr_prof_idx ON fb_daily_summary(usr_prof_id);

-- ============================================================================
-- POSTGRESQL FUNCTIONS FOR SEMANTIC SEARCH
-- ============================================================================

-- Function to search memories by semantic similarity
CREATE OR REPLACE FUNCTION search_memories_by_embedding(
    user_id UUID,
    query_embedding VECTOR(2000),
    similarity_threshold NUMERIC DEFAULT 0.7,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    memory_id UUID,
    title TEXT,
    content TEXT,
    memory_type VARCHAR,
    similarity_score NUMERIC,
    importance_score NUMERIC,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.content,
        m.memory_type,
        (1 - (m.embedding <=> query_embedding))::NUMERIC(5,4) as similarity,
        m.importance_score,
        m.created_at
    FROM ai_memories m
    WHERE m.usr_prof_id = user_id 
        AND m.is_active = true
        AND (1 - (m.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY m.embedding <=> query_embedding ASC, m.importance_score DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Function to get related memories
CREATE OR REPLACE FUNCTION get_related_memories(
    user_id UUID,
    memory_id UUID,
    max_results INTEGER DEFAULT 5
)
RETURNS TABLE (
    related_memory_id UUID,
    title TEXT,
    content TEXT,
    similarity_score NUMERIC
) AS $$
DECLARE
    target_embedding VECTOR(2000);
BEGIN
    SELECT embedding INTO target_embedding 
    FROM ai_memories 
    WHERE id = memory_id AND usr_prof_id = user_id;
    
    IF target_embedding IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.content,
        (1 - (m.embedding <=> target_embedding))::NUMERIC(5,4) as similarity
    FROM ai_memories m
    WHERE m.usr_prof_id = user_id 
        AND m.is_active = true
        AND m.id != memory_id
    ORDER BY m.embedding <=> target_embedding ASC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE usr_prof ENABLE ROW LEVEL SECURITY;
ALTER TABLE de_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_heart_rate ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_sleep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_retrieval_log ENABLE ROW LEVEL SECURITY;

-- Policies for usr_prof
CREATE POLICY "Users can view own profile" ON usr_prof
    FOR SELECT USING (auth.uid()::text = auth_user_id);
CREATE POLICY "Users can insert own profile" ON usr_prof
    FOR INSERT WITH CHECK (auth.uid()::text = auth_user_id);
CREATE POLICY "Users can update own profile" ON usr_prof
    FOR UPDATE USING (auth.uid()::text = auth_user_id);

-- Policies for de_entries
CREATE POLICY "Users can view own diary entries" ON de_entries
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));
CREATE POLICY "Users can insert own diary entries" ON de_entries
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- Policies for Fitbit data
CREATE POLICY "Users can view own heart rate data" ON fb_heart_rate
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));
CREATE POLICY "Users can insert own heart rate data" ON fb_heart_rate
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can view own sleep data" ON fb_sleep_sessions
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));
CREATE POLICY "Users can insert own sleep data" ON fb_sleep_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can view own daily summary" ON fb_daily_summary
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));
CREATE POLICY "Users can insert own daily summary" ON fb_daily_summary
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- Policies for ai_memories
CREATE POLICY "Users can view own memories" ON ai_memories
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));
CREATE POLICY "Users can insert own memories" ON ai_memories
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));
CREATE POLICY "Users can update own memories" ON ai_memories
    FOR UPDATE USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- Policies for memory_retrieval_log
CREATE POLICY "Users can view own retrieval log" ON memory_retrieval_log
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));
CREATE POLICY "Users can insert own retrieval log" ON memory_retrieval_log
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));
