-- =============================================
-- PART 1: CORE TABLES AND EXTENSIONS
-- =============================================
-- Run this first in Supabase SQL Editor

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
    
    -- Semantic Search Support (Jina v4: 2000 dimensions - Supabase limit)
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
