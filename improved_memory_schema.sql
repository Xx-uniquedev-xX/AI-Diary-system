-- ============================================================================
-- IMPROVED MEMORY SYSTEM WITH JINA EMBEDDINGS v4
-- ============================================================================
-- This enhances the existing memory system to support semantic search via Jina embeddings

-- Enable pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Enhanced Memory Storage with Vector Embeddings
CREATE TABLE ai_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Content Information
    memory_type VARCHAR NOT NULL, -- 'conversation', 'insight', 'pattern', 'preference', 'context'
    title TEXT NOT NULL, -- Brief title/summary
    content TEXT NOT NULL, -- Full memory content
    source_type VARCHAR, -- 'user_input', 'ai_analysis', 'system_observation'
    source_id UUID, -- Reference to source (conversation, diary entry, etc.)
    
    -- Semantic Search Support (Jina v4: 2048 dimensions)
    embedding VECTOR(2000), -- Jina embeddings-v4 (2000 dimensions - pgvector limit)
    keywords TEXT[], -- Fallback keyword search
    semantic_tags TEXT[], -- AI-generated semantic categories
    
    -- Memory Metadata
    importance_score NUMERIC(3,2) DEFAULT 0.5, -- 0.0-1.0 importance
    emotional_valence NUMERIC(3,2) DEFAULT 0.0, -- -1.0 to 1.0 emotional tone
    confidence_score NUMERIC(3,2) DEFAULT 0.8, -- AI confidence in memory accuracy
    access_count INTEGER DEFAULT 0, -- How often this memory is retrieved
    last_accessed TIMESTAMP,
    
    -- Contextual Information
    time_context VARCHAR, -- 'morning', 'afternoon', 'evening', 'night'
    mood_context VARCHAR, -- User's mood when memory was created
    activity_context VARCHAR, -- What user was doing
    location_context VARCHAR, -- Where memory was created
    
    -- Relationships
    related_memories UUID[], -- IDs of related memories
    parent_memory_id UUID REFERENCES ai_memories(id), -- For hierarchical memories
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false -- User confirmed accuracy
);

-- Memory Retrieval Log (track what memories are accessed)
CREATE TABLE memory_retrieval_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    memory_id UUID REFERENCES ai_memories(id),
    query_text TEXT, -- What the user/AI was searching for
    similarity_score NUMERIC(5,4), -- Cosine similarity score
    retrieved_at TIMESTAMP DEFAULT NOW(),
    context_type VARCHAR -- 'user_query', 'ai_analysis', 'background_processing'
);

-- Memory Embedding Queue (for async processing)
CREATE TABLE memory_embedding_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    content TEXT NOT NULL,
    memory_type VARCHAR NOT NULL,
    title TEXT,
    metadata JSONB, -- Additional context for embedding generation
    status VARCHAR DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    error_message TEXT
);

-- Indexes for efficient vector search
CREATE INDEX ai_memories_embedding_idx ON ai_memories USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ai_memories_usr_prof_idx ON ai_memories(usr_prof_id);
CREATE INDEX ai_memories_type_idx ON ai_memories(memory_type);
CREATE INDEX ai_memories_importance_idx ON ai_memories(importance_score DESC);
CREATE INDEX ai_memories_created_idx ON ai_memories(created_at DESC);
CREATE INDEX ai_memories_keywords_idx ON ai_memories USING GIN(keywords);

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
    
    -- Log the retrieval
    INSERT INTO memory_retrieval_log (usr_prof_id, memory_id, similarity_score, context_type)
    SELECT user_id, memory_id, similarity_score, 'semantic_search'
    FROM (
        SELECT 
            m.id as memory_id,
            (1 - (m.embedding <=> query_embedding))::NUMERIC(5,4) as similarity_score
        FROM ai_memories m
        WHERE m.usr_prof_id = user_id 
            AND m.is_active = true
            AND (1 - (m.embedding <=> query_embedding)) >= similarity_threshold
        ORDER BY m.embedding <=> query_embedding ASC, m.importance_score DESC
        LIMIT max_results
    ) retrieved_memories;
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
    -- Get the embedding of the target memory
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

-- Row Level Security
ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_retrieval_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_embedding_queue ENABLE ROW LEVEL SECURITY;

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

-- Policies for memory_embedding_queue
CREATE POLICY "Users can view own embedding queue" ON memory_embedding_queue
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own embedding queue" ON memory_embedding_queue
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));
