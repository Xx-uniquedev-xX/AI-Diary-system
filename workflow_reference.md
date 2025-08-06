# ADHD AI Workflow Reference

## Core Tables for Daily Workflow

### 1. Diary Entries (`de_entries`)
**Primary table for user input**
```sql
id UUID PRIMARY KEY
usr_prof_id UUID REFERENCES usr_prof(id)
created_at TIMESTAMP
de_content TEXT NOT NULL -- Raw diary entry content
de_mood_score INTEGER (1-10) -- Mood score
de_emotional_tags TEXT[] -- Emotional tags extracted
de_topics TEXT[] -- Topics discussed
de_insights_extracted JSONB -- AI-extracted insights
de_patterns_identified TEXT[] -- Patterns identified
de_confidence_scores JSONB -- Confidence scores
```

### 2. User Profile (`usr_prof`)
**Core user identity**
```sql
id UUID PRIMARY KEY
created_at TIMESTAMP
updated_at TIMESTAMP
-- Basic Identity fields (bi_*)
bi_legal_name TEXT
bi_nicknames TEXT[]
bi_birth_date DATE
bi_gender_identity TEXT
bi_pronouns TEXT[]
-- ... (see full schema for all bi_* fields)
```

### 3. Mental Health (`mh_mental_health`)
**ADHD-specific data**
```sql
id UUID PRIMARY KEY
usr_prof_id UUID REFERENCES usr_prof(id)
created_at TIMESTAMP
updated_at TIMESTAMP
mh_current_status TEXT
mh_diagnosed_conditions TEXT[] -- ADHD, etc.
mh_therapy_experiences JSONB
mh_coping_strategies TEXT[]
mh_triggers JSONB
mh_medication_history JSONB -- ADHD meds
mh_stress_management TEXT[]
```

### 4. Cognitive Architecture (`ca_cognitive`)
**Attention and focus patterns**
```sql
id UUID PRIMARY KEY
usr_prof_id UUID REFERENCES usr_prof(id)
created_at TIMESTAMP
updated_at TIMESTAMP
ca_processing_speed TEXT
ca_processing_style TEXT
ca_memory_architecture JSONB
ca_attention_patterns TEXT[] -- Key for ADHD
ca_distractibility_triggers TEXT[] -- Key for ADHD
ca_mental_energy_cycles JSONB
ca_cognitive_load_tolerance TEXT
ca_problem_solving_approach TEXT[]
ca_thinking_patterns TEXT[]
```

### 5. Temporal Patterns (`tp_temporal`)
**Daily rhythms and cycles**
```sql
id UUID PRIMARY KEY
usr_prof_id UUID REFERENCES usr_prof(id)
created_at TIMESTAMP
updated_at TIMESTAMP
tp_daily_routines JSONB -- Morning/evening routines
tp_seasonal_patterns TEXT[]
tp_circadian_preferences TEXT
tp_productivity_cycles JSONB -- Peak focus times
tp_emotional_rhythms TEXT[]
tp_change_adaptation TEXT
```

## AI Analysis Tables

### 6. Pattern Correlations (`pattern_correlations`)
**Cross-domain pattern recognition**
```sql
id UUID PRIMARY KEY
usr_prof_id UUID REFERENCES usr_prof(id)
created_at TIMESTAMP
updated_at TIMESTAMP
pc_pattern_type VARCHAR -- 'behavioral', 'emotional', 'cognitive', 'temporal'
pc_source_tables TEXT[] -- Which tables contributed
pc_correlation_data JSONB -- Detailed correlation info
pc_confidence_score NUMERIC(3,2) -- 0.00-1.00
pc_frequency INTEGER -- How often pattern appears
pc_first_detected TIMESTAMP
pc_last_confirmed TIMESTAMP
pc_strength NUMERIC(3,2) -- Correlation strength
pc_triggers TEXT[] -- What triggers this pattern
pc_outcomes TEXT[] -- What outcomes it leads to
pc_intervention_points TEXT[] -- Where to intervene
```

### 7. Memory Search Index (`memory_search_index`)
**Fast keyword-based search**
```sql
id UUID PRIMARY KEY
usr_prof_id UUID REFERENCES usr_prof(id)
created_at TIMESTAMP
ms_content_type VARCHAR -- 'diary', 'pattern', 'insight', 'correlation'
ms_content_id UUID -- ID of referenced content
ms_keywords TEXT[] -- Searchable keywords
ms_semantic_tags TEXT[] -- Categorization tags
ms_emotional_valence NUMERIC(3,2) -- -1.00 to 1.00
ms_importance_score NUMERIC(3,2) -- 0.00-1.00
ms_context_period VARCHAR -- 'morning', 'evening', 'weekend'
ms_related_entries UUID[] -- Related diary entry IDs
```

### 8. Guidance Recommendations (`guidance_recommendations`)
**AI-generated suggestions**
```sql
id UUID PRIMARY KEY
usr_prof_id UUID REFERENCES usr_prof(id)
source_entry_id UUID REFERENCES de_entries(id)
created_at TIMESTAMP
gr_recommendation_type VARCHAR -- 'morning_routine', 'stress_management', 'focus_strategy'
gr_priority_level INTEGER -- 1 (highest) to 5 (lowest)
gr_title TEXT NOT NULL
gr_description TEXT NOT NULL
gr_rationale TEXT -- Why this recommendation
gr_expected_outcome TEXT
gr_difficulty_level INTEGER -- 1 (easy) to 5 (very difficult)
gr_time_investment VARCHAR
gr_success_metrics TEXT[]
gr_fallback_options TEXT[]
gr_expiry_date DATE
gr_user_response VARCHAR -- 'accepted', 'rejected', 'modified', 'pending'
gr_actual_outcome TEXT
gr_effectiveness_score NUMERIC(3,2) -- 0.00-1.00
```

## System Tables

### 9. Data Updates (`du_updates`)
**Audit trail for all changes**
```sql
id UUID PRIMARY KEY
usr_prof_id UUID REFERENCES usr_prof(id)
table_name TEXT NOT NULL -- Which table was updated
field_name TEXT NOT NULL -- Which field was updated
old_value JSONB -- Previous value
new_value JSONB -- New value
confidence_score NUMERIC(3,2) -- Confidence in update
source_entry_id UUID REFERENCES de_entries(id)
extraction_method TEXT -- How data was extracted
created_at TIMESTAMP
```

## Key Functions for Workflow

### 1. Get Complete User Profile
```sql
SELECT get_user_comprehensive_profile('user-uuid-here');
```
Returns complete JSONB with all user data across all tables.

### 2. Search Memory by Keywords
```sql
SELECT * FROM search_memory_by_keywords(
    'user-uuid-here', 
    ARRAY['stress', 'focus', 'medication']
);
```
Returns relevant content with relevance scores.

## Useful Views

### 1. Recent Patterns
```sql
SELECT * FROM recent_patterns WHERE usr_prof_id = 'user-uuid';
```
Shows patterns confirmed in last 30 days.

### 2. Pending Recommendations
```sql
SELECT * FROM pending_recommendations WHERE usr_prof_id = 'user-uuid';
```
Shows recommendations awaiting user response.

## Common Workflow Queries

### Insert New Diary Entry
```sql
INSERT INTO de_entries (usr_prof_id, de_content, de_mood_score)
VALUES ('user-uuid', 'Today I struggled with focus...', 6);
```

### Update Mental Health Data from AI Analysis
```sql
UPDATE mh_mental_health 
SET mh_coping_strategies = mh_coping_strategies || ARRAY['new_strategy']
WHERE usr_prof_id = 'user-uuid';
```

### Log AI Analysis Update
```sql
INSERT INTO du_updates (
    usr_prof_id, table_name, field_name, 
    old_value, new_value, confidence_score, 
    source_entry_id, extraction_method
) VALUES (
    'user-uuid', 'mh_mental_health', 'mh_coping_strategies',
    '["old_strategy"]', '["old_strategy", "new_strategy"]', 0.85,
    'diary-entry-uuid', 'openrouter_analysis'
);
```

### Create Pattern Correlation
```sql
INSERT INTO pattern_correlations (
    usr_prof_id, pc_pattern_type, pc_source_tables,
    pc_correlation_data, pc_confidence_score, pc_triggers, pc_outcomes
) VALUES (
    'user-uuid', 'cognitive', ARRAY['ca_cognitive', 'tp_temporal'],
    '{"correlation": "focus_drops_afternoon"}', 0.78,
    ARRAY['post_lunch', 'low_energy'], ARRAY['difficulty_concentrating']
);
```

### Add Memory Index Entry
```sql
INSERT INTO memory_search_index (
    usr_prof_id, ms_content_type, ms_content_id,
    ms_keywords, ms_emotional_valence, ms_importance_score
) VALUES (
    'user-uuid', 'diary', 'diary-entry-uuid',
    ARRAY['focus', 'medication', 'stress'], -0.3, 0.8
);
```

### Create Guidance Recommendation
```sql
INSERT INTO guidance_recommendations (
    usr_prof_id, source_entry_id, gr_recommendation_type,
    gr_title, gr_description, gr_priority_level, gr_difficulty_level
) VALUES (
    'user-uuid', 'diary-entry-uuid', 'focus_strategy',
    'Pomodoro Technique for Afternoon Focus',
    'Try 25-minute focused work sessions with 5-minute breaks...',
    2, 3
);
```

## ADHD-Specific Workflow Tables

### Most Important for ADHD AI:
1. **`de_entries`** - Daily diary input
2. **`mh_mental_health`** - ADHD diagnosis, medications, coping strategies
3. **`ca_cognitive`** - Attention patterns, distractibility triggers
4. **`tp_temporal`** - Daily routines, productivity cycles
5. **`pattern_correlations`** - Cross-domain pattern recognition
6. **`guidance_recommendations`** - AI-generated suggestions

### Secondary Tables:
- **`csr_crisis`** - Stress response patterns
- **`ei_emotional`** - Emotional regulation
- **`se_sensory`** - Environmental sensitivities
- **`lg_learning`** - Learning preferences and strategies

This reference covers the core tables and operations you'll need for your ADHD AI workflow!