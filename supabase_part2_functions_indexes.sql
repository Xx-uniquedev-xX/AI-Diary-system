-- =============================================
-- PART 2: INDEXES AND POSTGRESQL FUNCTIONS
-- =============================================
-- Run this second in Supabase SQL Editor (after part1)

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Vector search indexes (using hnsw for 2000 dimensions - pgvector index max)
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

-- Function to auto-categorize memories based on content
CREATE OR REPLACE FUNCTION auto_categorize_memory(memory_content TEXT)
RETURNS TEXT[] AS $$
DECLARE
    categories TEXT[] := '{}';
BEGIN
    -- Simple keyword-based categorization (can be enhanced with AI)
    IF memory_content ~* 'sleep|dream|tired|rest|bed' THEN
        categories := array_append(categories, 'sleep');
    END IF;
    
    IF memory_content ~* 'exercise|workout|run|gym|fitness' THEN
        categories := array_append(categories, 'fitness');
    END IF;
    
    IF memory_content ~* 'work|job|career|meeting|project' THEN
        categories := array_append(categories, 'work');
    END IF;
    
    IF memory_content ~* 'family|parent|child|sibling|relative' THEN
        categories := array_append(categories, 'family');
    END IF;
    
    IF memory_content ~* 'friend|social|party|hangout' THEN
        categories := array_append(categories, 'social');
    END IF;
    
    IF memory_content ~* 'stress|anxiety|worry|nervous|overwhelm' THEN
        categories := array_append(categories, 'mental_health');
    END IF;
    
    IF memory_content ~* 'happy|joy|excited|celebrate|achievement' THEN
        categories := array_append(categories, 'positive_emotion');
    END IF;
    
    IF memory_content ~* 'sad|depressed|down|upset|disappointed' THEN
        categories := array_append(categories, 'negative_emotion');
    END IF;
    
    RETURN categories;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update access count and last_accessed
CREATE OR REPLACE FUNCTION update_memory_access()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ai_memories 
    SET access_count = access_count + 1,
        last_accessed = NOW()
    WHERE id = NEW.memory_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER memory_access_trigger
    AFTER INSERT ON memory_retrieval_log
    FOR EACH ROW
    EXECUTE FUNCTION update_memory_access();
