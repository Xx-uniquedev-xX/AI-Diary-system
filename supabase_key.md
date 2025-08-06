# Database Schema Terminology Reference

## Table Prefixes & Meanings

| Short Form | Full Form | Description |
|------------|-----------|-------------|
| `usr_prof` | User Profile | Core user identity and basic information |
| `ls_` | Living Situation | Housing, residence, and living arrangements |
| `ci_` | Cultural Identity | Ethnic background, languages, traditions |
| `ed_` | Education | Academic history and learning experiences |
| `cp_` | Career Professional | Work history and professional development |
| `ph_` | Physical Health | Health status, medical history, physical wellness |
| `mh_` | Mental Health | Psychological wellness and mental health history |
| `fr_` | Family Relationships | Family dynamics and relationships |
| `rh_` | Romantic History | Dating, relationships, and romantic patterns |
| `fp_` | Friendship Patterns | Social connections and friendship dynamics |
| `cs_` | Communication Styles | How they express and interact verbally/non-verbally |
| `ei_` | Emotional Intelligence | Emotional awareness and regulation abilities |
| `vb_` | Values Beliefs | Core values, beliefs, and moral framework |
| `tp_` | Temporal Patterns | Time-based rhythms and cycles |
| `dm_` | Decision Making | Decision-making processes and patterns |
| `se_` | Sensory Environmental | Sensory preferences and environmental needs |
| `lg_` | Learning Growth | Learning patterns and personal development |
| `csr_` | Crisis Stress Response | How they handle crisis and extreme stress |
| `up_` | Unconscious Patterns | Hidden behaviors and blind spots |
| `me_` | Micro Expressions | Subtle behaviors and micro-expressions |
| `ca_` | Cognitive Architecture | Information processing and thinking patterns |
| `sp_` | Social Psychology | Social dynamics and interpersonal patterns |
| `ep_` | Existential Philosophical | Life meaning and philosophical outlook |
| `seb_` | Somatic Embodied | Body awareness and physical-emotional connection |
| `ce_` | Creative Expressive | Creativity, art, and self-expression |
| `ti_` | Temporal Identity | Identity across time and life narrative |
| `st_` | Spiritual Transcendent | Spiritual experiences and transcendent states |
| `si_` | Shadow Integration | Hidden aspects and shadow work |
| `ec_` | Economic Psychology | Money psychology and resource relationships |
| `de_` | Diary Entries | User diary entries and content |
| `du_` | Data Updates | Log of all database updates and changes |

## Key Column Patterns

### Basic Information Columns (bi_)
- `bi_legal_name` - Full legal name
- `bi_nicknames` - Array of nicknames/preferred names
- `bi_childhood_names` - Names used in childhood
- `bi_context_names` - Names in different contexts (work, family)
- `bi_birth_date` - Birth date
- `bi_birth_time` - Birth time
- `bi_birth_location` - Birth location
- `bi_astrological_sign` - Astrological sign if relevant
- `bi_gender_identity` - Current gender identity
- `bi_gender_evolution` - Gender identity journey/transitions
- `bi_pronouns` - Preferred pronouns
- `bi_pronoun_comfort` - Comfort levels with different pronouns
- `bi_physical_desc` - Physical characteristics they care about
- `bi_appearance_feelings` - Feelings about appearance
- `bi_body_image_rel` - Relationship with body image
- `bi_height` - Height in cm
- `bi_weight` - Weight in kg
- `bi_distinguishing_marks` - Scars, tattoos, piercings with stories
- `bi_medical_ids` - Medical IDs, allergies, emergency contacts
- `bi_legal_status` - Citizenship, visa status
- `bi_immigration_history` - Immigration background

### Living Situation Columns (ls_)
- `ls_current_address` - Current address
- `ls_residence_duration` - How long at current address
- `ls_previous_addresses` - Previous addresses with move reasons
- `ls_ownership_status` - Rent/own/live with others
- `ls_ownership_feelings` - Feelings about living arrangement
- `ls_housemates` - Roommates/family with relationship dynamics
- `ls_ideal_living` - Ideal living situation
- `ls_housing_barriers` - Barriers to ideal housing
- `ls_space_organization` - How they organize space
- `ls_space_decoration` - Decoration style
- `ls_important_areas` - Most important home areas
- `ls_cleaning_habits` - Cleaning and organization style
- `ls_mess_tolerance` - Comfort with messiness/order
- `ls_neighborhood_rel` - Neighborhood relationships
- `ls_community_involvement` - Community involvement
- `ls_safety_concerns` - Safety concerns
- `ls_future_housing_plans` - Future housing plans
- `ls_location_preferences` - Location preferences
- `ls_space_personality_reflect` - How space reflects personality

### Cultural Identity Columns (ci_)
- `ci_ethnic_background` - Specific ethnic background with percentages
- `ci_languages` - Languages with fluency levels
- `ci_language_preferences` - Language preferences by context/emotion
- `ci_traditions_active` - Actively practiced traditions
- `ci_traditions_abandoned` - Abandoned traditions
- `ci_cultural_foods` - Relationship with cultural foods
- `ci_traditional_clothing` - Traditional items owned/worn
- `ci_cultural_holidays` - Holiday observance patterns
- `ci_discrimination_exp` - Experiences with discrimination
- `ci_community_connections` - Cultural community involvement
- `ci_identity_navigation` - Navigating multiple cultural identities
- `ci_value_conflicts` - Cultural vs personal value conflicts
- `ci_environmental_adaptation` - Adaptation to different environments

### Educational Background Columns (ed_)
- `ed_preschool_exp` - Preschool/early childhood education
- `ed_elementary_exp` - Elementary experiences, favorite teachers
- `ed_middle_school_exp` - Middle school challenges and social dynamics
- `ed_high_school_exp` - High school academic/social experiences
- `ed_college_choices` - College choices and reasons
- `ed_major_selection` - Major selection process and changes
- `ed_graduate_exp` - Graduate school experiences
- `ed_certifications` - Professional certifications
- `ed_learning_disabilities` - Learning disabilities/accommodations
- `ed_favorite_subjects` - Favorite academic subjects
- `ed_struggle_subjects` - Subjects they struggled with
- `ed_mentor_relationships` - Teacher/professor/mentor relationships
- `ed_achievements` - Academic achievements
- `ed_disappointments` - Academic disappointments
- `ed_worldview_impact` - How education shaped worldview

### Career Professional Columns (cp_)
- `cp_first_job` - First job and lessons learned
- `cp_school_jobs` - Part-time jobs during school
- `cp_career_progression` - Career progression and decision points
- `cp_current_job` - Current job details and responsibilities
- `cp_workplace_relationships` - Workplace relationship dynamics
- `cp_achievements` - Professional achievements
- `cp_failures` - Work failures and how navigated
- `cp_professional_reputation` - Reputation in field
- `cp_side_ventures` - Side businesses/freelance work
- `cp_professional_orgs` - Professional organizations
- `cp_continuing_education` - Ongoing professional development
- `cp_work_life_balance` - Work-life balance strategies
- `cp_career_goals` - Career goals and aspirations
- `cp_avoided_industries` - Industries they'd avoid and why
- `cp_workplace_politics` - How they handle workplace politics

### Physical Health Columns (ph_)
- `ph_overall_status` - Current overall health status
- `ph_energy_levels` - Energy levels
- `ph_chronic_conditions` - Chronic conditions/disabilities
- `ph_medications` - Prescription medications
- `ph_mental_health_meds` - Mental health medications and experiences
- `ph_surgical_history` - Surgical history with recovery experiences
- `ph_injury_history` - Injuries and life impact
- `ph_allergies` - All types of allergies
- `ph_fitness_level` - Fitness level and exercise capacity
- `ph_physical_limitations` - Physical limitations
- `ph_sleep_patterns` - Sleep patterns and quality
- `ph_nutrition_needs` - Nutrition needs and dietary restrictions
- `ph_substance_use` - Substance use history
- `ph_family_medical_history` - Family medical history
- `ph_healthcare_providers` - Healthcare provider relationships
- `ph_insurance_situation` - Health insurance and access
- `ph_preventive_care` - Preventive care habits
- `ph_body_awareness` - Body awareness and health recognition
- `ph_recovery_patterns` - Recovery patterns when sick

### Mental Health Columns (mh_)
- `mh_current_status` - Current mental health status
- `mh_diagnosed_conditions` - Diagnosed mental health conditions
- `mh_therapy_experiences` - Therapy experiences and types tried
- `mh_provider_relationships` - Mental health provider relationships
- `mh_coping_strategies` - Effective coping strategies
- `mh_triggers` - Mental health triggers and warning signs
- `mh_support_systems` - Support systems during struggles
- `mh_medication_history` - Mental health medication effectiveness
- `mh_stigma_experiences` - Stigma experiences and handling
- `mh_family_history` - Family mental health history
- `mh_stress_management` - Stress management techniques
- `mh_self_recognition` - How they recognize mental health needs
- `mh_personal_growth` - Personal growth work and insights
- `mh_development_goals` - Mental health goals and development areas

### Family Relationships Columns (fr_)
- `fr_mother_relationship` - Mother relationship dynamics
- `fr_father_relationship` - Father relationship dynamics
- `fr_sibling_relationships` - Individual sibling relationships
- `fr_extended_family` - Extended family relationships
- `fr_closest_members` - Closest family members
- `fr_difficult_relationships` - Difficult family relationships
- `fr_gathering_dynamics` - Family gathering and holiday dynamics
- `fr_communication_patterns` - Family communication patterns
- `fr_financial_relationships` - Financial family relationships
- `fr_caregiving_responsibilities` - Caregiving responsibilities
- `fr_family_secrets` - Family secrets and sensitive topics
- `fr_relationship_evolution` - How relationships evolved over time
- `fr_traditions_continue` - Family traditions they want to continue
- `fr_traditions_change` - Family traditions they want to change
- `fr_inlaw_relationships` - In-law and extended family relationships

### Romantic History Columns (rh_)
- `rh_first_crush` - First crush and lessons learned
- `rh_dating_history` - Complete dating history
- `rh_relationship_patterns` - Recognized relationship patterns
- `rh_attraction_types` - Types of people they're attracted to
- `rh_longest_relationship` - Longest relationship and learnings
- `rh_painful_breakup` - Most painful breakup and processing
- `rh_relationship_mistakes` - Relationship mistakes and growth
- `rh_love_needs` - What they need to feel loved
- `rh_deal_breakers` - Deal-breakers and non-negotiables
- `rh_conflict_handling` - How they handle relationship conflict
- `rh_commitment_approach` - Approach to commitment
- `rh_intimacy_preferences` - Sexual preferences and boundaries
- `rh_future_goals` - Future relationship goals
- `rh_past_influence` - How past relationships influence current approach

### Friendship Patterns Columns (fp_)
- `fp_oldest_friendship` - Oldest friendship evolution
- `fp_friend_types` - Types of friends they attract
- `fp_friend_role` - Role they play in friendships
- `fp_making_friends` - How they make new friends
- `fp_maintenance_habits` - Friendship maintenance habits
- `fp_lost_friendships` - Lost friendships and circumstances
- `fp_social_energy` - Social energy needs vs solitude
- `fp_group_dynamics` - Comfortable group dynamics
- `fp_friend_support` - How they support friends
- `fp_support_needs` - Support they need from friends
- `fp_friendship_boundaries` - Boundaries in friendships
- `fp_geographic_challenges` - Managing long-distance friendships
- `fp_friend_groups` - Different friend groups and interactions
- `fp_social_activities` - Preferred social activities
- `fp_friendship_evolution` - How friendship needs have changed

### Communication Styles Columns (cs_)
- `cs_verbal_preferences` - Verbal communication preferences
- `cs_nonverbal_habits` - Non-verbal communication habits
- `cs_written_style` - Written communication style
- `cs_emotion_expression` - How they express different emotions
- `cs_affection_showing` - Ways they show affection
- `cs_context_differences` - Professional vs personal communication
- `cs_difficult_conversations` - Handling difficult conversations
- `cs_listening_style` - Listening style and engagement
- `cs_questioning_patterns` - Types of questions they ask
- `cs_storytelling_style` - How they share experiences
- `cs_humor_style` - Humor style and appropriateness
- `cs_needs_communication` - How they communicate needs/boundaries
- `cs_cultural_patterns` - Cultural communication patterns inherited
- `cs_pattern_changes` - Communication patterns they've changed

### Emotional Intelligence Columns (ei_)
- `ei_self_awareness` - Self-awareness level
- `ei_emotion_regulation` - Emotional regulation skills
- `ei_empathy_capacity` - Empathy capacity and responses
- `ei_social_awareness` - Social situation reading ability
- `ei_emotional_triggers` - Consistent emotional triggers
- `ei_recovery_patterns` - Emotional recovery patterns
- `ei_vulnerability_expression` - How they express vulnerability
- `ei_others_emotions` - How they handle others' emotions
- `ei_emotional_boundaries` - Emotional boundaries maintained
- `ei_growth_areas` - Emotional intelligence growth areas
- `ei_childhood_influence` - Childhood emotional pattern influence
- `ei_relationship_needs` - Emotional needs in relationships

### Values and Beliefs Columns (vb_)
- `vb_core_values` - Core guiding values
- `vb_religious_beliefs` - Religious/spiritual beliefs and practices
- `vb_political_beliefs` - Political beliefs and engagement
- `vb_environmental_values` - Environmental values and practices
- `vb_social_justice` - Social justice beliefs and activism
- `vb_financial_values` - Financial values and money beliefs
- `vb_family_values` - Family and relationship values
- `vb_work_ethics` - Work ethic and professional values
- `vb_integrity_standards` - Personal integrity standards
- `vb_inherited_vs_developed` - Inherited vs independently developed values
- `vb_value_evolution` - How values have changed over time
- `vb_value_conflicts` - Navigation of competing values

### Temporal Patterns Columns (tp_)
- `tp_daily_routines` - Daily routines and energy cycles
- `tp_seasonal_patterns` - Seasonal mood/behavior patterns
- `tp_life_transitions` - Life phase transitions and adaptation
- `tp_memory_formation` - Memory formation patterns
- `tp_circadian_preferences` - Natural circadian rhythm preferences
- `tp_productivity_cycles` - Productivity and focus cycles
- `tp_emotional_rhythms` - Emotional rhythm patterns
- `tp_change_adaptation` - How they handle change and transitions

### Decision Making Columns (dm_)
- `dm_information_processing` - How they process information
- `dm_risk_tolerance` - Risk tolerance in different areas
- `dm_decision_speed` - Decision-making speed and confidence
- `dm_regretted_decisions` - Past decisions they regret
- `dm_decision_criteria` - Criteria they use for decisions
- `dm_influence_factors` - What influences their decisions
- `dm_intuition_vs_logic` - Balance of intuition vs logic
- `dm_decision_stress` - How they handle decision-making stress

### Sensory Environmental Columns (se_)
- `se_sensory_sensitivities` - Sound, light, texture, temperature sensitivities
- `se_environment_preferences` - Preferred environments for different activities
- `se_comfort_needs` - Physical comfort needs
- `se_space_preferences` - Space preferences and requirements
- `se_environment_mood_impact` - How environment affects mood
- `se_productivity_environments` - Environments that enhance productivity
- `se_sensory_comfort` - What provides sensory comfort
- `se_environmental_stress` - Environmental factors that cause stress

### Learning Growth Columns (lg_)
- `lg_skill_acquisition` - How they acquire new skills
- `lg_feedback_response` - Response to feedback and criticism
- `lg_natural_talents` - Areas of natural talent
- `lg_struggle_areas` - Areas where they struggle
- `lg_development_approaches` - Personal development approaches
- `lg_learning_preferences` - Learning style preferences
- `lg_curiosity_patterns` - What sparks their curiosity
- `lg_mastery_motivation` - What motivates them to master skills

### Crisis Stress Response Columns (csr_)
- `csr_stress_behavior` - Behavior under extreme stress
- `csr_past_crises` - Past crises and navigation strategies
- `csr_support_seeking` - Support-seeking patterns during crisis
- `csr_recovery_strategies` - Recovery and resilience strategies
- `csr_stress_indicators` - Early stress warning signs
- `csr_coping_mechanisms` - Crisis coping mechanisms
- `csr_breakdown_patterns` - How they break down under pressure
- `csr_strength_sources` - Sources of strength during difficult times

### Unconscious Patterns Columns (up_)
- `up_blind_spots` - Self-awareness blind spots
- `up_unrecognized_behaviors` - Behaviors they don't recognize
- `up_unconscious_motivations` - Unconscious motivations
- `up_defense_mechanisms` - Psychological defense mechanisms
- `up_projection_patterns` - What they project onto others
- `up_self_sabotage` - Self-sabotage patterns
- `up_internal_conflicts` - Internal conflicts and contradictions
- `up_shadow_aspects` - Rejected or hidden parts of self

### Micro Expressions Columns (me_)
- `me_fidgeting_patterns` - Fidgeting and nervous habits
- `me_comfort_gestures` - Comfort gestures and self-soothing
- `me_voice_changes` - Voice changes in different states
- `me_breathing_patterns` - Breathing pattern variations
- `me_posture_shifts` - Posture changes with mood/context
- `me_eye_contact_patterns` - Eye contact patterns
- `me_facial_expressions` - Facial micro-expression patterns
- `me_space_occupation` - How they occupy physical space
- `me_unconscious_habits` - Unconscious habits and tics

### Cognitive Architecture Columns (ca_)
- `ca_processing_speed` - Information processing speed
- `ca_processing_style` - Linear vs intuitive processing
- `ca_memory_architecture` - Visual/auditory/kinesthetic memory preferences
- `ca_attention_patterns` - Attention and focus patterns
- `ca_distractibility_triggers` - What causes distraction
- `ca_mental_energy_cycles` - Mental energy cycles
- `ca_cognitive_load_tolerance` - Cognitive load tolerance
- `ca_problem_solving_approach` - Problem-solving approaches
- `ca_thinking_patterns` - Characteristic thinking patterns

### Social Psychology Columns (sp_)
- `sp_power_dynamics` - Comfort with different power dynamics
- `sp_personality_interactions` - Behavior with different personality types
- `sp_social_masks` - Social masks worn in different contexts
- `sp_influence_patterns` - How they influence others
- `sp_boundary_testing` - Boundary testing behaviors
- `sp_boundary_respect` - Respect for others' boundaries
- `sp_group_role_preferences` - Preferred roles in groups
- `sp_social_energy_management` - How they manage social energy

### Existential Philosophical Columns (ep_)
- `ep_mortality_relationship` - Relationship with mortality and aging
- `ep_meaning_making` - Meaning-making patterns
- `ep_uncertainty_handling` - How they handle uncertainty
- `ep_time_relationship` - Past/present/future focus
- `ep_personal_mythology` - Personal life story narrative
- `ep_existential_concerns` - Primary existential concerns
- `ep_purpose_sources` - Sources of life purpose
- `ep_philosophical_frameworks` - Philosophical frameworks they use

### Somatic Embodied Columns (seb_)
- `seb_emotion_body_manifest` - How emotions manifest physically
- `seb_interoceptive_awareness` - Ability to sense internal bodily signals
- `seb_pain_pleasure_relationship` - Relationship with pain and pleasure
- `seb_physical_emotional_influence` - How physical states influence emotions
- `seb_body_memory` - Body memory and trauma storage
- `seb_embodied_wisdom` - Body wisdom and intuition
- `seb_physical_comfort_needs` - Physical comfort needs
- `seb_somatic_practices` - Somatic practices they use

### Creative Expressive Columns (ce_)
- `ce_creative_outlets` - Creative outlets and artistic preferences
- `ce_nonverbal_expression` - Non-verbal expression methods
- `ce_aesthetic_preferences` - Aesthetic preferences across mediums
- `ce_innovation_patterns` - Innovation and original thinking approaches
- `ce_play_style` - Play style and childlike qualities
- `ce_creative_blocks` - Creative blocks and how they handle them
- `ce_inspiration_sources` - Sources of creative inspiration
- `ce_artistic_development` - Artistic development over time

### Temporal Identity Columns (ti_)
- `ti_self_integration` - Integration of different self-versions
- `ti_past_self_relationship` - Relationship with past self
- `ti_future_self_relationship` - Relationship with future self
- `ti_narrative_coherence` - Life story coherence
- `ti_regrets_whatifs` - Regrets and alternative life paths
- `ti_legacy_concerns` - Legacy and how they want to be remembered
- `ti_identity_evolution` - How identity has evolved
- `ti_core_consistency` - What remains consistent across time

### Spiritual Transcendent Columns (st_)
- `st_peak_experiences` - Peak and transcendent experiences
- `st_connection_greater` - Connection to nature/universe/greater
- `st_mystical_experiences` - Mystical or unexplainable experiences
- `st_ritual_preferences` - Ritual and ceremony preferences
- `st_flow_states` - How they access flow states
- `st_spiritual_practices` - Spiritual practices they engage in
- `st_transcendent_triggers` - What triggers transcendent states
- `st_sacred_relationships` - What they consider sacred

### Shadow Integration Columns (si_)
- `si_rejected_aspects` - Parts of self they reject or hide
- `si_inner_critic` - Inner critic patterns and self-talk
- `si_shame_guilt_handling` - How they handle shame and guilt
- `si_self_forgiveness` - Self-forgiveness patterns
- `si_masculine_feminine` - Integration of masculine/feminine aspects
- `si_trauma_work` - Trauma work done or needed
- `si_shadow_work_progress` - Progress on shadow integration
- `si_integration_practices` - Practices for integrating shadow aspects

### Economic Psychology Columns (ec_)
- `ec_money_psychology` - Deep money psychology patterns
- `ec_scarcity_abundance` - Scarcity vs abundance mindset
- `ec_material_possessions` - Relationship with material possessions
- `ec_consumption_patterns` - Consumption and spending patterns
- `ec_generosity_patterns` - Generosity and resource sharing
- `ec_economic_trauma` - Economic trauma or privilege impact
- `ec_financial_security_needs` - Financial security needs and fears
- `ec_wealth_relationship` - Relationship with wealth and success

### Diary Entries Columns (de_)
- `de_content` - Raw diary entry content
- `de_mood_score` - Mood score 1-10
- `de_emotional_tags` - Emotional tags extracted
- `de_topics` - Topics discussed
- `de_insights_extracted` - AI-extracted insights
- `de_patterns_identified` - Patterns identified in this entry
- `de_confidence_scores` - Confidence scores for different extractions

### Data Updates Columns (du_)
- `du_updates` - Main updates table name
- `table_name` - Which table was updated
- `field_name` - Which field was updated
- `old_value` - Previous value
- `new_value` - New value
- `confidence_score` - Confidence in the update (0.00-1.00)
- `source_entry_id` - Source diary entry
- `extraction_method` - How the data was extracted

### Pattern Correlations Columns (pc_)
- `pc_pattern_type` - Pattern type: 'behavioral', 'emotional', 'cognitive', 'temporal'
- `pc_source_tables` - Which tables contributed to this pattern
- `pc_correlation_data` - Detailed correlation information
- `pc_confidence_score` - Confidence in this pattern (0.00-1.00)
- `pc_frequency` - How often this pattern appears
- `pc_first_detected` - When pattern was first identified
- `pc_last_confirmed` - Last time pattern was confirmed
- `pc_strength` - Strength of the correlation (0.00-1.00)
- `pc_triggers` - What triggers this pattern
- `pc_outcomes` - What outcomes this pattern leads to
- `pc_intervention_points` - Where interventions might be effective

### Memory Search Index Columns (ms_)
- `ms_content_type` - Content type: 'diary', 'pattern', 'insight', 'correlation'
- `ms_content_id` - ID of the referenced content
- `ms_keywords` - Searchable keywords
- `ms_semantic_tags` - Semantic tags for categorization
- `ms_emotional_valence` - Emotional valence (-1.00 to 1.00)
- `ms_importance_score` - Importance score (0.00-1.00)
- `ms_context_period` - Time period context ('morning', 'evening', 'weekend')
- `ms_related_entries` - Related diary entry IDs

### Guidance Recommendations Columns (gr_)
- `gr_recommendation_type` - Type: 'morning_routine', 'stress_management', 'focus_strategy'
- `gr_priority_level` - Priority: 1 (highest) to 5 (lowest)
- `gr_title` - Brief title of the recommendation
- `gr_description` - Detailed description
- `gr_rationale` - Why this recommendation was made
- `gr_expected_outcome` - What outcome is expected
- `gr_difficulty_level` - Difficulty: 1 (easy) to 5 (very difficult)
- `gr_time_investment` - Expected time investment
- `gr_success_metrics` - How to measure success
- `gr_fallback_options` - Alternative approaches
- `gr_expiry_date` - When this recommendation becomes outdated
- `gr_user_response` - Response: 'accepted', 'rejected', 'modified', 'pending'
- `gr_actual_outcome` - What actually happened when tried
- `gr_effectiveness_score` - How effective it was (0.00-1.00)

## Data Types Used

- `TEXT` - Variable length text
- `TEXT[]` - Array of text values
- `JSONB` - JSON binary format for complex structured data
- `UUID` - Universally unique identifier
- `TIMESTAMP` - Date and time
- `DATE` - Date only
- `TIME` - Time only
- `INTERVAL` - Time interval
- `NUMERIC` - Precise decimal numbers
- `INTEGER` - Whole numbers
- `VARCHAR` - Variable character with length limit
- `BOOLEAN` - True/false values

## Key Design Principles

1. **Comprehensive Coverage** - Every aspect of human complexity is covered
2. **Evolutionary Tracking** - All tables have created_at and updated_at timestamps
3. **Confidence Scoring** - Updates include confidence levels for AI reliability
4. **Source Tracking** - All updates reference the diary entry that provided the information
5. **Flexible Structure** - JSONB fields allow for complex, evolving data structures
6. **Performance Optimization** - Indexes on frequently queried fields
7. **Data Integrity** - Foreign key relationships maintain consistency
8. **Audit Trail** - Complete log of all changes with old/new values
9. **Pattern Recognition** - Advanced correlation tracking across all data domains
10. **Memory System** - Sophisticated search and retrieval capabilities
11. **Security** - Row Level Security (RLS) ensures users only access their own data
12. **Scalability** - Designed to handle large amounts of personal data efficiently
13. **Simplicity** - Focused on core functionality without unnecessary complexity

## Advanced Features

### Views Available
- `recent_patterns` - Recently confirmed patterns with confidence scores
- `pending_recommendations` - Recommendations awaiting user response

### Functions Available
- `get_user_comprehensive_profile(user_id)` - Returns complete user profile as JSONB
- `search_memory_by_keywords(user_id, keywords[])` - Searches memory index by keywords

### Security Features
- **Row Level Security (RLS)** enabled on all tables
- **User-specific policies** ensure data isolation
- **Audit logging** tracks all data changes
- **Confidence scoring** for AI-generated insights

### Core Features
- **Pattern correlation** across psychological domains
- **Memory search** with keyword-based retrieval
- **Guidance system** with effectiveness tracking
- **Comprehensive profiling** across 24 psychological dimensions

## Table Summary

| Category | Tables | Purpose |
|----------|--------|---------|
| **Core Profile** | 24 tables | Comprehensive psychological profiling |
| **AI Functionality** | 3 tables | Pattern recognition and guidance |
| **System Support** | 2 tables | Logging and diary entries |
| **Total** | **29 tables** | Focused personal AI memory system |

This schema provides a clean, focused foundation for building AI systems that can deeply understand users based on comprehensive personal data while maintaining simplicity, privacy, and security. Perfect for personal projects using free AI models without unnecessary complexity.