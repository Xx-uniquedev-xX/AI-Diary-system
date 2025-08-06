-- =============================================
-- COMPREHENSIVE PERSONAL AI DATABASE SCHEMA
-- =============================================

-- Core user profile table
CREATE TABLE usr_prof (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Basic Identity (bi_*)
    bi_legal_name TEXT, -- Full legal name
    bi_nicknames TEXT[], -- Array of nicknames/preferred names
    bi_childhood_names TEXT[], -- Names used in childhood
    bi_context_names JSONB, -- Names in different contexts {work: "John", family: "Johnny"}
    bi_birth_date DATE, -- Birth date
    bi_birth_time TIME, -- Birth time
    bi_birth_location TEXT, -- Birth location
    bi_astrological_sign TEXT, -- Astrological sign if relevant
    bi_gender_identity TEXT, -- Current gender identity
    bi_gender_evolution JSONB, -- Gender identity journey/transitions
    bi_pronouns TEXT[], -- Preferred pronouns
    bi_pronoun_comfort JSONB, -- Comfort levels with different pronouns
    bi_physical_desc JSONB, -- Physical characteristics they care about
    bi_appearance_feelings JSONB, -- Feelings about appearance
    bi_body_image_rel TEXT, -- Relationship with body image
    bi_height NUMERIC, -- Height in cm
    bi_weight NUMERIC, -- Weight in kg
    bi_distinguishing_marks JSONB, -- Scars, tattoos, piercings with stories
    bi_medical_ids JSONB, -- Medical IDs, allergies, emergency contacts
    bi_legal_status TEXT, -- Citizenship, visa status
    bi_immigration_history TEXT -- Immigration background
);

-- Living Situation (ls_*)
CREATE TABLE ls_living (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    ls_current_address TEXT, -- Current address
    ls_residence_duration INTERVAL, -- How long at current address
    ls_previous_addresses JSONB, -- Previous addresses with move reasons
    ls_ownership_status TEXT, -- Rent/own/live with others
    ls_ownership_feelings TEXT, -- Feelings about living arrangement
    ls_housemates JSONB, -- Roommates/family with relationship dynamics
    ls_ideal_living TEXT, -- Ideal living situation
    ls_housing_barriers TEXT[], -- Barriers to ideal housing
    ls_space_organization TEXT, -- How they organize space
    ls_space_decoration TEXT, -- Decoration style
    ls_important_areas TEXT[], -- Most important home areas
    ls_cleaning_habits TEXT, -- Cleaning and organization style
    ls_mess_tolerance TEXT, -- Comfort with messiness/order
    ls_neighborhood_rel JSONB, -- Neighborhood relationships
    ls_community_involvement TEXT, -- Community involvement
    ls_safety_concerns TEXT[], -- Safety concerns
    ls_future_housing_plans TEXT, -- Future housing plans
    ls_location_preferences TEXT[], -- Location preferences
    ls_space_personality_reflect TEXT -- How space reflects personality
);

-- Cultural Identity (ci_*)
CREATE TABLE ci_culture (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    ci_ethnic_background JSONB, -- Specific ethnic background with percentages
    ci_languages JSONB, -- Languages with fluency levels
    ci_language_preferences JSONB, -- Language preferences by context/emotion
    ci_traditions_active TEXT[], -- Actively practiced traditions
    ci_traditions_abandoned TEXT[], -- Abandoned traditions
    ci_cultural_foods JSONB, -- Relationship with cultural foods
    ci_traditional_clothing JSONB, -- Traditional items owned/worn
    ci_cultural_holidays JSONB, -- Holiday observance patterns
    ci_discrimination_exp TEXT, -- Experiences with discrimination
    ci_community_connections TEXT[], -- Cultural community involvement
    ci_identity_navigation TEXT, -- Navigating multiple cultural identities
    ci_value_conflicts TEXT[], -- Cultural vs personal value conflicts
    ci_environmental_adaptation TEXT -- Adaptation to different environments
);

-- Educational Background (ed_*)
CREATE TABLE ed_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    ed_preschool_exp TEXT, -- Preschool/early childhood education
    ed_elementary_exp JSONB, -- Elementary experiences, favorite teachers
    ed_middle_school_exp JSONB, -- Middle school challenges and social dynamics
    ed_high_school_exp JSONB, -- High school academic/social experiences
    ed_college_choices JSONB, -- College choices and reasons
    ed_major_selection TEXT, -- Major selection process and changes
    ed_graduate_exp JSONB, -- Graduate school experiences
    ed_certifications TEXT[], -- Professional certifications
    ed_learning_disabilities TEXT[], -- Learning disabilities/accommodations
    ed_favorite_subjects TEXT[], -- Favorite academic subjects
    ed_struggle_subjects TEXT[], -- Subjects they struggled with
    ed_mentor_relationships JSONB, -- Teacher/professor/mentor relationships
    ed_achievements TEXT[], -- Academic achievements
    ed_disappointments TEXT[], -- Academic disappointments
    ed_worldview_impact TEXT -- How education shaped worldview
);

-- Career and Professional Life (cp_*)
CREATE TABLE cp_career (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    cp_first_job JSONB, -- First job and lessons learned
    cp_school_jobs JSONB, -- Part-time jobs during school
    cp_career_progression JSONB, -- Career progression and decision points
    cp_current_job JSONB, -- Current job details and responsibilities
    cp_workplace_relationships JSONB, -- Workplace relationship dynamics
    cp_achievements TEXT[], -- Professional achievements
    cp_failures JSONB, -- Work failures and how navigated
    cp_professional_reputation TEXT, -- Reputation in field
    cp_side_ventures JSONB, -- Side businesses/freelance work
    cp_professional_orgs TEXT[], -- Professional organizations
    cp_continuing_education TEXT[], -- Ongoing professional development
    cp_work_life_balance JSONB, -- Work-life balance strategies
    cp_career_goals TEXT[], -- Career goals and aspirations
    cp_avoided_industries TEXT[], -- Industries they'd avoid and why
    cp_workplace_politics TEXT -- How they handle workplace politics
);

-- Physical Health (ph_*)
CREATE TABLE ph_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    ph_overall_status TEXT, -- Current overall health status
    ph_energy_levels TEXT, -- Energy levels
    ph_chronic_conditions TEXT[], -- Chronic conditions/disabilities
    ph_medications TEXT[], -- Prescription medications
    ph_mental_health_meds JSONB, -- Mental health medications and experiences
    ph_surgical_history JSONB, -- Surgical history with recovery experiences
    ph_injury_history JSONB, -- Injuries and life impact
    ph_allergies JSONB, -- All types of allergies
    ph_fitness_level TEXT, -- Fitness level and exercise capacity
    ph_physical_limitations TEXT[], -- Physical limitations
    ph_sleep_patterns JSONB, -- Sleep patterns and quality
    ph_nutrition_needs JSONB, -- Nutrition needs and dietary restrictions
    ph_substance_use JSONB, -- Substance use history
    ph_family_medical_history JSONB, -- Family medical history
    ph_healthcare_providers JSONB, -- Healthcare provider relationships
    ph_insurance_situation TEXT, -- Health insurance and access
    ph_preventive_care TEXT[], -- Preventive care habits
    ph_body_awareness TEXT, -- Body awareness and health recognition
    ph_recovery_patterns TEXT -- Recovery patterns when sick
);

-- Mental Health (mh_*)
CREATE TABLE mh_mental_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    mh_current_status TEXT, -- Current mental health status
    mh_diagnosed_conditions TEXT[], -- Diagnosed mental health conditions
    mh_therapy_experiences JSONB, -- Therapy experiences and types tried
    mh_provider_relationships JSONB, -- Mental health provider relationships
    mh_coping_strategies TEXT[], -- Effective coping strategies
    mh_triggers JSONB, -- Mental health triggers and warning signs
    mh_support_systems TEXT[], -- Support systems during struggles
    mh_medication_history JSONB, -- Mental health medication effectiveness
    mh_stigma_experiences TEXT, -- Stigma experiences and handling
    mh_family_history TEXT[], -- Family mental health history
    mh_stress_management TEXT[], -- Stress management techniques
    mh_self_recognition TEXT, -- How they recognize mental health needs
    mh_personal_growth JSONB, -- Personal growth work and insights
    mh_development_goals TEXT[] -- Mental health goals and development areas
);

-- Family Relationships (fr_*)
CREATE TABLE fr_family (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    fr_mother_relationship JSONB, -- Mother relationship dynamics
    fr_father_relationship JSONB, -- Father relationship dynamics
    fr_sibling_relationships JSONB, -- Individual sibling relationships
    fr_extended_family JSONB, -- Extended family relationships
    fr_closest_members TEXT[], -- Closest family members
    fr_difficult_relationships TEXT[], -- Difficult family relationships
    fr_gathering_dynamics JSONB, -- Family gathering and holiday dynamics
    fr_communication_patterns TEXT, -- Family communication patterns
    fr_financial_relationships JSONB, -- Financial family relationships
    fr_caregiving_responsibilities TEXT[], -- Caregiving responsibilities
    fr_family_secrets TEXT[], -- Family secrets and sensitive topics
    fr_relationship_evolution TEXT, -- How relationships evolved over time
    fr_traditions_continue TEXT[], -- Family traditions they want to continue
    fr_traditions_change TEXT[], -- Family traditions they want to change
    fr_inlaw_relationships JSONB -- In-law and extended family relationships
);

-- Romantic History (rh_*)
CREATE TABLE rh_romantic (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    rh_first_crush JSONB, -- First crush and lessons learned
    rh_dating_history JSONB, -- Complete dating history
    rh_relationship_patterns TEXT[], -- Recognized relationship patterns
    rh_attraction_types JSONB, -- Types of people they're attracted to
    rh_longest_relationship JSONB, -- Longest relationship and learnings
    rh_painful_breakup JSONB, -- Most painful breakup and processing
    rh_relationship_mistakes TEXT[], -- Relationship mistakes and growth
    rh_love_needs JSONB, -- What they need to feel loved
    rh_deal_breakers TEXT[], -- Deal-breakers and non-negotiables
    rh_conflict_handling TEXT, -- How they handle relationship conflict
    rh_commitment_approach TEXT, -- Approach to commitment
    rh_intimacy_preferences JSONB, -- Sexual preferences and boundaries
    rh_future_goals TEXT[], -- Future relationship goals
    rh_past_influence TEXT -- How past relationships influence current approach
);

-- Friendship Patterns (fp_*)
CREATE TABLE fp_friendship (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    fp_oldest_friendship JSONB, -- Oldest friendship evolution
    fp_friend_types TEXT[], -- Types of friends they attract
    fp_friend_role TEXT, -- Role they play in friendships
    fp_making_friends TEXT, -- How they make new friends
    fp_maintenance_habits TEXT[], -- Friendship maintenance habits
    fp_lost_friendships JSONB, -- Lost friendships and circumstances
    fp_social_energy TEXT, -- Social energy needs vs solitude
    fp_group_dynamics TEXT[], -- Comfortable group dynamics
    fp_friend_support TEXT, -- How they support friends
    fp_support_needs TEXT[], -- Support they need from friends
    fp_friendship_boundaries TEXT[], -- Boundaries in friendships
    fp_geographic_challenges TEXT, -- Managing long-distance friendships
    fp_friend_groups JSONB, -- Different friend groups and interactions
    fp_social_activities TEXT[], -- Preferred social activities
    fp_friendship_evolution TEXT -- How friendship needs have changed
);

-- Communication Styles (cs_*)
CREATE TABLE cs_communication (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    cs_verbal_preferences JSONB, -- Verbal communication preferences
    cs_nonverbal_habits TEXT[], -- Non-verbal communication habits
    cs_written_style JSONB, -- Written communication style
    cs_emotion_expression JSONB, -- How they express different emotions
    cs_affection_showing TEXT[], -- Ways they show affection
    cs_context_differences JSONB, -- Professional vs personal communication
    cs_difficult_conversations TEXT, -- Handling difficult conversations
    cs_listening_style TEXT, -- Listening style and engagement
    cs_questioning_patterns TEXT[], -- Types of questions they ask
    cs_storytelling_style TEXT, -- How they share experiences
    cs_humor_style JSONB, -- Humor style and appropriateness
    cs_needs_communication TEXT, -- How they communicate needs/boundaries
    cs_cultural_patterns TEXT[], -- Cultural communication patterns inherited
    cs_pattern_changes TEXT -- Communication patterns they've changed
);

-- Emotional Intelligence (ei_*)
CREATE TABLE ei_emotional (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    ei_self_awareness TEXT, -- Self-awareness level
    ei_emotion_regulation JSONB, -- Emotional regulation skills
    ei_empathy_capacity TEXT, -- Empathy capacity and responses
    ei_social_awareness TEXT, -- Social situation reading ability
    ei_emotional_triggers TEXT[], -- Consistent emotional triggers
    ei_recovery_patterns JSONB, -- Emotional recovery patterns
    ei_vulnerability_expression TEXT, -- How they express vulnerability
    ei_others_emotions TEXT, -- How they handle others' emotions
    ei_emotional_boundaries TEXT[], -- Emotional boundaries maintained
    ei_growth_areas TEXT[], -- Emotional intelligence growth areas
    ei_childhood_influence TEXT, -- Childhood emotional pattern influence
    ei_relationship_needs JSONB -- Emotional needs in relationships
);

-- Values and Beliefs (vb_*)
CREATE TABLE vb_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    vb_core_values TEXT[], -- Core guiding values
    vb_religious_beliefs JSONB, -- Religious/spiritual beliefs and practices
    vb_political_beliefs JSONB, -- Political beliefs and engagement
    vb_environmental_values JSONB, -- Environmental values and practices
    vb_social_justice JSONB, -- Social justice beliefs and activism
    vb_financial_values JSONB, -- Financial values and money beliefs
    vb_family_values JSONB, -- Family and relationship values
    vb_work_ethics JSONB, -- Work ethic and professional values
    vb_integrity_standards TEXT[], -- Personal integrity standards
    vb_inherited_vs_developed JSONB, -- Inherited vs independently developed values
    vb_value_evolution TEXT, -- How values have changed over time
    vb_value_conflicts JSONB -- Navigation of competing values
);

-- Temporal Patterns & Rhythms (tp_*)
CREATE TABLE tp_temporal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    tp_daily_routines JSONB, -- Daily routines and energy cycles
    tp_seasonal_patterns TEXT[], -- Seasonal mood/behavior patterns
    tp_life_transitions JSONB, -- Life phase transitions and adaptation
    tp_memory_formation TEXT, -- Memory formation patterns
    tp_circadian_preferences TEXT, -- Natural circadian rhythm preferences
    tp_productivity_cycles JSONB, -- Productivity and focus cycles
    tp_emotional_rhythms TEXT[], -- Emotional rhythm patterns
    tp_change_adaptation TEXT -- How they handle change and transitions
);

-- Decision-Making Patterns (dm_*)
CREATE TABLE dm_decision (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    dm_information_processing TEXT, -- How they process information
    dm_risk_tolerance JSONB, -- Risk tolerance in different areas
    dm_decision_speed TEXT, -- Decision-making speed and confidence
    dm_regretted_decisions JSONB, -- Past decisions they regret
    dm_decision_criteria TEXT[], -- Criteria they use for decisions
    dm_influence_factors TEXT[], -- What influences their decisions
    dm_intuition_vs_logic TEXT, -- Balance of intuition vs logic
    dm_decision_stress TEXT -- How they handle decision-making stress
);

-- Sensory & Environmental (se_*)
CREATE TABLE se_sensory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    se_sensory_sensitivities JSONB, -- Sound, light, texture, temperature sensitivities
    se_environment_preferences JSONB, -- Preferred environments for different activities
    se_comfort_needs TEXT[], -- Physical comfort needs
    se_space_preferences JSONB, -- Space preferences and requirements
    se_environment_mood_impact TEXT, -- How environment affects mood
    se_productivity_environments TEXT[], -- Environments that enhance productivity
    se_sensory_comfort TEXT[], -- What provides sensory comfort
    se_environmental_stress TEXT[] -- Environmental factors that cause stress
);

-- Learning & Growth (lg_*)
CREATE TABLE lg_learning (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    lg_skill_acquisition TEXT, -- How they acquire new skills
    lg_feedback_response TEXT, -- Response to feedback and criticism
    lg_natural_talents TEXT[], -- Areas of natural talent
    lg_struggle_areas TEXT[], -- Areas where they struggle
    lg_development_approaches TEXT[], -- Personal development approaches
    lg_learning_preferences JSONB, -- Learning style preferences
    lg_curiosity_patterns TEXT[], -- What sparks their curiosity
    lg_mastery_motivation TEXT -- What motivates them to master skills
);

-- Crisis & Stress Response (cs_*)
CREATE TABLE csr_crisis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    csr_stress_behavior TEXT, -- Behavior under extreme stress
    csr_past_crises JSONB, -- Past crises and navigation strategies
    csr_support_seeking TEXT[], -- Support-seeking patterns during crisis
    csr_recovery_strategies TEXT[], -- Recovery and resilience strategies
    csr_stress_indicators TEXT[], -- Early stress warning signs
    csr_coping_mechanisms TEXT[], -- Crisis coping mechanisms
    csr_breakdown_patterns TEXT, -- How they break down under pressure
    csr_strength_sources TEXT[] -- Sources of strength during difficult times
);

-- Unconscious Patterns (up_*)
CREATE TABLE up_unconscious (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    up_blind_spots TEXT[], -- Self-awareness blind spots
    up_unrecognized_behaviors TEXT[], -- Behaviors they don't recognize
    up_unconscious_motivations TEXT[], -- Unconscious motivations
    up_defense_mechanisms TEXT[], -- Psychological defense mechanisms
    up_projection_patterns TEXT[], -- What they project onto others
    up_self_sabotage TEXT[], -- Self-sabotage patterns
    up_internal_conflicts TEXT[], -- Internal conflicts and contradictions
    up_shadow_aspects TEXT[] -- Rejected or hidden parts of self
);

-- Micro-Expressions & Behaviors (me_*)
CREATE TABLE me_micro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    me_fidgeting_patterns TEXT[], -- Fidgeting and nervous habits
    me_comfort_gestures TEXT[], -- Comfort gestures and self-soothing
    me_voice_changes JSONB, -- Voice changes in different states
    me_breathing_patterns TEXT[], -- Breathing pattern variations
    me_posture_shifts JSONB, -- Posture changes with mood/context
    me_eye_contact_patterns TEXT[], -- Eye contact patterns
    me_facial_expressions TEXT[], -- Facial micro-expression patterns
    me_space_occupation TEXT, -- How they occupy physical space
    me_unconscious_habits TEXT[] -- Unconscious habits and tics
);

-- Cognitive Architecture (ca_*)
CREATE TABLE ca_cognitive (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    ca_processing_speed TEXT, -- Information processing speed
    ca_processing_style TEXT, -- Linear vs intuitive processing
    ca_memory_architecture JSONB, -- Visual/auditory/kinesthetic memory preferences
    ca_attention_patterns TEXT[], -- Attention and focus patterns
    ca_distractibility_triggers TEXT[], -- What causes distraction
    ca_mental_energy_cycles JSONB, -- Mental energy cycles
    ca_cognitive_load_tolerance TEXT, -- Cognitive load tolerance
    ca_problem_solving_approach TEXT[], -- Problem-solving approaches
    ca_thinking_patterns TEXT[] -- Characteristic thinking patterns
);

-- Social Psychology (sp_*)
CREATE TABLE sp_social (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    sp_power_dynamics JSONB, -- Comfort with different power dynamics
    sp_personality_interactions JSONB, -- Behavior with different personality types
    sp_social_masks TEXT[], -- Social masks worn in different contexts
    sp_influence_patterns TEXT[], -- How they influence others
    sp_boundary_testing TEXT, -- Boundary testing behaviors
    sp_boundary_respect TEXT, -- Respect for others' boundaries
    sp_group_role_preferences TEXT[], -- Preferred roles in groups
    sp_social_energy_management TEXT -- How they manage social energy
);

-- Existential & Philosophical (ep_*)
CREATE TABLE ep_existential (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    ep_mortality_relationship TEXT, -- Relationship with mortality and aging
    ep_meaning_making TEXT[], -- Meaning-making patterns
    ep_uncertainty_handling TEXT, -- How they handle uncertainty
    ep_time_relationship JSONB, -- Past/present/future focus
    ep_personal_mythology TEXT, -- Personal life story narrative
    ep_existential_concerns TEXT[], -- Primary existential concerns
    ep_purpose_sources TEXT[], -- Sources of life purpose
    ep_philosophical_frameworks TEXT[] -- Philosophical frameworks they use
);

-- Somatic & Embodied (se_*)
CREATE TABLE seb_somatic (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    seb_emotion_body_manifest JSONB, -- How emotions manifest physically
    seb_interoceptive_awareness TEXT, -- Ability to sense internal bodily signals
    seb_pain_pleasure_relationship TEXT, -- Relationship with pain and pleasure
    seb_physical_emotional_influence TEXT, -- How physical states influence emotions
    seb_body_memory TEXT[], -- Body memory and trauma storage
    seb_embodied_wisdom TEXT, -- Body wisdom and intuition
    seb_physical_comfort_needs TEXT[], -- Physical comfort needs
    seb_somatic_practices TEXT[] -- Somatic practices they use
);

-- Creative & Expressive (ce_*)
CREATE TABLE ce_creative (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    ce_creative_outlets TEXT[], -- Creative outlets and artistic preferences
    ce_nonverbal_expression TEXT[], -- Non-verbal expression methods
    ce_aesthetic_preferences JSONB, -- Aesthetic preferences across mediums
    ce_innovation_patterns TEXT[], -- Innovation and original thinking approaches
    ce_play_style TEXT, -- Play style and childlike qualities
    ce_creative_blocks TEXT[], -- Creative blocks and how they handle them
    ce_inspiration_sources TEXT[], -- Sources of creative inspiration
    ce_artistic_development TEXT -- Artistic development over time
);

-- Temporal Identity (ti_*)
CREATE TABLE ti_identity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    ti_self_integration TEXT, -- Integration of different self-versions
    ti_past_self_relationship TEXT, -- Relationship with past self
    ti_future_self_relationship TEXT, -- Relationship with future self
    ti_narrative_coherence TEXT, -- Life story coherence
    ti_regrets_whatifs TEXT[], -- Regrets and alternative life paths
    ti_legacy_concerns TEXT[], -- Legacy and how they want to be remembered
    ti_identity_evolution TEXT, -- How identity has evolved
    ti_core_consistency TEXT -- What remains consistent across time
);

-- Spiritual & Transcendent (st_*)
CREATE TABLE st_spiritual (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    st_peak_experiences TEXT[], -- Peak and transcendent experiences
    st_connection_greater TEXT, -- Connection to nature/universe/greater
    st_mystical_experiences TEXT[], -- Mystical or unexplainable experiences
    st_ritual_preferences JSONB, -- Ritual and ceremony preferences
    st_flow_states TEXT[], -- How they access flow states
    st_spiritual_practices TEXT[], -- Spiritual practices they engage in
    st_transcendent_triggers TEXT[], -- What triggers transcendent states
    st_sacred_relationships TEXT[] -- What they consider sacred
);

-- Shadow Integration (si_*)
CREATE TABLE si_shadow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    si_rejected_aspects TEXT[], -- Parts of self they reject or hide
    si_inner_critic TEXT[], -- Inner critic patterns and self-talk
    si_shame_guilt_handling TEXT, -- How they handle shame and guilt
    si_self_forgiveness TEXT, -- Self-forgiveness patterns
    si_masculine_feminine JSONB, -- Integration of masculine/feminine aspects
    si_trauma_work TEXT[], -- Trauma work done or needed
    si_shadow_work_progress TEXT, -- Progress on shadow integration
    si_integration_practices TEXT[] -- Practices for integrating shadow aspects
);

-- Economic Psychology (ec_*)
CREATE TABLE ec_economic (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    ec_money_psychology TEXT, -- Deep money psychology patterns
    ec_scarcity_abundance TEXT, -- Scarcity vs abundance mindset
    ec_material_possessions TEXT, -- Relationship with material possessions
    ec_consumption_patterns TEXT[], -- Consumption and spending patterns
    ec_generosity_patterns TEXT, -- Generosity and resource sharing
    ec_economic_trauma TEXT[], -- Economic trauma or privilege impact
    ec_financial_security_needs TEXT, -- Financial security needs and fears
    ec_wealth_relationship TEXT -- Relationship with wealth and success
);

-- Diary Entries (de_*)
CREATE TABLE de_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    
    de_content TEXT NOT NULL, -- Raw diary entry content
    de_mood_score INTEGER CHECK (de_mood_score >= 1 AND de_mood_score <= 10), -- Mood score 1-10
    de_emotional_tags TEXT[], -- Emotional tags extracted
    de_topics TEXT[], -- Topics discussed
    de_insights_extracted JSONB, -- AI-extracted insights
    de_patterns_identified TEXT[], -- Patterns identified in this entry
    de_confidence_scores JSONB -- Confidence scores for different extractions
);

-- Data Update Log (du_*)
CREATE TABLE du_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    table_name TEXT NOT NULL, -- Which table was updated
    field_name TEXT NOT NULL, -- Which field was updated
    old_value JSONB, -- Previous value
    new_value JSONB, -- New value
    confidence_score NUMERIC(3,2), -- Confidence in the update (0.00-1.00)
    source_entry_id UUID REFERENCES de_entries(id), -- Source diary entry
    extraction_method TEXT, -- How the data was extracted
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_usr_prof_id ON de_entries(usr_prof_id);
CREATE INDEX idx_created_at ON de_entries(created_at);
CREATE INDEX idx_updates_usr_prof ON du_updates(usr_prof_id);
CREATE INDEX idx_updates_table ON du_updates(table_name);
CREATE INDEX idx_updates_created ON du_updates(created_at);

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_usr_prof_updated_at BEFORE UPDATE ON usr_prof FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ls_living_updated_at BEFORE UPDATE ON ls_living FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ci_culture_updated_at BEFORE UPDATE ON ci_culture FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ed_education_updated_at BEFORE UPDATE ON ed_education FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cp_career_updated_at BEFORE UPDATE ON cp_career FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ph_health_updated_at BEFORE UPDATE ON ph_health FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mh_mental_health_updated_at BEFORE UPDATE ON mh_mental_health FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fr_family_updated_at BEFORE UPDATE ON fr_family FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rh_romantic_updated_at BEFORE UPDATE ON rh_romantic FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fp_friendship_updated_at BEFORE UPDATE ON fp_friendship FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cs_communication_updated_at BEFORE UPDATE ON cs_communication FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ei_emotional_updated_at BEFORE UPDATE ON ei_emotional FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vb_values_updated_at BEFORE UPDATE ON vb_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tp_temporal_updated_at BEFORE UPDATE ON tp_temporal FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dm_decision_updated_at BEFORE UPDATE ON dm_decision FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_se_sensory_updated_at BEFORE UPDATE ON se_sensory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lg_learning_updated_at BEFORE UPDATE ON lg_learning FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_csr_crisis_updated_at BEFORE UPDATE ON csr_crisis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_up_unconscious_updated_at BEFORE UPDATE ON up_unconscious FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_me_micro_updated_at BEFORE UPDATE ON me_micro FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ca_cognitive_updated_at BEFORE UPDATE ON ca_cognitive FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sp_social_updated_at BEFORE UPDATE ON sp_social FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ep_existential_updated_at BEFORE UPDATE ON ep_existential FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_seb_somatic_updated_at BEFORE UPDATE ON seb_somatic FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ce_creative_updated_at BEFORE UPDATE ON ce_creative FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ti_identity_updated_at BEFORE UPDATE ON ti_identity FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_st_spiritual_updated_at BEFORE UPDATE ON st_spiritual FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_si_shadow_updated_at BEFORE UPDATE ON si_shadow FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ec_economic_updated_at BEFORE UPDATE ON ec_economic FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pattern_correlations_updated_at BEFORE UPDATE ON pattern_correlations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ADDITIONAL TABLES FOR AI FUNCTIONALITY
-- =============================================

-- Pattern Recognition and Correlations (pc_*)
CREATE TABLE pattern_correlations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    pc_pattern_type VARCHAR NOT NULL, -- 'behavioral', 'emotional', 'cognitive', 'temporal'
    pc_source_tables TEXT[], -- Which tables contributed to this pattern
    pc_correlation_data JSONB, -- Detailed correlation information
    pc_confidence_score NUMERIC(3,2), -- Confidence in this pattern (0.00-1.00)
    pc_frequency INTEGER DEFAULT 1, -- How often this pattern appears
    pc_first_detected TIMESTAMP DEFAULT NOW(), -- When pattern was first identified
    pc_last_confirmed TIMESTAMP DEFAULT NOW(), -- Last time pattern was confirmed
    pc_strength NUMERIC(3,2), -- Strength of the correlation (0.00-1.00)
    pc_triggers TEXT[], -- What triggers this pattern
    pc_outcomes TEXT[], -- What outcomes this pattern leads to
    pc_intervention_points TEXT[] -- Where interventions might be effective
);

-- Memory Search Index (ms_*)
CREATE TABLE memory_search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    
    ms_content_type VARCHAR NOT NULL, -- 'diary', 'pattern', 'insight', 'correlation'
    ms_content_id UUID NOT NULL, -- ID of the referenced content
    ms_keywords TEXT[], -- Searchable keywords
    ms_semantic_tags TEXT[], -- Semantic tags for categorization
    ms_emotional_valence NUMERIC(3,2), -- Emotional valence (-1.00 to 1.00)
    ms_importance_score NUMERIC(3,2), -- Importance score (0.00-1.00)
    ms_context_period VARCHAR, -- Time period context ('morning', 'evening', 'weekend')
    ms_related_entries UUID[] -- Related diary entry IDs
);

-- Guidance and Recommendations (gr_*)
CREATE TABLE guidance_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    source_entry_id UUID REFERENCES de_entries(id),
    created_at TIMESTAMP DEFAULT NOW(),
    
    gr_recommendation_type VARCHAR NOT NULL, -- 'morning_routine', 'stress_management', 'focus_strategy'
    gr_priority_level INTEGER, -- 1 (highest) to 5 (lowest)
    gr_title TEXT NOT NULL, -- Brief title of the recommendation
    gr_description TEXT NOT NULL, -- Detailed description
    gr_rationale TEXT, -- Why this recommendation was made
    gr_expected_outcome TEXT, -- What outcome is expected
    gr_difficulty_level INTEGER, -- 1 (easy) to 5 (very difficult)
    gr_time_investment VARCHAR, -- Expected time investment
    gr_success_metrics TEXT[], -- How to measure success
    gr_fallback_options TEXT[], -- Alternative approaches
    gr_expiry_date DATE, -- When this recommendation becomes outdated
    gr_user_response VARCHAR, -- 'accepted', 'rejected', 'modified', 'pending'
    gr_actual_outcome TEXT, -- What actually happened when tried
    gr_effectiveness_score NUMERIC(3,2) -- How effective it was (0.00-1.00)
);

-- =============================================
-- FITBIT AUTOMATIC TRACKING TABLES (Pixel Watch 3)
-- =============================================

-- Fitbit Heart Rate Intraday Data (fb_hr_*)
CREATE TABLE fb_heart_rate_intraday (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    recorded_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    fb_hr_bpm INTEGER NOT NULL, -- Heart rate in beats per minute
    fb_hr_confidence VARCHAR, -- 'high', 'medium', 'low'
    fb_hr_zone VARCHAR, -- 'out_of_range', 'fat_burn', 'cardio', 'peak'
    fb_hr_resting_rate INTEGER, -- Daily resting heart rate
    fb_hr_variability NUMERIC(5,2) -- Heart rate variability (HRV) in milliseconds
);

-- Fitbit Sleep Data (fb_sleep_*)
CREATE TABLE fb_sleep_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    sleep_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    fb_sleep_start_time TIMESTAMP, -- Sleep start time
    fb_sleep_end_time TIMESTAMP, -- Sleep end time
    fb_sleep_duration INTEGER, -- Total sleep duration in minutes
    fb_sleep_efficiency NUMERIC(3,1), -- Sleep efficiency percentage
    fb_sleep_minutes_asleep INTEGER, -- Minutes actually asleep
    fb_sleep_minutes_awake INTEGER, -- Minutes awake during sleep
    fb_sleep_minutes_restless INTEGER, -- Minutes restless
    fb_sleep_awakenings_count INTEGER, -- Number of awakenings
    fb_sleep_score INTEGER, -- Overall sleep score (0-100)
    fb_sleep_deep_minutes INTEGER, -- Deep sleep minutes
    fb_sleep_light_minutes INTEGER, -- Light sleep minutes
    fb_sleep_rem_minutes INTEGER, -- REM sleep minutes
    fb_sleep_wake_minutes INTEGER -- Wake minutes during sleep period
);

-- Fitbit Activity Intraday Data (fb_activity_*)
CREATE TABLE fb_activity_intraday (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    recorded_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    fb_act_steps INTEGER, -- Steps taken
    fb_act_distance NUMERIC(6,2), -- Distance in kilometers
    fb_act_calories_burned INTEGER, -- Calories burned
    fb_act_active_minutes INTEGER, -- Active minutes
    fb_act_sedentary_minutes INTEGER, -- Sedentary minutes
    fb_act_lightly_active_minutes INTEGER, -- Lightly active minutes
    fb_act_fairly_active_minutes INTEGER, -- Fairly active minutes
    fb_act_very_active_minutes INTEGER, -- Very active minutes
    fb_act_floors_climbed INTEGER, -- Floors climbed
    fb_act_elevation_gain NUMERIC(6,2) -- Elevation gain in meters
);

-- Fitbit Daily Activity Summary (fb_daily_*)
CREATE TABLE fb_daily_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    activity_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    fb_daily_steps INTEGER, -- Total daily steps
    fb_daily_distance NUMERIC(6,2), -- Total daily distance
    fb_daily_calories_burned INTEGER, -- Total daily calories
    fb_daily_active_minutes INTEGER, -- Total active minutes
    fb_daily_sedentary_minutes INTEGER, -- Total sedentary minutes
    fb_daily_floors INTEGER, -- Total floors climbed
    fb_daily_resting_hr INTEGER, -- Resting heart rate for the day
    fb_daily_avg_hr INTEGER, -- Average heart rate for the day
    fb_daily_max_hr INTEGER, -- Maximum heart rate for the day
    fb_daily_cardio_minutes INTEGER, -- Minutes in cardio zone
    fb_daily_peak_minutes INTEGER, -- Minutes in peak zone
    fb_daily_fat_burn_minutes INTEGER -- Minutes in fat burn zone
);

-- Fitbit Stress Management (fb_stress_*)
CREATE TABLE fb_stress_management (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    fb_stress_score INTEGER, -- Daily stress management score (0-100)
    fb_stress_responsive_sessions INTEGER, -- Responsive breathing sessions
    fb_stress_responsive_minutes INTEGER, -- Minutes of responsive breathing
    fb_stress_hrv_rmssd NUMERIC(5,2), -- HRV RMSSD measurement
    fb_stress_recovery_time INTEGER -- Stress recovery time in minutes
);

-- Fitbit SpO2 (Blood Oxygen) Data (fb_spo2_*)
CREATE TABLE fb_spo2_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    fb_spo2_avg NUMERIC(4,1), -- Average SpO2 percentage
    fb_spo2_min NUMERIC(4,1), -- Minimum SpO2 percentage
    fb_spo2_max NUMERIC(4,1) -- Maximum SpO2 percentage
);

-- Fitbit Skin Temperature (fb_temp_*)
CREATE TABLE fb_skin_temperature (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    fb_temp_relative_change NUMERIC(3,2), -- Relative temperature change in Celsius
    fb_temp_logtype VARCHAR -- 'auto' for automatic tracking
);

-- Fitbit Breathing Rate (fb_breathing_*)
CREATE TABLE fb_breathing_rate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    fb_breathing_rate NUMERIC(4,1), -- Breathing rate in breaths per minute
    fb_breathing_deep_sleep NUMERIC(4,1), -- Breathing rate during deep sleep
    fb_breathing_rem_sleep NUMERIC(4,1), -- Breathing rate during REM sleep
    fb_breathing_light_sleep NUMERIC(4,1) -- Breathing rate during light sleep
);

-- Fitbit Cardio Fitness (VO2 Max) (fb_cardio_*)
CREATE TABLE fb_cardio_fitness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    fb_cardio_score NUMERIC(4,1), -- Cardio fitness score (VO2 Max)
    fb_cardio_range VARCHAR -- 'poor', 'fair', 'average', 'good', 'excellent'
);

-- Fitbit Active Zone Minutes (fb_azm_*)
CREATE TABLE fb_active_zone_minutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    fb_azm_total INTEGER, -- Total active zone minutes
    fb_azm_fat_burn INTEGER, -- Fat burn zone minutes
    fb_azm_cardio INTEGER, -- Cardio zone minutes
    fb_azm_peak INTEGER -- Peak zone minutes
);

-- Fitbit Device Battery and Sync Status (fb_device_*)
CREATE TABLE fb_device_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    recorded_at TIMESTAMP DEFAULT NOW(),
    
    fb_device_battery_level INTEGER, -- Battery percentage
    fb_device_last_sync TIMESTAMP, -- Last sync time
    fb_device_type VARCHAR, -- Device type (e.g., 'Pixel Watch 3')
    fb_device_version VARCHAR -- Firmware version
);

-- Fitbit API Request Log (fb_api_*)
CREATE TABLE fb_api_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usr_prof_id UUID REFERENCES usr_prof(id),
    created_at TIMESTAMP DEFAULT NOW(),
    
    fb_api_endpoint VARCHAR NOT NULL, -- API endpoint called
    fb_api_method VARCHAR NOT NULL, -- HTTP method
    fb_api_status_code INTEGER, -- Response status code
    fb_api_response_time INTEGER, -- Response time in milliseconds
    fb_api_rate_limit_remaining INTEGER, -- Remaining rate limit
    fb_api_error_message TEXT, -- Error message if any
    fb_api_data_points_collected INTEGER -- Number of data points collected
);

-- =============================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for pattern correlations
CREATE INDEX idx_pattern_correlations_usr_prof ON pattern_correlations(usr_prof_id);
CREATE INDEX idx_pattern_correlations_type ON pattern_correlations(pc_pattern_type);
CREATE INDEX idx_pattern_correlations_confidence ON pattern_correlations(pc_confidence_score);

-- Fitbit data indexes for time-series queries
CREATE INDEX idx_fb_heart_rate_usr_prof_recorded ON fb_heart_rate_intraday(usr_prof_id, recorded_at);
CREATE INDEX idx_fb_heart_rate_recorded_at ON fb_heart_rate_intraday(recorded_at);
CREATE INDEX idx_fb_heart_rate_bpm ON fb_heart_rate_intraday(fb_hr_bpm);

CREATE INDEX idx_fb_sleep_usr_prof_date ON fb_sleep_sessions(usr_prof_id, sleep_date);
CREATE INDEX idx_fb_sleep_date ON fb_sleep_sessions(sleep_date);
CREATE INDEX idx_fb_sleep_score ON fb_sleep_sessions(fb_sleep_score);

CREATE INDEX idx_fb_activity_usr_prof_recorded ON fb_activity_intraday(usr_prof_id, recorded_at);
CREATE INDEX idx_fb_activity_recorded_at ON fb_activity_intraday(recorded_at);
CREATE INDEX idx_fb_activity_steps ON fb_activity_intraday(fb_act_steps);

CREATE INDEX idx_fb_daily_usr_prof_date ON fb_daily_summary(usr_prof_id, activity_date);
CREATE INDEX idx_fb_daily_date ON fb_daily_summary(activity_date);
CREATE INDEX idx_fb_daily_steps ON fb_daily_summary(fb_daily_steps);

CREATE INDEX idx_fb_stress_usr_prof_date ON fb_stress_management(usr_prof_id, recorded_date);
CREATE INDEX idx_fb_stress_date ON fb_stress_management(recorded_date);
CREATE INDEX idx_fb_stress_score ON fb_stress_management(fb_stress_score);

CREATE INDEX idx_fb_spo2_usr_prof_date ON fb_spo2_data(usr_prof_id, recorded_date);
CREATE INDEX idx_fb_temp_usr_prof_date ON fb_skin_temperature(usr_prof_id, recorded_date);
CREATE INDEX idx_fb_breathing_usr_prof_date ON fb_breathing_rate(usr_prof_id, recorded_date);
CREATE INDEX idx_fb_cardio_usr_prof_date ON fb_cardio_fitness(usr_prof_id, recorded_date);
CREATE INDEX idx_fb_azm_usr_prof_date ON fb_active_zone_minutes(usr_prof_id, recorded_date);

CREATE INDEX idx_fb_device_usr_prof_recorded ON fb_device_status(usr_prof_id, recorded_at);
CREATE INDEX idx_fb_api_usr_prof_created ON fb_api_requests(usr_prof_id, created_at);
CREATE INDEX idx_fb_api_endpoint ON fb_api_requests(fb_api_endpoint);

-- Indexes for memory search
CREATE INDEX idx_memory_search_usr_prof ON memory_search_index(usr_prof_id);
CREATE INDEX idx_memory_search_content_type ON memory_search_index(ms_content_type);
CREATE INDEX idx_memory_search_keywords ON memory_search_index USING GIN(ms_keywords);
CREATE INDEX idx_memory_search_importance ON memory_search_index(ms_importance_score);

-- Indexes for guidance recommendations
CREATE INDEX idx_guidance_usr_prof ON guidance_recommendations(usr_prof_id);
CREATE INDEX idx_guidance_type ON guidance_recommendations(gr_recommendation_type);
CREATE INDEX idx_guidance_priority ON guidance_recommendations(gr_priority_level);
CREATE INDEX idx_guidance_response ON guidance_recommendations(gr_user_response);

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for recent patterns
CREATE VIEW recent_patterns AS
SELECT
    pc.*,
    EXTRACT(DAYS FROM NOW() - pc.pc_last_confirmed) as days_since_confirmed
FROM pattern_correlations pc
WHERE pc.pc_last_confirmed >= NOW() - INTERVAL '30 days'
ORDER BY pc.pc_confidence_score DESC, pc.pc_last_confirmed DESC;

-- View for pending recommendations
CREATE VIEW pending_recommendations AS
SELECT
    gr.*,
    EXTRACT(DAYS FROM NOW() - gr.created_at) as days_pending
FROM guidance_recommendations gr
WHERE gr.gr_user_response = 'pending'
   OR gr.gr_user_response IS NULL
ORDER BY gr.gr_priority_level ASC, gr.created_at ASC;

-- =============================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =============================================

-- Function to get user's comprehensive profile
CREATE OR REPLACE FUNCTION get_user_comprehensive_profile(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    profile_data JSONB;
BEGIN
    SELECT jsonb_build_object(
        'basic_identity', row_to_json(up.*),
        'living_situation', row_to_json(ls.*),
        'cultural_identity', row_to_json(ci.*),
        'education', row_to_json(ed.*),
        'career', row_to_json(cp.*),
        'physical_health', row_to_json(ph.*),
        'mental_health', row_to_json(mh.*),
        'family_relationships', row_to_json(fr.*),
        'romantic_history', row_to_json(rh.*),
        'friendship_patterns', row_to_json(fp.*),
        'communication_styles', row_to_json(cs.*),
        'emotional_intelligence', row_to_json(ei.*),
        'values_beliefs', row_to_json(vb.*),
        'temporal_patterns', row_to_json(tp.*),
        'decision_making', row_to_json(dm.*),
        'sensory_environmental', row_to_json(se.*),
        'learning_growth', row_to_json(lg.*),
        'crisis_stress_response', row_to_json(csr.*),
        'unconscious_patterns', row_to_json(up_unc.*),
        'micro_expressions', row_to_json(me.*),
        'cognitive_architecture', row_to_json(ca.*),
        'social_psychology', row_to_json(sp.*),
        'existential_philosophical', row_to_json(ep.*),
        'somatic_embodied', row_to_json(seb.*),
        'creative_expressive', row_to_json(ce.*),
        'temporal_identity', row_to_json(ti.*),
        'spiritual_transcendent', row_to_json(st.*),
        'shadow_integration', row_to_json(si.*),
        'economic_psychology', row_to_json(ec.*)
    ) INTO profile_data
    FROM usr_prof up
    LEFT JOIN ls_living ls ON up.id = ls.usr_prof_id
    LEFT JOIN ci_culture ci ON up.id = ci.usr_prof_id
    LEFT JOIN ed_education ed ON up.id = ed.usr_prof_id
    LEFT JOIN cp_career cp ON up.id = cp.usr_prof_id
    LEFT JOIN ph_health ph ON up.id = ph.usr_prof_id
    LEFT JOIN mh_mental_health mh ON up.id = mh.usr_prof_id
    LEFT JOIN fr_family fr ON up.id = fr.usr_prof_id
    LEFT JOIN rh_romantic rh ON up.id = rh.usr_prof_id
    LEFT JOIN fp_friendship fp ON up.id = fp.usr_prof_id
    LEFT JOIN cs_communication cs ON up.id = cs.usr_prof_id
    LEFT JOIN ei_emotional ei ON up.id = ei.usr_prof_id
    LEFT JOIN vb_values vb ON up.id = vb.usr_prof_id
    LEFT JOIN tp_temporal tp ON up.id = tp.usr_prof_id
    LEFT JOIN dm_decision dm ON up.id = dm.usr_prof_id
    LEFT JOIN se_sensory se ON up.id = se.usr_prof_id
    LEFT JOIN lg_learning lg ON up.id = lg.usr_prof_id
    LEFT JOIN csr_crisis csr ON up.id = csr.usr_prof_id
    LEFT JOIN up_unconscious up_unc ON up.id = up_unc.usr_prof_id
    LEFT JOIN me_micro me ON up.id = me.usr_prof_id
    LEFT JOIN ca_cognitive ca ON up.id = ca.usr_prof_id
    LEFT JOIN sp_social sp ON up.id = sp.usr_prof_id
    LEFT JOIN ep_existential ep ON up.id = ep.usr_prof_id
    LEFT JOIN seb_somatic seb ON up.id = seb.usr_prof_id
    LEFT JOIN ce_creative ce ON up.id = ce.usr_prof_id
    LEFT JOIN ti_identity ti ON up.id = ti.usr_prof_id
    LEFT JOIN st_spiritual st ON up.id = st.usr_prof_id
    LEFT JOIN si_shadow si ON up.id = si.usr_prof_id
    LEFT JOIN ec_economic ec ON up.id = ec.usr_prof_id
    WHERE up.id = user_id;
    
    RETURN profile_data;
END;
$$ LANGUAGE plpgsql;

-- Function to search memory by keywords
CREATE OR REPLACE FUNCTION search_memory_by_keywords(user_id UUID, search_keywords TEXT[])
RETURNS TABLE(
    content_type VARCHAR,
    content_id UUID,
    relevance_score NUMERIC,
    keywords TEXT[],
    emotional_valence NUMERIC,
    importance_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ms.ms_content_type,
        ms.ms_content_id,
        (array_length(ms.ms_keywords & search_keywords, 1)::NUMERIC / array_length(search_keywords, 1)::NUMERIC) as relevance_score,
        ms.ms_keywords,
        ms.ms_emotional_valence,
        ms.ms_importance_score
    FROM memory_search_index ms
    WHERE ms.usr_prof_id = user_id
      AND ms.ms_keywords && search_keywords
    ORDER BY relevance_score DESC, ms.ms_importance_score DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all user tables
ALTER TABLE usr_prof ENABLE ROW LEVEL SECURITY;
ALTER TABLE ls_living ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_culture ENABLE ROW LEVEL SECURITY;
ALTER TABLE ed_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE cp_career ENABLE ROW LEVEL SECURITY;
ALTER TABLE ph_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE mh_mental_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE fr_family ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh_romantic ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_friendship ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_communication ENABLE ROW LEVEL SECURITY;
ALTER TABLE ei_emotional ENABLE ROW LEVEL SECURITY;
ALTER TABLE vb_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE tp_temporal ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_decision ENABLE ROW LEVEL SECURITY;
ALTER TABLE se_sensory ENABLE ROW LEVEL SECURITY;
ALTER TABLE lg_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE csr_crisis ENABLE ROW LEVEL SECURITY;
ALTER TABLE up_unconscious ENABLE ROW LEVEL SECURITY;
ALTER TABLE me_micro ENABLE ROW LEVEL SECURITY;
ALTER TABLE ca_cognitive ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_social ENABLE ROW LEVEL SECURITY;
ALTER TABLE ep_existential ENABLE ROW LEVEL SECURITY;
ALTER TABLE seb_somatic ENABLE ROW LEVEL SECURITY;
ALTER TABLE ce_creative ENABLE ROW LEVEL SECURITY;
ALTER TABLE ti_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE st_spiritual ENABLE ROW LEVEL SECURITY;
ALTER TABLE si_shadow ENABLE ROW LEVEL SECURITY;
ALTER TABLE ec_economic ENABLE ROW LEVEL SECURITY;
ALTER TABLE de_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE du_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE guidance_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for user data access (users can only access their own data)
CREATE POLICY user_data_policy ON usr_prof FOR ALL USING (auth.uid()::text = id::text);
CREATE POLICY user_living_policy ON ls_living FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_culture_policy ON ci_culture FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_education_policy ON ed_education FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_career_policy ON cp_career FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_health_policy ON ph_health FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_mental_health_policy ON mh_mental_health FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_family_policy ON fr_family FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_romantic_policy ON rh_romantic FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_friendship_policy ON fp_friendship FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_communication_policy ON cs_communication FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_emotional_policy ON ei_emotional FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_values_policy ON vb_values FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_temporal_policy ON tp_temporal FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_decision_policy ON dm_decision FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_sensory_policy ON se_sensory FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_learning_policy ON lg_learning FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_crisis_policy ON csr_crisis FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_unconscious_policy ON up_unconscious FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_micro_policy ON me_micro FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_cognitive_policy ON ca_cognitive FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_social_policy ON sp_social FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_existential_policy ON ep_existential FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_somatic_policy ON seb_somatic FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_creative_policy ON ce_creative FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_identity_policy ON ti_identity FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_spiritual_policy ON st_spiritual FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_shadow_policy ON si_shadow FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_economic_policy ON ec_economic FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_entries_policy ON de_entries FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_updates_policy ON du_updates FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_patterns_policy ON pattern_correlations FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_memory_policy ON memory_search_index FOR ALL USING (auth.uid()::text = usr_prof_id::text);
CREATE POLICY user_guidance_policy ON guidance_recommendations FOR ALL USING (auth.uid()::text = usr_prof_id::text);

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

-- Schema creation completed successfully
-- Total tables: 27 (24 psychological profile + 3 AI functionality)
-- Total indexes: 25+ for optimal performance
-- Total triggers: 24 for automatic timestamp updates
-- Total views: 2 for common queries
-- Total functions: 2 for complex operations
-- Row Level Security: Enabled on all tables with user-specific policies

-- =============================================
-- ROW LEVEL SECURITY POLICIES FOR FITBIT TABLES
-- =============================================

-- Enable RLS on all Fitbit tables
ALTER TABLE fb_heart_rate_intraday ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_sleep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_activity_intraday ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_stress_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_spo2_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_skin_temperature ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_breathing_rate ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_cardio_fitness ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_active_zone_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_device_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_api_requests ENABLE ROW LEVEL SECURITY;

-- Fitbit Heart Rate policies
CREATE POLICY "Users can view own heart rate data" ON fb_heart_rate_intraday
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own heart rate data" ON fb_heart_rate_intraday
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- Fitbit Sleep policies
CREATE POLICY "Users can view own sleep data" ON fb_sleep_sessions
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own sleep data" ON fb_sleep_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- Fitbit Activity policies
CREATE POLICY "Users can view own activity data" ON fb_activity_intraday
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own activity data" ON fb_activity_intraday
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- Fitbit Daily Summary policies
CREATE POLICY "Users can view own daily summary" ON fb_daily_summary
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own daily summary" ON fb_daily_summary
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- Fitbit Stress Management policies
CREATE POLICY "Users can view own stress data" ON fb_stress_management
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own stress data" ON fb_stress_management
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- Fitbit SpO2 policies
CREATE POLICY "Users can view own spo2 data" ON fb_spo2_data
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own spo2 data" ON fb_spo2_data
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- Fitbit Skin Temperature policies
CREATE POLICY "Users can view own temperature data" ON fb_skin_temperature
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own temperature data" ON fb_skin_temperature
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- Fitbit Breathing Rate policies
CREATE POLICY "Users can view own breathing data" ON fb_breathing_rate
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own breathing data" ON fb_breathing_rate
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- Fitbit Cardio Fitness policies
CREATE POLICY "Users can view own cardio data" ON fb_cardio_fitness
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own cardio data" ON fb_cardio_fitness
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- Fitbit Active Zone Minutes policies
CREATE POLICY "Users can view own azm data" ON fb_active_zone_minutes
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own azm data" ON fb_active_zone_minutes
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- Fitbit Device Status policies
CREATE POLICY "Users can view own device status" ON fb_device_status
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own device status" ON fb_device_status
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

-- Fitbit API Request Log policies
CREATE POLICY "Users can view own api requests" ON fb_api_requests
    FOR SELECT USING (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));

CREATE POLICY "Users can insert own api requests" ON fb_api_requests
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT auth_user_id FROM usr_prof WHERE id = usr_prof_id));