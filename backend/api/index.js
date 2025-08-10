// ============================================================================
// IMPORTING REQUIRED LIBRARIES
// ============================================================================
// These are external libraries that provide functionality we need

const express = require('express');        // Creates web server and handles HTTP requests
const router = express.Router();           // Helps organize different web page routes
const fs = require('fs-extra');           // File system operations (reading/writing files)
const path = require('path');             // Helps work with file and folder paths
const axios = require('axios');           // Makes HTTP requests to other websites/APIs
const crypto = require('crypto');         // Provides security functions for OAuth

// ============================================================================
// SETTING UP FILE STORAGE
// ============================================================================
// We need a place to save all the AI responses and data

// Create a folder called 'ai_outputs' in the same directory as this script
// This is where we'll store all the results from our AI processing
const OUTPUTS_DIR = path.join(__dirname, 'ai_outputs');

// Make sure the outputs directory exists when the server starts
// If it doesn't exist, create it automatically
fs.ensureDirSync(OUTPUTS_DIR);

// ============================================================================
// SUPABASE DATABASE CONNECTION (using aromabless pattern)
// ============================================================================
// Import Supabase clients using the proper pattern from aromabless project

const { supabase, supabaseAdmin } = require('../lib/supabase.js');
console.log('Supabase clients initialized successfully');

// ============================================================================
// AI SYSTEM PROMPT CONFIGURATION
// ============================================================================
// All AI system prompts can be overridden via environment variables.
// For dynamic prompts, you can include tokens like {ORIGINAL_QUERY} and {ACTION_QUERY}

// Parse "Key Insights to Remember" section from AI text output
function parseKeyInsightsFromText(text) {
  if (!text || typeof text !== 'string') return '';
  const markerRegex = /(^|\n)\s*#+\s*Key Insights to Remember\s*:?\s*(\n|$)/i;
  const markerMatch = text.match(markerRegex);
  if (!markerMatch) return '';
  const startIdx = (markerMatch.index ?? 0) + markerMatch[0].length;
  const tail = text.slice(startIdx);
  const lines = tail.split(/\r?\n/);
  const insights = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Stop when a new section likely starts
    if (/^#+\s+/.test(trimmed)) break;
    // Collect bullet or numbered items
    if (/^[-*]\s+/.test(trimmed) || /^\d+\)\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      insights.push(trimmed.replace(/^[-*]\s+/, '').replace(/^\d+[).]\s+/, ''));
      continue;
    }
    // Allow a couple of continuation lines for previous bullet
    if (insights.length > 0 && insights[insights.length - 1].length < 400) {
      insights[insights.length - 1] += ' ' + trimmed;
      continue;
    }
    // Otherwise, if we encounter non-bulleted content after some bullets, stop
    if (insights.length > 0) break;
  }
  return insights.join('\n');
}

// Format memory matches for inclusion in AI context
function formatMemoriesForContext(memories = []) {
  if (!Array.isArray(memories) || memories.length === 0) return 'None';
  return memories.slice(0, 5).map((m, i) => {
    const snippet = (m.content || '').replace(/\s+/g, ' ').slice(0, 240);
    const score = (typeof m.similarity === 'number') ? m.similarity.toFixed(3) : 'n/a';
    return `${i + 1}. [${m.type || m.memory_type || 'memory'}] ${m.title || '(untitled)'} (sim=${score}) — ${snippet}`;
  }).join('\n');
}
// which will be replaced at runtime.

// Helper to render prompt templates with simple token replacement
function renderPrompt(template, vars = {}) {
  if (!template) return '';
  return template
    .replaceAll('{ORIGINAL_QUERY}', vars.originalQuery ?? '')
    .replaceAll('{ACTION_QUERY}', vars.actionQuery ?? '')
    .replaceAll('{ALLOWED_ACTIONS}', 'google_search, analyze_results, synthesize, formulate_response, get_fitbit_data, get_fitbit_sleep, memory_search, memory_store');
}

// Environment-configurable prompts
const ENV_PROMPTS = {
  breakdownSystem: process.env.AI_BREAKDOWN_SYSTEM_PROMPT || 'You are a health-focused task breakdown specialist. Follow the user message strictly: output only the two sections (## BREAKDOWN STEPS: and ## EXECUTOR SYSTEM PROMPT:). Do not output JSON yourself. Focus on medical/health relevance and evidence-based queries. Append the exact magic phrase required by the user message.',
  jsonExecutorSystem: process.env.AI_JSON_EXECUTOR_SYSTEM_PROMPT || `You are a health-focused AI task executor. Convert the breakdown steps above into a JSON array of actions with high-quality search queries.

RULES:
- Use ONLY these 8 action types — NO OTHERS: google_search, analyze_results, synthesize, formulate_response, get_fitbit_data, get_fitbit_sleep, memory_search, memory_store.
- Priorities: lower numbers run earlier. Typical order: searches (1-3), analysis (after searches), synthesis (after analysis), final response (last).
- For actions of type google_search, analyze_results, synthesize, formulate_response, memory_search, memory_store — include exactly these fields:
  - "type" (one of the 8 types)
  - "query" (string)
  - "priority" (integer 1-10)
  - "dependencies" (array of step numbers)
- For get_fitbit_data and get_fitbit_sleep — include:
  - "type", "priority", "dependencies" (no "query" is required)

GOOGLE_SEARCH REQUIREMENTS:
- Use targeted medical/health terms; include words like "medical", "health", "research", "study", "clinical" where helpful.
- Focus on evidence-based sources and filter out irrelevant content.
- Never include unrelated strings in any action or query.

RETURN FORMAT:
- Return ONLY valid JSON with the top-level object: { "actions": [...] }.
- Do NOT include markdown fences or extra text.

EXAMPLE OUTPUT:
{
  "actions": [
    {"type": "google_search", "query": "medical causes of chronic fatigue research studies", "priority": 1, "dependencies": []},
    {"type": "google_search", "query": "clinical guidelines evaluation of daytime sleepiness differential diagnosis", "priority": 2, "dependencies": []},
    {"type": "get_fitbit_data", "priority": 3, "dependencies": []},
    {"type": "get_fitbit_sleep", "priority": 4, "dependencies": []},
    {"type": "memory_search", "query": "prior notes about fatigue workup or sleep apnea mention", "priority": 5, "dependencies": []},
    {"type": "analyze_results", "query": "synthesize research and Fitbit metrics; filter out non-medical sources", "priority": 6, "dependencies": [1,2,3,4,5]},
    {"type": "synthesize", "query": "integrate findings into a concise set of likely etiologies with evidence weight", "priority": 7, "dependencies": [6]},
    {"type": "memory_store", "query": "Key insights about fatigue differentials and personal biometrics correlations", "priority": 8, "dependencies": [7]},
    {"type": "formulate_response", "query": "produce final evidence-based guidance with next steps", "priority": 9, "dependencies": [7]}
  ]
}`,
  progressAnalyzerSystem: process.env.AI_PROGRESS_ANALYZER_SYSTEM_PROMPT || '', // Optional template with tokens
  synthesisSystem: process.env.AI_SYNTHESIS_SYSTEM_PROMPT || '', // Optional template with tokens
  finalResponseSystem: process.env.AI_FINAL_RESPONSE_SYSTEM_PROMPT || '' // Optional template with tokens
};

// Retry configuration for JSON action executor
const JSON_ACTION_MAX_RETRIES = parseInt(process.env.JSON_ACTION_MAX_RETRIES || '3', 10);

// ============================================================================
// GOOGLE SEARCH FUNCTIONALITY
// ============================================================================
// This function searches Google and returns relevant results

async function performGoogleSearch(query, apiKey, cseId) {
  try {
    console.log(`Performing Google search for: "${query}"`);
    
    // Make a request to Google's Custom Search API
    // We send our search query along with our API credentials
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,      // Our Google API key (like a password)
        cx: cseId,        // Custom Search Engine ID (tells Google which search engine to use)
        q: query,         // The actual search query
        num: 5            // How many results we want (maximum 5)
      }
    });

    // Check if we got search results back
    if (response.data.items && response.data.items.length > 0) {
      // Extract just the information we need from each search result
      return response.data.items.map(item => ({
        title: item.title,       // The title of the webpage
        snippet: item.snippet,   // A short description/preview
        link: item.link         // The URL to the webpage
      }));
    }
    
    // If no results found, return an empty array
    return [];
    
  } catch (error) {
    // If something goes wrong with the search, log the error and return empty results
    console.error('Google Search Error:', error.response?.data || error.message);
    return [];
  }
}

// ============================================================================
// JINA EMBEDDINGS MEMORY SYSTEM
// ============================================================================
// Automatic memory management using Jina embeddings for semantic search

// Jina API configuration from environment
const JINA_API_KEY = process.env.JINA_API_KEY;
const JINA_API_URL = process.env.JINA_API_URL || 'https://api.jina.ai/v1/embeddings';
if (!JINA_API_KEY) {
  console.warn('[Jina] Missing JINA_API_KEY in environment. Set it in ai/.env');
}

// Generate embeddings using Jina v4
async function generateJinaEmbedding(text) {
  try {
    console.log(`Generating Jina embedding for text: "${text.substring(0, 100)}..."`);
    
    const data = {
      "model": "jina-embeddings-v4",
      "task": "text-matching",
      "late_chunking": true,
      "truncate": true,
      "dimensions": 2000,  // Supabase pgvector limit
      "input": [{ "text": text }]
    };

    const response = await fetch(JINA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JINA_API_KEY}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Jina API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.data && result.data.length > 0) {
      const item = result.data[0];
      // Guard against multivector responses
      if (item.embeddings) {
        throw new Error('Jina returned multivector embeddings; disable return_multivector for this pipeline');
      }
      if (Array.isArray(item.embedding)) {
        if (item.embedding.length !== 2000) {
          throw new Error(`Unexpected embedding length ${item.embedding.length}; expected 2000`);
        }
        return item.embedding;
      }
    }
    
    throw new Error('No embedding data received from Jina API');
    
  } catch (error) {
    console.error('Jina Embedding Error:', error.message);
    return null;
  }
}

// Simple UUID v4/v1 validator (RFC 4122 variants 1-5)
function isValidUUID(str) {
  return typeof str === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

// Store memory with embedding in Supabase
async function storeMemory(userId, memoryData) {
  try {
    const { title, content, memoryType, sourceType, sourceId, importance = 0.5 } = memoryData;
    
    // Generate embedding for the content
    const embedding = await generateJinaEmbedding(content);
    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }
    
    // Extract keywords from content
    const keywords = extractKeywords(content);
    
    // Validate userId is a UUID (matches ai_memories.usr_prof_id type)
    if (!isValidUUID(userId)) {
      throw new Error(`Invalid userId (expected UUID): ${userId}`);
    }

    // Build insert payload; only include source_id if it's a valid UUID
    const insertPayload = {
      usr_prof_id: userId,
      memory_type: memoryType,
      title: title,
      content: content,
      source_type: sourceType,
      embedding: embedding,
      keywords: keywords,
      importance_score: importance
    };

    if (isValidUUID(sourceId)) {
      insertPayload.source_id = sourceId;
    }

    // Store in Supabase ai_memories table
    const { data, error } = await supabase
      .from('ai_memories')
      .insert(insertPayload)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Supabase insert error: ${error.message}`);
    }
    
    console.log(`Memory stored successfully in Supabase: ${title}`);
    return data;
    
  } catch (error) {
    console.error('Store Memory Error:', error.message);
    return null;
  }
}

// Search memories using semantic similarity
async function searchMemories(userId, queryText, threshold = 0.7, maxResults = 10) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateJinaEmbedding(queryText);
    if (!queryEmbedding) {
      throw new Error('Failed to generate query embedding');
    }
    
    console.log(`Searching memories for user ${userId} with query: "${queryText}"`);
    
    // Call the PostgreSQL function we created in the schema
    const { data, error } = await supabase
      .rpc('search_memories_by_embedding', {
        user_id: userId,
        query_embedding: queryEmbedding,
        similarity_threshold: threshold,
        max_results: maxResults
      });
    
    if (error) {
      throw new Error(`Supabase search error: ${error.message}`);
    }
    
    console.log(`Found ${data?.length || 0} similar memories`);
    return data || [];
    
  } catch (error) {
    console.error('Search Memories Error:', error.message);
    return [];
  }
}

// Extract keywords from text (simple implementation)
function extractKeywords(text) {
  // Remove common stop words and extract meaningful terms
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 20); // Limit to top 20 keywords
}

// Get or create user profile ID from auth user ID
async function getUserProfileId(authUserId) {
  try {
    // First, try to find existing profile
    const { data: existingProfile, error: selectError } = await supabase
      .from('usr_prof')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single();
    
    if (existingProfile) {
      return existingProfile.id;
    }
    
    // If no profile exists, create one
    const { data: newProfile, error: insertError } = await supabase
      .from('usr_prof')
      .insert({
        auth_user_id: authUserId,
        bi_legal_name: 'User', // Default name
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (insertError) {
      throw new Error(`Failed to create user profile: ${insertError.message}`);
    }
    
    console.log(`Created new user profile for auth user: ${authUserId}`);
    return newProfile.id;
    
  } catch (error) {
    console.error('Get User Profile ID Error:', error.message);
    return null;
  }
}

// Auto-store important insights from AI processing
async function autoStoreInsight(authUserId, insight, context = {}) {
  try {
    // Get the user's profile ID
    const userId = await getUserProfileId(authUserId);
    if (!userId) {
      throw new Error('Failed to get user profile ID');
    }
    
    const memoryData = {
      title: `AI Insight: ${insight.substring(0, 50)}...`,
      content: insight,
      memoryType: 'insight',
      sourceType: 'ai_analysis',
      sourceId: context.jobId || null,
      importance: context.importance || 0.7
    };
    
    return await storeMemory(userId, memoryData);
    
  } catch (error) {
    console.error('Auto Store Insight Error:', error.message);
    return null;
  }
}

// ============================================================================
// FITBIT OAUTH AUTHENTICATION SYSTEM
// ============================================================================
// Fitbit requires special permission (OAuth) to access user's health data
// This is a security measure to protect personal information

// In-memory storage for Fitbit access tokens
// Persisted in Supabase (table `fb_tokens`) for durability across restarts
let fitbitTokens = {
  access_token: null,    // The key that lets us access Fitbit data
  refresh_token: null,   // Used to get new access tokens when they expire
  expires_at: null,      // When the current access token expires (ms epoch)
  scope: null,
  token_type: null,
  fitbit_user_id: null
};

// Resolve a usr_prof.id to persist tokens per user
const DEV_AUTH_USER_ID = process.env.DEV_AUTH_USER_ID || 'dev-local-user';
async function resolveUsrProfId() {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('create_user_profile_if_not_exists', {
        p_auth_user_id: DEV_AUTH_USER_ID,
        p_user_name: 'User'
      });
    if (error) throw error;
    // Supabase RPC returns the UUID directly for scalar RETURNS UUID
    return Array.isArray(data) ? data[0] : data;
  } catch (e) {
    console.error('resolveUsrProfId error:', e.message || e);
    return null;
  }
}

// Persist tokens to Supabase (idempotent upsert by usr_prof_id)
async function upsertFitbitTokensDB(usrProfId, tokens) {
  if (!usrProfId) return;
  try {
    const { error } = await supabaseAdmin.rpc('upsert_fb_tokens', {
      p_usr_prof_id: usrProfId,
      p_access_token: tokens.access_token,
      p_refresh_token: tokens.refresh_token || null,
      p_expires_at: new Date(tokens.expires_at).toISOString(),
      p_scope: tokens.scope || null,
      p_token_type: tokens.token_type || null,
      p_fitbit_user_id: tokens.fitbit_user_id || null
    });
    if (error) throw error;
  } catch (e) {
    console.error('upsertFitbitTokensDB error:', e.message || e);
  }
}

// Load tokens from Supabase into memory
async function loadFitbitTokensDB(usrProfId) {
  if (!usrProfId) return false;
  try {
    const { data, error } = await supabaseAdmin.rpc('get_fb_tokens', {
      p_usr_prof_id: usrProfId
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (row && row.access_token) {
      fitbitTokens = {
        access_token: row.access_token,
        refresh_token: row.refresh_token,
        expires_at: row.expires_at ? new Date(row.expires_at).getTime() : null,
        scope: row.scope || null,
        token_type: row.token_type || null,
        fitbit_user_id: row.fitbit_user_id || null
      };
      return true;
    }
    return false;
  } catch (e) {
    console.error('loadFitbitTokensDB error:', e.message || e);
    return false;
  }
}

// PKCE (Proof Key for Code Exchange) is a security standard for OAuth
// It prevents other apps from stealing our authorization codes
function generatePKCE() {
  // Create a random string (code verifier)
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  
  // Create a hash of the code verifier (code challenge)
  // This proves we're the same app that started the authorization process
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  
  return { codeVerifier, codeChallenge };
}

// Create the URL that users visit to authorize our app to access their Fitbit data
function getFitbitAuthorizationUrl() {
  // Get our app credentials from environment variables (secure storage)
  const clientId = process.env.FITBIT_CLIENT_ID;
  const redirectUrl = process.env.FITBIT_REDIRECT_URL;
  
  // Make sure we have the required configuration
  if (!clientId || !redirectUrl) {
    throw new Error('Fitbit OAuth configuration missing');
  }
  
  // Generate security codes for this authorization attempt
  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = crypto.randomBytes(16).toString('hex'); // Prevents CSRF attacks
  
  // Store the security codes so we can verify them later
  // In production, store this in a database or session
  global.fitbitPKCE = { codeVerifier, state };
  
  // Define what permissions we're asking for - UPDATED to include sleep data
  const scopes = ['activity', 'heartrate', 'profile', 'sleep'].join(' ');
  
  // Build the authorization URL step by step
  const authUrl = new URL('https://www.fitbit.com/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');           // We want an authorization code
  authUrl.searchParams.set('client_id', clientId);             // Our app ID
  authUrl.searchParams.set('redirect_uri', redirectUrl);       // Where to send user after authorization
  authUrl.searchParams.set('scope', scopes);                   // What permissions we want
  authUrl.searchParams.set('code_challenge', codeChallenge);   // Security: PKCE challenge
  authUrl.searchParams.set('code_challenge_method', 'S256');   // Security: How we hashed the challenge
  authUrl.searchParams.set('state', state);                    // Security: Prevents CSRF attacks
  
  return authUrl.toString();
}

// Exchange the authorization code for access tokens
// This happens after the user authorizes our app
async function exchangeCodeForTokens(authorizationCode, state) {
  try {
    // Get our app credentials
    const clientId = process.env.FITBIT_CLIENT_ID;
    const clientSecret = process.env.FITBIT_CLIENT_SECRET;
    const redirectUrl = process.env.FITBIT_REDIRECT_URL;
    
    // Security check: Make sure the state matches what we sent
    // This prevents CSRF (Cross-Site Request Forgery) attacks
    if (!global.fitbitPKCE || global.fitbitPKCE.state !== state) {
      throw new Error('Invalid state parameter');
    }
    
    // Create authorization header (Basic Auth with our app credentials)
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    // Request access tokens from Fitbit
    const response = await axios.post('https://api.fitbit.com/oauth2/token',
      // Send form data in the request body
      new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',              // We're exchanging an auth code
        code: authorizationCode,                       // The code Fitbit gave us
        code_verifier: global.fitbitPKCE.codeVerifier, // Proves we started this process
        redirect_uri: redirectUrl
      }),
      {
        headers: {
          'Authorization': `Basic ${credentials}`,                    // App authentication
          'Content-Type': 'application/x-www-form-urlencoded'        // Tell server we're sending form data
        }
      }
    );
    
    // If we successfully got tokens, store them
    if (response.data.access_token) {
      fitbitTokens = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: Date.now() + (response.data.expires_in * 1000),  // ms epoch
        scope: response.data.scope || null,
        token_type: response.data.token_type || null,
        fitbit_user_id: response.data.user_id || null
      };
      
      console.log('Fitbit tokens obtained successfully');
      console.log('Scopes granted:', response.data.scope);
      
      // Persist tokens to Supabase for durability
      const usrProfId = await resolveUsrProfId();
      await upsertFitbitTokensDB(usrProfId, fitbitTokens);
      
      // Clean up the temporary PKCE data
      delete global.fitbitPKCE;
      
      return fitbitTokens;
    } else {
      throw new Error('No access token in response');
    }
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    throw error;
  }
}

// Get new access tokens using the refresh token
// Access tokens expire, but refresh tokens let us get new ones without user interaction
async function refreshFitbitToken() {
  try {
    // Make sure we have a refresh token to use
    if (!fitbitTokens.refresh_token) {
      throw new Error('No refresh token available');
    }
    
    // Get app credentials
    const clientId = process.env.FITBIT_CLIENT_ID;
    const clientSecret = process.env.FITBIT_CLIENT_SECRET;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    // Request new tokens using the refresh token
    const response = await axios.post('https://api.fitbit.com/oauth2/token',
      new URLSearchParams({
        grant_type: 'refresh_token',        // We're using a refresh token
        client_id: clientId,
        refresh_token: fitbitTokens.refresh_token
      }),
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    // Store the new tokens
    if (response.data.access_token) {
      fitbitTokens = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_at: Date.now() + (response.data.expires_in * 1000),
        scope: response.data.scope || fitbitTokens.scope || null,
        token_type: response.data.token_type || fitbitTokens.token_type || null,
        fitbit_user_id: response.data.user_id || fitbitTokens.fitbit_user_id || null
      };
      // Persist refresh results
      const usrProfId = await resolveUsrProfId();
      await upsertFitbitTokensDB(usrProfId, fitbitTokens);
      
      console.log('Fitbit token refreshed successfully');
      return fitbitTokens.access_token;
    } else {
      throw new Error('No access token in refresh response');
    }
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    throw error;
  }
}

// Get a valid access token, refreshing it if necessary
// This is the main function other parts of our code will use
async function getFitbitAccessToken() {
  try {
    // Check if our current token is still valid (with 1 minute buffer)
    if (fitbitTokens.access_token && fitbitTokens.expires_at > Date.now() + 60000) {
      return fitbitTokens.access_token;
    }

    // Try loading from DB if not in memory
    const usrProfId = await resolveUsrProfId();
    if (usrProfId) {
      await loadFitbitTokensDB(usrProfId);
      if (fitbitTokens.access_token && fitbitTokens.expires_at > Date.now() + 60000) {
        return fitbitTokens.access_token;
      }
    }

    // If token is expired but we have a refresh token, get a new one
    if (fitbitTokens.refresh_token) {
      return await refreshFitbitToken();
    }

    // No valid tokens available - user needs to authorize again
    throw new Error('No valid Fitbit tokens available. Authorization required.');
  } catch (error) {
    console.error('Get access token error:', error.message);
    return null;
  }
}

// Get daily activity summary from Fitbit API
async function getFitbitDailySummary(accessToken, date = 'today') {
  try {
    // Make sure we have an access token
    if (!accessToken) {
      throw new Error('No access token provided');
    }

    // Format the date for Fitbit API (they want yyyy-MM-dd format)
    const targetDate = date === 'today' ?
      new Date().toISOString().split('T')[0] : date;
    
    // console.log(`Fetching Fitbit daily summary for: ${targetDate}`);
    
    // Make a request to the Fitbit API to get activity data
    const response = await axios.get(`https://api.fitbit.com/1/user/-/activities/date/${targetDate}.json`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    // Return the data from the API response
    return response.data;
    
  } catch (error) {
    // If there's an error, check if it's an expired token error
    if (error.response && error.response.status === 401) {
      console.log('Fitbit access token may have expired. Attempting refresh...');
      // Throw a specific error to be caught by the calling function
      throw new Error('Token expired');
    }
    
    // For other errors, log them and return null
    console.error('Fitbit API Error:', error.response?.data || error.message);
    return null;
  }
}

// FIXED: Get sleep data from Fitbit API
async function getFitbitSleepData(accessToken, date = 'today') {
  try {
    // Make sure we have an access token
    if (!accessToken) {
      throw new Error('No access token provided');
    }

    // Format the date for Fitbit API (they want yyyy-MM-dd format)
    const targetDate = date === 'today' ?
      new Date().toISOString().split('T')[0] : date;

    console.log(`Fetching Fitbit sleep data for: ${targetDate}`);
    
    // Make a request to the Fitbit API to get sleep data
    const response = await axios.get(`https://api.fitbit.com/1.2/user/-/sleep/date/${targetDate}.json`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    // Return the data from the API response
    return response.data;
    
  } catch (error) {
    // If there's an error, check if it's an expired token error
    if (error.response && error.response.status === 401) {
      console.log('Fitbit access token may have expired. Attempting refresh...');
      throw new Error('Token expired');
    }
    
    // For other errors, log them and return null
    console.error('Fitbit Sleep API Error:', error.response?.data || error.message);
    return null;
  }
}

// ============================================================================
// SEARCH QUERY GENERATION
// ============================================================================
// Create multiple related search queries from user input to get comprehensive results

function generateSearchQueries(userText) {
  // Limit the length to avoid overly long search queries
  const baseQuery = userText.slice(0, 100);
  
  // Create different variations of the search to get diverse results
  return [
    `${baseQuery} research studies`,        // Find academic research
    `${baseQuery} best practices solutions`, // Find practical advice
    `how to ${baseQuery}`,                  // Find instructional content
    `${baseQuery} expert advice`,           // Find expert opinions
    `${baseQuery} scientific evidence`      // Find evidence-based information
  ].slice(0, 3); // Limit to 3 searches to avoid hitting rate limits
}

// ============================================================================
// WEB SERVER ENDPOINTS (ROUTES)
// ============================================================================
// These define what happens when someone visits different URLs on our server

// --- HEALTH CHECK ENDPOINT ---
// Simple endpoint to check if the server is running
// Visit: GET /health
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// --- FITBIT AUTHORIZATION ENDPOINTS ---

// Start the Fitbit authorization process
// Visit: GET /auth/fitbit
router.get('/auth/fitbit', (req, res) => {
  try {
    // Generate the authorization URL
    const authUrl = getFitbitAuthorizationUrl();
    
    // Send the URL back to the user
    res.json({
      message: 'Visit this URL to authorize Fitbit access',
      authorizationUrl: authUrl,
      instructions: 'Copy this URL and open it in your browser to grant permissions'
    });
  } catch (error) {
    // If something goes wrong, send an error response
    res.status(500).json({
      error: 'Failed to generate authorization URL',
      message: error.message
    });
  }
});

// Handle the callback from Fitbit after user authorizes
// Fitbit redirects user here: GET /auth/fitbit/callback?code=...&state=...
router.get('/auth/fitbit/callback', async (req, res) => {
  try {
    // Extract parameters from the URL
    const { code, state, error } = req.query;
    
    // Check if Fitbit sent an error instead of authorization code
    if (error) {
      return res.status(400).json({
        error: 'Authorization failed',
        message: error
      });
    }
    
    // Make sure we got the required parameters
    if (!code || !state) {
      return res.status(400).json({
        error: 'Missing authorization code or state'
      });
    }
    
    // Exchange the authorization code for access tokens
    const tokens = await exchangeCodeForTokens(code, state);
    
    // Send success response
    res.json({
      message: 'Fitbit authorization successful!',
      tokenInfo: {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresAt: new Date(tokens.expires_at).toISOString()
      }
    });
  } catch (error) {
    // Send error response if token exchange fails
    res.status(500).json({
      error: 'Token exchange failed',
      message: error.message
    });
  }
});

// Check the current authorization status
// Visit: GET /auth/fitbit/status
router.get('/auth/fitbit/status', (req, res) => {
  // Check if we have a valid token
  const hasValidToken = fitbitTokens.access_token && fitbitTokens.expires_at > Date.now();
  
  res.json({
    authorized: hasValidToken,
    tokenInfo: fitbitTokens.access_token ? {
      hasAccessToken: !!fitbitTokens.access_token,
      hasRefreshToken: !!fitbitTokens.refresh_token,
      expiresAt: fitbitTokens.expires_at ? new Date(fitbitTokens.expires_at).toISOString() : null,
      expiresIn: fitbitTokens.expires_at ? Math.max(0, Math.floor((fitbitTokens.expires_at - Date.now()) / 1000)) : 0
    } : null
  });
});

// ============================================================================
// MEMORY MANAGEMENT ENDPOINTS
// ============================================================================
// API endpoints for storing and retrieving memories using Jina embeddings

// Store a new memory
// POST /memory/store with JSON body: {"title": "...", "content": "...", "memoryType": "...", "userId": "..."}
router.post('/memory/store', async (req, res) => {
  try {
    const { title, content, memoryType, userId, sourceType, sourceId, importance } = req.body;
    
    if (!title || !content || !memoryType || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: title, content, memoryType, userId'
      });
    }
    
    const memoryData = {
      title,
      content,
      memoryType,
      sourceType: sourceType || 'user_input',
      sourceId,
      importance: importance || 0.5
    };
    
    const result = await storeMemory(userId, memoryData);
    
    if (result) {
      res.json({
        success: true,
        message: 'Memory stored successfully',
        memoryId: result.id || 'generated',
        embedding_dimensions: result.embedding ? result.embedding.length : 0
      });
    } else {
      res.status(500).json({
        error: 'Failed to store memory'
      });
    }
    
  } catch (error) {
    console.error('Store memory endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Search memories by semantic similarity
// POST /memory/search with JSON body: {"query": "...", "userId": "...", "threshold": 0.7, "maxResults": 10}
router.post('/memory/search', async (req, res) => {
  try {
    const { query, userId, threshold, maxResults } = req.body;
    
    if (!query || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: query, userId'
      });
    }
    
    const results = await searchMemories(userId, query, threshold, maxResults);
    
    res.json({
      success: true,
      query: query,
      results: results,
      count: Array.isArray(results) ? results.length : 0
    });
    
  } catch (error) {
    console.error('Search memory endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Auto-store insight from AI processing
// POST /memory/auto-insight with JSON body: {"insight": "...", "userId": "...", "jobId": "...", "importance": 0.7}
router.post('/memory/auto-insight', async (req, res) => {
  try {
    const { insight, userId, jobId, importance } = req.body;
    
    if (!insight || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: insight, userId'
      });
    }
    
    const context = {
      jobId: jobId,
      importance: importance || 0.7
    };
    
    const result = await autoStoreInsight(userId, insight, context);
    
    if (result) {
      res.json({
        success: true,
        message: 'Insight stored automatically',
        memoryId: result.id || 'generated'
      });
    } else {
      res.status(500).json({
        error: 'Failed to auto-store insight'
      });
    }
    
  } catch (error) {
    console.error('Auto-store insight endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Test Jina embedding generation
// POST /memory/test-embedding with JSON body: {"text": "..."}
router.post('/memory/test-embedding', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'Missing required field: text'
      });
    }
    
    const embedding = await generateJinaEmbedding(text);
    
    if (embedding) {
      res.json({
        success: true,
        text: text,
        embedding_dimensions: embedding.length,
        embedding_preview: embedding.slice(0, 10), // First 10 dimensions for preview
        message: `Successfully generated ${embedding.length}-dimensional embedding`
      });
    } else {
      res.status(500).json({
        error: 'Failed to generate embedding'
      });
    }
    
  } catch (error) {
    console.error('Test embedding endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// ============================================================================
// MAIN AI PROCESSING ENDPOINT
// ============================================================================
// This is the heart of our application - it processes user questions with AI

// Main endpoint that starts the AI processing job
// Send POST request to /process-and-save with JSON body: {"text": "your question here"}
router.post('/process-and-save', (req, res) => {
    // Extract the user's question from the request
    const userText = req.body.text;
    
    // Read optional user context for memory operations
    const { userId, authUserId } = req.body || {};
    const userContext = { userProfileId: userId || null, authUserId: authUserId || 'dev-local-user' };

    // Create a unique job ID using current timestamp
    const jobId = Date.now().toString();
    
    // Create a folder for this job's files
    const jobFolderPath = path.join(OUTPUTS_DIR, jobId);
    fs.ensureDirSync(jobFolderPath);

    // Send immediate response to user (we'll process in background)
    res.status(202).json({
        message: 'Job accepted. A three-step AI analysis with Google Search and Fitbit integration will be saved on the server.',
        jobId: jobId
    });

    // Start the processing in the background (async - doesn't block the response)
    processAndCritique(jobId, jobFolderPath, userText, userContext);
});

// ============================================================================
// MAIN AI PROCESSING LOGIC
// ============================================================================
// This function orchestrates the entire AI processing workflow

async function processAndCritique(jobId, folderPath, textToAnalyze, userContext = {}) {
    console.log(`[Job ${jobId}] Starting processing pipeline...`);
    
    try {
        // Resolve user profile ID for memory operations
        let effectiveUserProfileId = userContext?.userProfileId || null;
        try {
            if (!effectiveUserProfileId) {
                effectiveUserProfileId = await getUserProfileId(userContext?.authUserId || 'dev-local-user');
            }
        } catch (e) {
            console.error(`[Job ${jobId}] Failed to resolve user profile ID:`, e.message);
        }
        const normalizedUserContext = {
            userProfileId: effectiveUserProfileId,
            authUserId: userContext?.authUserId || 'dev-local-user'
        };
        // =================================================================
        // STEP 0: GOOGLE SEARCH INTEGRATION (TEMPORARILY DISABLED)
        // =================================================================
        // console.log(`[Job ${jobId}] --- Google search disabled for first turn...`);
        
        // Initialize variables for search results (empty for now)
        let searchResults = [];
        let searchSummary = "Google Search disabled for first turn - will be triggered by magic phrase.";
        
        // =================================================================
        // STEP 0.5: FITBIT DATA INTEGRATION
        // =================================================================
        // console.log(`[Job ${jobId}] --- Fetching Fitbit daily activity summary...`);
        
        // Initialize variables for Fitbit data
        let fitbitData = null;
        let fitbitSummary = "Fitbit data was not available.";
        
        try {
            // Try to get a valid access token
            const accessToken = await getFitbitAccessToken();
            
            if (accessToken) {
                // Fetch today's activity data from Fitbit
                fitbitData = await getFitbitDailySummary(accessToken);
                
                if (fitbitData) {
                    // Extract key information from Fitbit response
                    const summary = fitbitData.summary;
                    const goals = fitbitData.goals;
                    
                    // Create a human-readable summary of health data
                    fitbitSummary = `Today's Health & Activity Data:\n\n`;
                    fitbitSummary += `**Activity Summary:**\n`;
                    fitbitSummary += `- Steps: ${summary.steps || 0} (Goal: ${goals.steps || 'N/A'})\n`;
                    fitbitSummary += `- Calories Burned: ${summary.caloriesOut || 0} (Goal: ${goals.caloriesOut || 'N/A'})\n`;
                    fitbitSummary += `- Distance: ${summary.distances?.[0]?.distance || 0} miles\n`;
                    fitbitSummary += `- Active Minutes: Very Active: ${summary.veryActiveMinutes || 0}, Fairly Active: ${summary.fairlyActiveMinutes || 0}, Lightly Active: ${summary.lightlyActiveMinutes || 0}\n`;
                    fitbitSummary += `- Sedentary Minutes: ${summary.sedentaryMinutes || 0}\n`;
                    
                    // Add heart rate data if available
                    if (summary.restingHeartRate) {
                        fitbitSummary += `- Resting Heart Rate: ${summary.restingHeartRate} bpm\n`;
                    }
                    
                    // Add heart rate zones if available
                    if (summary.heartRateZones && summary.heartRateZones.length > 0) {
                        fitbitSummary += `\n**Heart Rate Zones:**\n`;
                        summary.heartRateZones.forEach(zone => {
                            fitbitSummary += `- ${zone.name}: ${zone.minutes} minutes (${zone.min}-${zone.max} bpm)\n`;
                        });
                    }
                    
                    // console.log(`[Job ${jobId}] Fitbit data retrieved successfully`);
                } else {
                    fitbitSummary = "Fitbit data could not be retrieved.";
                }
                
                // Save Fitbit data to file for reference
                const fitbitFilename = `${Date.now()}_fitbit_data.md`;
                const fitbitFilePath = path.join(folderPath, fitbitFilename);
                const fitbitFileContent = `# Fitbit Daily Activity Summary\n\nDate: ${new Date().toISOString().split('T')[0]}\n\n${fitbitSummary}\n\n## Raw Data\n\`\`\`json\n${JSON.stringify(fitbitData, null, 2)}\n\`\`\``;
                await fs.writeFile(fitbitFilePath, fitbitFileContent);
                // console.log(`[Job ${jobId}] Fitbit data saved to ${fitbitFilename}`);
                
            } else {
                console.log(`[Job ${jobId}] Could not obtain Fitbit access token - authorization required`);
                fitbitSummary = "Fitbit authorization required. Visit /auth/fitbit to authorize access to your Fitbit data.";
            }
        } catch (fitbitError) {
            console.error(`[Job ${jobId}] Fitbit error:`, fitbitError);
            fitbitSummary = `Fitbit integration encountered an error: ${fitbitError.message}`;
        }

        // =================================================================
        // STEP 1: FIRST AI CALL (TASK BREAKDOWN SPECIALIST)
        // =================================================================
        // This AI call breaks down the user query into actionable steps
        console.log(`[Job ${jobId}] --- Calling Task Breakdown AI...`);
        
        // Create task breakdown prompt - FIXED SYSTEM PROMPT
        const localTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' });
        const breakdownPrompt = `You are a health-focused task breakdown specialist. The current date and time is ${localTime}. Your job is to analyze user health queries and break them down into clear, actionable steps for an AI research/execution system.

OUTPUT FORMAT (STRICT):
- Your message must contain exactly two sections in this order:
  1) "## BREAKDOWN STEPS:" — a numbered list of concrete steps for the system to execute.
  2) "## EXECUTOR SYSTEM PROMPT:" — the literal system prompt text that a second AI will use to convert the steps into JSON actions.
- Do NOT output any JSON action plan yourself. Only the second AI will produce JSON.
- Do NOT include extra sections or commentary outside these two sections.
- Append this exact magic phrase on its own line at the very end: "Pikachu's diapers are eaten by steve"

CONTEXT & CAPABILITIES:
- The system can execute exactly 8 action types: google_search, analyze_results, synthesize, formulate_response, get_fitbit_data, get_fitbit_sleep, memory_search, memory_store.
- Long-term memory is explicit via actions: use "memory_search" to retrieve relevant prior info and "memory_store" to persist important insights.

SEARCH QUERY GUIDELINES:
- Use specific medical/health terminology when appropriate.
- Include terms like "medical", "health", "research", "study", "clinical" to improve result quality.
- Avoid generic, entertainment, or gaming-related terms.
- Prefer evidence-based, scientific sources (guidelines, peer-reviewed studies).

## BREAKDOWN STEPS:
1) [First research step]
2) [Second research step]
3) [Analysis step]
4) [Synthesis step]
5) [Final response step]

## EXECUTOR SYSTEM PROMPT:
You are a health-focused AI task executor. Convert the breakdown steps above into a JSON array of actions with high-quality search queries.

RULES:
- Use ONLY these 8 action types — NO OTHERS: google_search, analyze_results, synthesize, formulate_response, get_fitbit_data, get_fitbit_sleep, memory_search, memory_store.
- Priorities: lower numbers run earlier. Typical order: searches (1-3), analysis (after searches), synthesis (after analysis), final response (last).
- For actions of type google_search, analyze_results, synthesize, formulate_response, memory_search, memory_store — include exactly these fields:
  - "type" (one of the 8 types)
  - "query" (string)
  - "priority" (integer 1-10)
  - "dependencies" (array of step numbers)
- For get_fitbit_data and get_fitbit_sleep — include:
  - "type", "priority", "dependencies" (no "query" is required)

GOOGLE_SEARCH REQUIREMENTS:
- Use targeted medical/health terms; include words like "medical", "health", "research", "study", "clinical" where helpful.
- Focus on evidence-based sources and filter out irrelevant content.
- Never include unrelated strings (e.g., the magic phrase) in any action or query.

RETURN FORMAT:
- Return ONLY valid JSON with the top-level object: { "actions": [...] }.
- Do NOT include markdown fences or extra text.

EXAMPLE OUTPUT:
{
  "actions": [
    {"type": "google_search", "query": "medical causes of chronic fatigue research studies", "priority": 1, "dependencies": []},
    {"type": "google_search", "query": "clinical guidelines evaluation of daytime sleepiness differential diagnosis", "priority": 2, "dependencies": []},
    {"type": "get_fitbit_data", "priority": 3, "dependencies": []},
    {"type": "get_fitbit_sleep", "priority": 4, "dependencies": []},
    {"type": "memory_search", "query": "prior notes about fatigue workup or sleep apnea mention", "priority": 5, "dependencies": []},
    {"type": "analyze_results", "query": "synthesize research and Fitbit metrics; filter out non-medical sources", "priority": 6, "dependencies": [1,2,3,4,5]},
    {"type": "synthesize", "query": "integrate findings into a concise set of likely etiologies with evidence weight", "priority": 7, "dependencies": [6]},
    {"type": "memory_store", "query": "Key insights about fatigue differentials and personal biometrics correlations", "priority": 8, "dependencies": [7]},
    {"type": "formulate_response", "query": "produce final evidence-based guidance with next steps", "priority": 9, "dependencies": [7]}
  ]
}`;
        
        // Make API call to OpenRouter (AI service)
        console.log(`[Job ${jobId}] Making OpenRouter API call for Task Breakdown AI...`);
        const firstResponse = await callOpenRouterWithFallback(
            breakdownPrompt,
            ENV_PROMPTS.breakdownSystem,
            jobId,
            'Task Breakdown AI'
        );
        
        // Check if the API call was successful
        if (!firstResponse.success) {
            const errorText = firstResponse.error;
            console.error(`[Job ${jobId}] Task Breakdown AI failed: ${errorText}`);
            throw new Error(`Task Breakdown AI returned an error: ${errorText}`);
        }

        // Extract the AI's response
        const firstAiData = firstResponse.content;
        const firstAiAnswer = firstAiData;
        console.log(`[Job ${jobId}] Task Breakdown AI response received. Length: ${firstAiAnswer.length} characters`);

        // Save the breakdown response to file
        const responseFilename = `${Date.now()}_response.md`;
        const responseFilePath = path.join(folderPath, responseFilename);
        const responseWithMetadata = `# AI Response\n\n**Original Query:** "${textToAnalyze}"\n\n**Generated Response:**\n\n${firstAiAnswer}`;
        await fs.writeFile(responseFilePath, responseWithMetadata);
        console.log(`[Job ${jobId}] Task Breakdown AI response saved to ${responseFilename}`);

        // =================================================================
        // MAGIC PHRASE DETECTION & CONDITIONAL EXECUTION
        // =================================================================
        const magicPhrase = "Pikachu's diapers are eaten by steve";
        const shouldExecute = firstAiAnswer.includes(magicPhrase);
        
        console.log(`[Job ${jobId}] Magic phrase detection: ${shouldExecute ? 'FOUND' : 'NOT FOUND'}`);
        if (!shouldExecute) {
            console.log(`[Job ${jobId}] Full response for debugging: ${firstAiAnswer}`);
        }
        
        let parsedPlan = { actions: [], executed: false };
        let executionPlan = "No execution plan generated - magic phrase not detected.";
        let retryCount = 0;
        const maxRetries = 3;
        let currentResponse = firstAiAnswer;

        while (retryCount < maxRetries) {
            const shouldExecute = currentResponse.includes(magicPhrase);
            
            console.log(`[Job ${jobId}] Magic phrase detection (attempt ${retryCount + 1}): ${shouldExecute ? 'FOUND' : 'NOT FOUND'}`);
            if (!shouldExecute) {
                console.log(`[Job ${jobId}] Full response for debugging (attempt ${retryCount + 1}): ${currentResponse}`);
            }

            if (shouldExecute) {
                console.log(`[Job ${jobId}] Magic phrase detected! Triggering OpenRouter JSON executor...`);
                
                // =================================================================
                // STEP 2: OPENROUTER JSON EXECUTOR (JSON CONVERTER)
                // =================================================================
                // This AI converts the breakdown steps into executable JSON actions
                console.log(`[Job ${jobId}] --- Calling OpenRouter JSON Executor...`);

                // Extract the breakdown steps and system prompt from the first AI response
                const breakdownSections = currentResponse.split('## EXECUTOR SYSTEM PROMPT:');
                const breakdownSteps = breakdownSections[0].replace('## BREAKDOWN STEPS:', '').trim();
                let executorSystemPrompt = breakdownSections[1] ? breakdownSections[1].trim() :
                    `You are a health-focused AI task executor. Convert the breakdown steps above into a JSON array of actions with high-quality search queries.

RULES:
- Use ONLY these 8 action types — NO OTHERS: google_search, analyze_results, synthesize, formulate_response, get_fitbit_data, get_fitbit_sleep, memory_search, memory_store.
- Priorities: lower numbers run earlier. Typical order: searches (1-3), analysis (after searches), synthesis (after analysis), final response (last).
- For actions of type google_search, analyze_results, synthesize, formulate_response, memory_search, memory_store — include exactly these fields:
  - "type" (one of the 8 types)
  - "query" (string)
  - "priority" (integer 1-10)
  - "dependencies" (array of step numbers)
- For get_fitbit_data and get_fitbit_sleep — include:
  - "type", "priority", "dependencies" (no "query" is required)

GOOGLE_SEARCH REQUIREMENTS:
- Use targeted medical/health terms; include words like "medical", "health", "research", "study", "clinical" where helpful.
- Focus on evidence-based sources and filter out irrelevant content.
- Never include unrelated strings (e.g., the magic phrase) in any action or query.

RETURN FORMAT:
- Return ONLY valid JSON with the top-level object: { "actions": [...] }.
- Do NOT include markdown fences or extra text.

EXAMPLE OUTPUT:
{
  "actions": [
    {"type": "google_search", "query": "medical research overtraining syndrome symptoms and recovery", "priority": 1, "dependencies": []},
    {"type": "google_search", "query": "impact of endurance training on sleep quality clinical studies", "priority": 2, "dependencies": []},
    {"type": "get_fitbit_data", "priority": 3, "dependencies": []},
    {"type": "get_fitbit_sleep", "priority": 4, "dependencies": []},
    {"type": "memory_search", "query": "prior notes about training load and fatigue", "priority": 5, "dependencies": []},
    {"type": "analyze_results", "query": "Analyze search results, Fitbit data, and memories to find correlations; filter out irrelevant content.", "priority": 6, "dependencies": [1,2,3,4,5]},
    {"type": "synthesize", "query": "Combine all findings into a coherent summary explaining likely mechanisms with evidence weight.", "priority": 7, "dependencies": [6]},
    {"type": "memory_store", "query": "Key Insight: relationship between training load, RHR, and sleep efficiency.", "priority": 8, "dependencies": [7]},
    {"type": "formulate_response", "query": "Create a comprehensive, evidence-based response with actionable guidance.", "priority": 9, "dependencies": [7]}
  ]
}`;
            
            // Optional environment override for JSON Executor system prompt
            if (ENV_PROMPTS.jsonExecutorSystem) {
                executorSystemPrompt = renderPrompt(ENV_PROMPTS.jsonExecutorSystem, { originalQuery: textToAnalyze });
            }
            
            // Create the user prompt for JSON conversion
            const jsonUserPrompt = `Breakdown Steps to Convert:\n${breakdownSteps}\n\nConvert these steps into JSON actions.`;

            // Optional JSON schema to strictly guide output
            const actionsJsonSchema = {
                type: 'object',
                additionalProperties: false,
                properties: {
                    actions: {
                        type: 'array',
                        items: {
                            oneOf: [
                                {
                                    type: 'object',
                                    additionalProperties: false,
                                    properties: {
                                        type: { type: 'string', enum: ['google_search','analyze_results','synthesize','formulate_response','memory_search','memory_store'] },
                                        query: { type: 'string' },
                                        priority: { type: 'integer', minimum: 1, maximum: 10 },
                                        dependencies: { type: 'array', items: { type: 'integer' } }
                                    },
                                    required: ['type','query','priority','dependencies']
                                },
                                {
                                    type: 'object',
                                    additionalProperties: false,
                                    properties: {
                                        type: { type: 'string', enum: ['get_fitbit_data','get_fitbit_sleep'] },
                                        priority: { type: 'integer', minimum: 1, maximum: 10 },
                                        dependencies: { type: 'array', items: { type: 'integer' } }
                                    },
                                    required: ['type','priority','dependencies']
                                }
                            ]
                        }
                    }
                },
                required: ['actions']
            };

            // Make API call to OpenRouter JSON models
            const jsonExec = await callOpenRouterJSONWithFallback(jsonUserPrompt, executorSystemPrompt, jobId, 'JSON Executor', actionsJsonSchema);

            if (!jsonExec.success) {
                throw new Error(jsonExec.error || 'OpenRouter JSON Executor failed');
            }

            // Use parsed JSON directly
            executionPlan = JSON.stringify(jsonExec.json, null, 2);
            console.log(`[Job ${jobId}] OpenRouter JSON Executor generated execution plan (model: ${jsonExec.model})`);

            // Save the execution plan to file
            const executionFilename = `${Date.now()}_execution_plan.json`;
            const executionFilePath = path.join(folderPath, executionFilename);
            await fs.writeFile(executionFilePath, executionPlan);
            console.log(`[Job ${jobId}] Execution plan saved to ${executionFilename}`);

            // Parse the JSON to validate it
            try {
                parsedPlan = JSON.parse(executionPlan);
                parsedPlan.executed = true;
                console.log(`[Job ${jobId}] Execution plan parsed successfully:`, parsedPlan.actions?.length || 0, 'actions');
                
                // =================================================================
                // STEP 3: EXECUTE JSON ACTIONS
                // =================================================================
                await executeJsonActions(jobId, folderPath, parsedPlan, textToAnalyze, fitbitData, normalizedUserContext);
                
            } catch (parseError) {
                console.error(`[Job ${jobId}] Failed to parse execution plan JSON:`, parseError.message);
                parsedPlan = { actions: [], error: 'Invalid JSON format', executed: false };
            }
            break; // Exit the retry loop since we succeeded
        } else {
            console.log(`[Job ${jobId}] Magic phrase not found - retrying (attempt ${retryCount + 1}/${maxRetries})...`);
            
            // If this is not the last retry, make another API call
            if (retryCount < maxRetries - 1) {
                console.log(`[Job ${jobId}] Making OpenRouter API call for Task Breakdown AI retry ${retryCount + 1}...`);
                const retryResponse = await callOpenRouterWithFallback(
                    breakdownPrompt,
                    ENV_PROMPTS.breakdownSystem,
                    jobId,
                    'Task Breakdown AI'
                );
                
                if (!retryResponse.success) {
                    const errorText = retryResponse.error;
                    console.error(`[Job ${jobId}] Task Breakdown AI retry ${retryCount + 1} failed: ${errorText}`);
                    // Continue to next retry
                } else {
                    currentResponse = retryResponse.content;
                    console.log(`[Job ${jobId}] Task Breakdown AI retry ${retryCount + 1} response received. Length: ${currentResponse.length} characters`);
                }
            } else {
                console.log(`[Job ${jobId}] Maximum retries reached. Skipping execution - magic phrase not found in AI response`);
            }
            retryCount++;
        }
    }
    console.log(`[Job ${jobId}] SUCCESS! JSON Action Plan executed.`);
} catch (error) {
    // If any step fails, log the error and save it to a file
    console.error(`[Job ${jobId}] ERROR during processing:`, error);
    const errorFilePath = path.join(folderPath, 'error.txt');
    await fs.writeFile(errorFilePath, `Error occurred during processing:\n\n${error.toString()}\n\nStack trace:\n${error.stack}`);
}
}

// ============================================================================
// JSON ACTION EXECUTOR SYSTEM
// ============================================================================
// This function executes the JSON action plan generated by Ollama

async function executeJsonActions(jobId, folderPath, parsedPlan, originalQuery, preFetchedFitbitData = null, userContext = {}) {
    console.log(`[Job ${jobId}] --- Starting JSON Action Execution ---`);
    
    if (!parsedPlan.actions || parsedPlan.actions.length === 0) {
        console.log(`[Job ${jobId}] No actions to execute`);
        return;
    }
    
    // Sort actions by priority (LOWER numbers = HIGHER priority)
    const sortedActions = parsedPlan.actions.sort((a, b) => (a.priority || 5) - (b.priority || 5));
    
    // Track execution results - initialize with pre-fetched Fitbit data if available
    const executionResults = {
        searchResults: [],
        analysisResults: [],
        synthesisResults: [],
        finalResponse: null,
        planUpdateTriggered: false,
        updatedPlan: null,
        fitbitData: preFetchedFitbitData, // Initialize with pre-fetched data
        fitbitSleepData: null // Initialize sleep data as null
    };
    // Attach user context for memory operations
    executionResults.userProfileId = userContext?.userProfileId || null;
    executionResults.authUserId = userContext?.authUserId || null;
    
    // Track completed actions by their priority numbers
    const completedActions = new Set();
    const attemptCounts = new Map(); // key: action priority (step number), value: attempts
    
    // Use a queue to support retries and deferrals due to dependencies
    let queue = [...sortedActions];
    console.log(`[Job ${jobId}] Executing ${queue.length} actions with retry logic (max ${JSON_ACTION_MAX_RETRIES} retries per action)`);
    
    while (queue.length > 0) {
        const action = queue.shift();
        const stepNum = action.priority;
        const attempts = attemptCounts.get(stepNum) || 0;
        
        console.log(`[Job ${jobId}] Considering action: ${action.type} (priority: ${action.priority}) attempt ${attempts + 1}/${JSON_ACTION_MAX_RETRIES}`);
        
        // Check dependencies before executing action
        if (action.dependencies && Array.isArray(action.dependencies)) {
            const unmetDependencies = action.dependencies.filter(dep => !completedActions.has(dep));
            if (unmetDependencies.length > 0) {
                if (attempts < JSON_ACTION_MAX_RETRIES) {
                    attemptCounts.set(stepNum, attempts + 1);
                    console.log(`[Job ${jobId}] Deferring action ${action.type} due to unmet dependencies: ${unmetDependencies.join(', ')} (retry ${attempts + 1}/${JSON_ACTION_MAX_RETRIES})`);
                    queue.push(action); // re-queue for later
                    continue;
                } else {
                    console.warn(`[Job ${jobId}] Skipping action ${action.type} after ${JSON_ACTION_MAX_RETRIES} retries due to unmet dependencies: ${unmetDependencies.join(', ')}`);
                    continue;
                }
            }
        }
        
        try {
            switch (action.type) {
                case 'google_search':
                    await executeGoogleSearch(jobId, folderPath, action, executionResults);
                    break;
                case 'analyze_results':
                    await executeAnalyzeResults(jobId, folderPath, action, executionResults, originalQuery);
                    // Implicit memory write disabled. Use a separate 'memory_store' action instead.
                    // if (executionResults.analysisInsights && executionResults.userProfileId) {
                    //     await storeMemory(executionResults.userProfileId, {
                    //         title: `AI Analysis Insight: ${originalQuery.substring(0, 50)}...`,
                    //         content: executionResults.analysisInsights,
                    //         memoryType: 'insight',
                    //         sourceType: 'ai_analysis',
                    //         sourceId: jobId,
                    //         importance: 0.7
                    //     });
                    // }
                    break;
                case 'synthesize':
                    await executeSynthesize(jobId, folderPath, action, executionResults, originalQuery);
                    // Implicit memory write disabled. Use a separate 'memory_store' action instead.
                    // if (executionResults.synthesisInsights && executionResults.userProfileId) {
                    //     await storeMemory(executionResults.userProfileId, {
                    //         title: `AI Synthesis Insight: ${originalQuery.substring(0, 50)}...`,
                    //         content: executionResults.synthesisInsights,
                    //         memoryType: 'insight',
                    //         sourceType: 'ai_analysis',
                    //         sourceId: jobId,
                    //         importance: 0.8
                    //     });
                    // }
                    break;
                case 'formulate_response':
                    await executeFormulateResponse(jobId, folderPath, action, executionResults, originalQuery);
                    // Implicit memory write disabled. Use a separate 'memory_store' action instead.
                    // if (executionResults.finalResponse) {
                    //     const targetUserId = executionResults.userProfileId;
                    //     if (targetUserId) {
                    //         await storeMemory(targetUserId, {
                    //             title: `AI Response: ${originalQuery.substring(0, 50)}...`,
                    //             content: executionResults.finalResponse,
                    //             memoryType: 'conversation',
                    //             sourceType: 'ai_analysis',
                    //             sourceId: jobId,
                    //             importance: 0.6
                    //         });
                    //     }
                    // }
                    break;
                case 'get_fitbit_data':
                    await executeFitbitData(jobId, folderPath, action, executionResults);
                    break;
                case 'get_fitbit_sleep':
                    await executeFitbitSleep(jobId, folderPath, action, executionResults);
                    break;
                case 'memory_search':
                    if (executionResults.userProfileId) {
                        try {
                            const matches = await searchMemories(executionResults.userProfileId, action.query || '', 0.7, 5);
                            executionResults.lastMemoryMatches = matches;
                            console.log(`[Job ${jobId}] memory_search found ${matches?.length || 0} matches`);
                        } catch (e) {
                            console.warn(`[Job ${jobId}] Memory search (analysis) failed:`, e.message);
                        }
                    }
                    break;
                case 'memory_store':
                    if (executionResults.userProfileId && action.query) {
                        try {
                            const contentToStore = String(action.query);
                            const title = `AI Memory: ${contentToStore.slice(0, 50)}...`;
                            await storeMemory(executionResults.userProfileId, {
                                title,
                                content: contentToStore,
                                memoryType: 'insight',
                                sourceType: 'ai_analysis',
                                sourceId: jobId,
                                importance: 0.7
                            });
                            console.log(`[Job ${jobId}] memory_store persisted ${contentToStore.length} chars`);
                        } catch (e) {
                            console.warn(`[Job ${jobId}] Memory store failed:`, e.message);
                        }
                    }
                    break;
                default:
                    console.log(`[Job ${jobId}] Unknown action type: ${action.type}`);
            }
            // Mark action as completed
            if (action.priority !== undefined) {
                completedActions.add(action.priority);
            }
        } catch (actionError) {
            const nextAttempts = attempts + 1;
            if (nextAttempts < JSON_ACTION_MAX_RETRIES) {
                attemptCounts.set(stepNum, nextAttempts);
                console.error(`[Job ${jobId}] Error executing action ${action.type}: ${actionError.message}. Retrying (${nextAttempts}/${JSON_ACTION_MAX_RETRIES})...`);
                queue.push(action);
                continue;
            } else {
                console.error(`[Job ${jobId}] Action ${action.type} failed after ${JSON_ACTION_MAX_RETRIES} attempts: ${actionError.message}`);
                // Do not requeue
            }
        }
        
        // If plan update was triggered, replace remaining queue with new plan's actions
        if (executionResults.planUpdateTriggered && executionResults.updatedPlan) {
            const newActions = (executionResults.updatedPlan.actions || []).sort((a, b) => (a.priority || 5) - (b.priority || 5));
            console.log(`[Job ${jobId}] Plan update detected! Replacing remaining actions with ${newActions.length} new actions`);
            queue = [...newActions];
            attemptCounts.clear();
            executionResults.planUpdateTriggered = false;
        }
    }
    
    // Small delay between actions to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Save execution summary
    const executionSummary = {
        totalActions: sortedActions.length,
        searchResultsFound: executionResults.searchResults.length,
        analysisCompleted: executionResults.analysisResults.length > 0,
        synthesisCompleted: executionResults.synthesisResults.length > 0,
        finalResponseGenerated: !!executionResults.finalResponse,
        fitbitDataRetrieved: !!executionResults.fitbitData,
        fitbitSleepDataRetrieved: !!executionResults.fitbitSleepData,
        timestamp: new Date().toISOString()
    };
    
    const summaryFilename = `${Date.now()}_execution_summary.json`;
    const summaryFilePath = path.join(folderPath, summaryFilename);
    await fs.writeFile(summaryFilePath, JSON.stringify(executionSummary, null, 2));
    console.log(`[Job ${jobId}] Execution summary saved to ${summaryFilename}`);

    console.log(`[Job ${jobId}] --- JSON Action Execution Complete ---`);
}

// Execute Google Search action
async function executeGoogleSearch(jobId, folderPath, action, executionResults) {
    console.log(`[Job ${jobId}] Searching Google for: "${action.query}"`);
    
    // Get Google API credentials
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const googleCseId = process.env.GOOGLE_CSE_ID;
    
    if (!googleApiKey || !googleCseId) {
        console.log(`[Job ${jobId}] Google Search not configured - skipping`);
        return;
    }
    
    try {
        const searchResults = await performGoogleSearch(action.query, googleApiKey, googleCseId);
        executionResults.searchResults.push(...searchResults);
        
        // Save search results for this specific query
        const searchFilename = `${Date.now()}_search_${action.query.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.md`;
        const searchFilePath = path.join(folderPath, searchFilename);
        const searchContent = `# Search Results: ${action.query}\n\n${searchResults.map((result, index) => 
            `**Result ${index + 1}:** ${result.title}\n${result.snippet}\nSource: ${result.link}`
        ).join('\n')}`;
        await fs.writeFile(searchFilePath, searchContent);
        
        console.log(`[Job ${jobId}] Found ${searchResults.length} results for: "${action.query}"`);
    } catch (error) {
        console.error(`[Job ${jobId}] Google search failed for "${action.query}":`, error.message);
    }
}

// Execute Analysis action - Now with intelligent plan checking
async function executeAnalyzeResults(jobId, folderPath, action, executionResults, originalQuery) {
    console.log(`[Job ${jobId}] Starting intelligent analysis: "${action.query}"`);
    
    // Call the new check_and_update_plan function
    return await check_and_update_plan(jobId, folderPath, action, executionResults, originalQuery);
}

// Intelligent Plan Checker and Updater
async function check_and_update_plan(jobId, folderPath, action, executionResults, originalQuery) {
    console.log(`[Job ${jobId}] --- Checking Progress and Updating Plan ---`);
    
    // Optionally search long-term memories relevant to this step
    let analysisMemMatches = [];
    try {
        if (executionResults.userProfileId) {
            const memoryQuery = `${originalQuery} ${action.query}`.trim();
            analysisMemMatches = await searchMemories(executionResults.userProfileId, memoryQuery, 0.7, 5);
            // Save memory matches to file
            const memFile = `${Date.now()}_memories_for_${action.query.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.json`;
            await fs.writeFile(path.join(folderPath, memFile), JSON.stringify(analysisMemMatches, null, 2));
        }
    } catch (e) {
        console.warn(`[Job ${jobId}] Memory search (analysis) failed:`, e.message);
    }

    // Prepare context from all previous steps
    const contextSummary = `
ORIGINAL USER QUERY: "${originalQuery}"

CURRENT PROGRESS ANALYSIS:
- Search Results Found: ${executionResults.searchResults.length}
- Previous Analyses: ${executionResults.analysisResults.length}
- Syntheses Completed: ${executionResults.synthesisResults.length}

SEARCH RESULTS SUMMARY:
${executionResults.searchResults.slice(0, 5).map((result, index) => 
    `${index + 1}. ${result.title}: ${result.snippet}`
).join('\n')}

CURRENT INSTRUCTION: ${action.query}

FITBIT DATA AVAILABLE: 
- Activity Data: ${executionResults.fitbitData ? 'Available' : 'Not Available'}
- Sleep Data: ${executionResults.fitbitSleepData ? 'Available' : 'Not Available'}

Use get_fitbit_data() for activity data or get_fitbit_sleep() for sleep data if relevant to analysis.

RELEVANT LONG-TERM MEMORIES:
${formatMemoriesForContext(analysisMemMatches)}
`;

    // Create the progress analysis prompt (env-overrideable)
    const progressPrompt = ENV_PROMPTS.progressAnalyzerSystem
        ? renderPrompt(ENV_PROMPTS.progressAnalyzerSystem, { originalQuery, actionQuery: action.query })
        : `You are a health-focused AI progress analyzer and plan updater. Your job is to analyze the progress of an AI research system working to answer this user query: "${originalQuery}"

CURRENT CONTEXT:
- You are reviewing what the AI system has discovered through automated searches and analysis
- The search results were gathered by another AI and may contain irrelevant or low-quality information
- The user has NOT seen any of this research yet - they are waiting for the final answer
- Your job is to critically evaluate research quality and assess if we have enough reliable information

Current analysis task: ${action.query}

Based on the AI system's research data provided below, you must:

1. **EVALUATE SEARCH RESULT QUALITY**: Critically assess the relevance and quality of Google search results. Identify any irrelevant content (gaming, entertainment, unrelated topics) that should be filtered out.

2. **ANALYZE RELIABLE RESEARCH**: Focus on the most trustworthy information:
   - Personal health data (Fitbit activity/sleep) as primary evidence
   - Medically accurate, evidence-based search results from reputable sources
   - Relevant analysis insights that align with health/wellness topics

3. **IDENTIFY KNOWLEDGE GAPS**: What critical aspects of "${originalQuery}" are missing? Are there data limitations (e.g., missing sleep data, poor search results) that affect our analysis?

4. **ASSESS COMPLETENESS**: Can we provide a helpful answer despite any search result quality issues? Do we have sufficient reliable information for a comprehensive response?

5. **RECOMMEND NEXT ACTION**: Should the system proceed to formulate the final response focusing on reliable data, or do we need additional targeted research with better search terms?

If you determine that additional research is needed, respond with the magic phrase "## UPDATED BREAKDOWN STEPS:" followed by new breakdown steps in this EXACT format:

## UPDATED BREAKDOWN STEPS:
1) [New step 1]
2) [New step 2] 
3) [New step 3]
...
N) Formulate comprehensive response combining all findings

## PROGRESS CHECK:
After steps 1-3, evaluate if enough information gathered.
Always ensure final step synthesizes everything into user response.

## EXECUTOR SYSTEM PROMPT:
You are a health-focused AI task executor. Convert the breakdown steps above into a JSON array of actions with high-quality search queries. Each action should have:
- "type": the action type - MUST be one of: google_search, analyze_results, synthesize, formulate_response, get_fitbit_data, get_fitbit_sleep, memory_search, memory_store
- "query": the specific search query or instruction
- "priority": number from 1-10 (lower = higher priority)
- "dependencies": array of step numbers this depends on

SEARCH QUALITY REQUIREMENTS:
- Use specific medical/health terminology when appropriate
- Include terms like "medical", "health", "research", "study", "clinical" to improve results
- Avoid generic terms that return irrelevant content (gaming, entertainment)
- Focus on evidence-based, scientific sources

SUPPORTED ACTION TYPES ONLY:
- google_search: Search Google for targeted health/medical information
- analyze_results: Analyze search results and filter out irrelevant content
- synthesize: Combine reliable information from multiple sources  
- formulate_response: Create evidence-based final user response
- get_fitbit_data: Get user's Fitbit activity data
- get_fitbit_sleep: Get user's Fitbit sleep data
- memory_search: Search long-term memories for context
- memory_store: Store important insights to long-term memory

MEMORY AWARENESS:
- Long-term memory functions exist (storeMemory, searchMemories). Do NOT create memory action types.
- When prior memories would help, add a note in the action's "query" text (e.g., "consult relevant prior memories about [X]") so the system can incorporate memories internally.

Return ONLY valid JSON in this format:
{
  "actions": [
    {"type": "google_search", "query": "medical causes chronic fatigue research studies", "priority": 1, "dependencies": []},
    {"type": "google_search", "query": "exercise induced fatigue recovery medical research", "priority": 2, "dependencies": []},
    {"type": "get_fitbit_data", "query": "retrieve activity data", "priority": 3, "dependencies": []},
    {"type": "analyze_results", "query": "identify relevant medical information and filter out irrelevant content", "priority": 4, "dependencies": [1,2,3]},
    {"type": "synthesize", "query": "combine medical research with personal activity data", "priority": 5, "dependencies": [4]},
    {"type": "formulate_response", "query": "create evidence-based health recommendations", "priority": 6, "dependencies": [5]}
  ]
}

IMPORTANT:
- Do NOT create new action types
- Do NOT use action types like "get_current_time", "analyze_sleep_metrics", "find_actionable_strategies", or "synthesize_recovery_plan"
- ONLY use the 8 action types listed above
- Use targeted medical/health search terms to avoid irrelevant results
- Return ONLY the JSON, nothing else

Otherwise, if current progress is sufficient, just provide your analysis in natural language format.`;

    try {
        // Call the Progress Analyzer AI
        const progressResponse = await callOpenRouterWithFallback(progressPrompt, contextSummary, jobId, 'Progress Analyzer AI');
        const progressContent = progressResponse.content || progressResponse;
        
        // Save the progress analysis
        const progressAnalysis = {
            originalQuery: originalQuery,
            actionInstruction: action.query,
            progressAssessment: progressContent,
            dataAnalyzed: {
                searchResults: executionResults.searchResults.length,
                analyses: executionResults.analysisResults.length,
                syntheses: executionResults.synthesisResults.length,
                fitbitDataAvailable: !!executionResults.fitbitData,
                fitbitSleepDataAvailable: !!executionResults.fitbitSleepData
            },
            timestamp: new Date().toISOString()
        };

        const progressFilename = `${Date.now()}_progress_analysis.json`;
        const progressFilePath = path.join(folderPath, progressFilename);
        await fs.writeFile(progressFilePath, JSON.stringify(progressAnalysis, null, 2));

        // Extract and attach key insights from progress assessment
        const analysisInsights = parseKeyInsightsFromText(progressContent || '');
        if (analysisInsights) executionResults.analysisInsights = analysisInsights;

        executionResults.analysisResults.push(progressAnalysis);
        console.log(`[Job ${jobId}] Progress analysis completed and saved to ${progressFilename}`);

        // Check if the AI response contains the magic phrase for plan updates
        if (progressContent.includes('## UPDATED BREAKDOWN STEPS:')) {
            console.log(`[Job ${jobId}] Magic phrase detected! Plan update requested by Progress Analyzer AI`);
            
            // Extract the breakdown steps and convert to JSON plan using Ollama
            const ollamaPrompt = `${progressContent}

IMPORTANT:
- Do NOT create new action types
- Do NOT use action types like "get_current_time", "analyze_sleep_metrics", "find_actionable_strategies", or "synthesize_recovery_plan"
- ONLY use the 8 action types listed above
- Use targeted medical/health search terms to avoid irrelevant results
- Return ONLY the JSON, nothing else

`;

            try {
                // Call Ollama to convert breakdown to JSON
                const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
                        prompt: ollamaPrompt,
                        format: 'json',
                        stream: false
                    })
                });

                if (ollamaResponse.ok) {
                    const ollamaData = await ollamaResponse.json();
                    const updatedPlan = JSON.parse(ollamaData.response);
                    
                    // Save the updated plan
                    const updatedPlanFilename = `${Date.now()}_updated_plan.json`;
                    const updatedPlanFilePath = path.join(folderPath, updatedPlanFilename);
                    await fs.writeFile(updatedPlanFilePath, JSON.stringify(updatedPlan, null, 2));
                    
                    // Set flags for plan update
                    executionResults.planUpdateTriggered = true;
                    executionResults.updatedPlan = updatedPlan;
                    
                    console.log(`[Job ${jobId}] Updated plan generated with ${updatedPlan.actions?.length || 0} actions`);
                } else {
                    console.error(`[Job ${jobId}] Ollama plan update failed:`, await ollamaResponse.text());
                }
            } catch (ollamaError) {
                console.error(`[Job ${jobId}] Error calling Ollama for plan update:`, ollamaError.message);
            }
        } else {
            console.log(`[Job ${jobId}] Progress analysis completed - no plan update needed`);
        }

        return executionResults;
    } catch (error) {
        console.error(`[Job ${jobId}] Progress analysis error:`, error.message);
        return await basicAnalysis(jobId, folderPath, action, executionResults);
    }
}

// Fallback basic analysis if AI analysis fails
async function basicAnalysis(jobId, folderPath, action, executionResults) {
    console.log(`[Job ${jobId}] Performing basic analysis fallback`);
    
    const analysis = {
        instruction: action.query,
        totalResults: executionResults.searchResults.length,
        keyFindings: executionResults.searchResults.slice(0, 5).map(result => ({
            title: result.title,
            snippet: result.snippet,
            relevance: 'high'
        })),
        analysisType: 'basic_fallback',
        timestamp: new Date().toISOString()
    };
    
    executionResults.analysisResults.push(analysis);
    
    // Save basic analysis
    const analysisFilename = `${Date.now()}_basic_analysis.json`;
    const analysisFilePath = path.join(folderPath, analysisFilename);
    await fs.writeFile(analysisFilePath, JSON.stringify(analysis, null, 2));
    console.log(`[Job ${jobId}] Basic analysis saved to ${analysisFilename}`);
}

// Execute Synthesis action
async function executeSynthesize(jobId, folderPath, action, executionResults, originalQuery) {
    console.log(`[Job ${jobId}] Synthesizing information with Progress Analyzer AI...`);

    const localTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' });

    // Optionally search long-term memories relevant to this step
    let synthMemMatches = [];
    try {
        if (executionResults.userProfileId) {
            const memoryQuery = `${originalQuery} ${action.query}`.trim();
            synthMemMatches = await searchMemories(executionResults.userProfileId, memoryQuery, 0.7, 5);
            const memFile = `${Date.now()}_memories_for_synthesis_${action.query.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.json`;
            await fs.writeFile(path.join(folderPath, memFile), JSON.stringify(synthMemMatches, null, 2));
        }
    } catch (e) {
        console.warn(`[Job ${jobId}] Memory search (synthesis) failed:`, e.message);
    }

    // Consolidate all gathered data for the synthesis AI
    const contextForSynthesis = `
        Current Date and Time: ${localTime}
        Original User Query: "${originalQuery}"
        Current Action Query: "${action.query}"
        
        Search Results Found:
        ${JSON.stringify(executionResults.searchResults, null, 2)}
        
        Analysis Results:
        ${JSON.stringify(executionResults.analysisResults, null, 2)}
        
        Fitbit Activity Data:
        ${JSON.stringify(executionResults.fitbitData, null, 2)}
        
        Fitbit Sleep Data:
        ${JSON.stringify(executionResults.fitbitSleepData, null, 2)}

        Relevant Long-Term Memories:
        ${JSON.stringify(synthMemMatches, null, 2)}
    `;

    const synthesisPrompt = ENV_PROMPTS.synthesisSystem
        ? renderPrompt(ENV_PROMPTS.synthesisSystem, { originalQuery, actionQuery: action.query })
        : `You are a Progress Analyzer AI specializing in health and wellness research. You are analyzing the progress of an AI research system working to answer this user query: "${originalQuery}"

CURRENT CONTEXT:
- You are reviewing what the AI system has discovered through automated searches and analysis
- The search results were gathered by another AI system and may contain irrelevant or low-quality information
- The user has NOT seen any of this research yet - they are waiting for the final answer
- Your job is to critically evaluate the research quality and assess readiness for a comprehensive response

Current synthesis task: ${action.query}

Based on the AI system's research data provided below, you must:

1. **EVALUATE SEARCH QUALITY**: Critically assess the relevance and quality of Google search results. Identify any irrelevant content (gaming, entertainment, unrelated topics) that should be filtered out.

2. **ANALYZE RELIABLE DATA**: Focus on the most trustworthy information sources:
   - Personal health data (Fitbit activity/sleep) as primary evidence
   - Medically accurate, evidence-based search results from reputable sources
   - Relevant analysis insights that align with health/wellness topics

3. **IDENTIFY KNOWLEDGE GAPS**: What critical aspects of "${originalQuery}" are missing? Are there data limitations (e.g., missing sleep data, poor search results) that affect our analysis?

4. **SYNTHESIZE FINDINGS**: Combine the reliable information into coherent insights, explicitly noting any limitations or data quality issues.

5. **ASSESS COMPLETENESS**: Can we provide a helpful answer despite any search result quality issues? Should we proceed with available data or acknowledge significant limitations?

6. **RECOMMEND NEXT ACTION**: Should the system proceed to formulate the final response, focusing on reliable data sources?

IMPORTANT: Prioritize data quality over quantity. Personal health data is most reliable. Be transparent about limitations from poor search results.

Provide your analysis in natural language format. Write a comprehensive progress assessment focusing on data quality and reliability.

At the end, add a short section titled "Key Insights to Remember" with 3-5 concise bullet points summarizing durable insights suitable for long-term memory storage.`;

    try {
        // Call the AI to perform the synthesis
        const synthesisResult = await callOpenRouterWithFallback(synthesisPrompt, contextForSynthesis, jobId, 'Progress Analyzer AI');
        const synthesisReport = {
            originalQuery: originalQuery,
            actionInstruction: action.query,
            progressAnalysis: synthesisResult.content || synthesisResult,
            dataProcessed: {
                searchResults: executionResults.searchResults.length,
                analyses: executionResults.analysisResults.length,
                fitbitDataAvailable: !!executionResults.fitbitData,
                fitbitSleepDataAvailable: !!executionResults.fitbitSleepData
            },
            timestamp: new Date().toISOString()
        };

        const synthesisFilename = `${Date.now()}_synthesis.json`;
        const synthesisFilePath = path.join(folderPath, synthesisFilename);
        await fs.writeFile(synthesisFilePath, JSON.stringify(synthesisReport, null, 2));

        // Extract and attach key insights for later memory storage
        const insights = parseKeyInsightsFromText(synthesisReport.progressAnalysis || '');
        if (insights) executionResults.synthesisInsights = insights;

        executionResults.synthesisResults.push(synthesisReport);
        console.log(`[Job ${jobId}] Progress analysis completed and saved to ${synthesisFilename}`);

    } catch (error) {
        console.error(`[Job ${jobId}] Error during synthesis AI call:`, error.message);
    }
}

// Execute Response Formulation action
async function executeFormulateResponse(jobId, folderPath, action, executionResults, originalQuery) {
    console.log(`[Job ${jobId}] Formulating final response with AI...`);

    const localTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' });

    // Optionally search long-term memories relevant to this step
    let finalMemMatches = [];
    try {
        if (executionResults.userProfileId) {
            const memoryQuery = `${originalQuery} ${action.query}`.trim();
            finalMemMatches = await searchMemories(executionResults.userProfileId, memoryQuery, 0.7, 5);
            const memFile = `${Date.now()}_memories_for_final_${action.query.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}.json`;
            await fs.writeFile(path.join(folderPath, memFile), JSON.stringify(finalMemMatches, null, 2));
        }
    } catch (e) {
        console.warn(`[Job ${jobId}] Memory search (final) failed:`, e.message);
    }

    // Consolidate all gathered data for the final response AI
    const contextForFinalResponse = `
        Current Date and Time: ${localTime}
        Original User Query: ${originalQuery}
        Fitbit Activity Data: ${JSON.stringify(executionResults.fitbitData, null, 2)}
        Fitbit Sleep Data: ${JSON.stringify(executionResults.fitbitSleepData, null, 2)}
        Search Results: ${JSON.stringify(executionResults.searchResults, null, 2)}
        Analysis Results: ${JSON.stringify(executionResults.analysisResults, null, 2)}
        Progress Synthesis: ${JSON.stringify(executionResults.synthesisResults, null, 2)}
        Relevant Long-Term Memories: ${JSON.stringify(finalMemMatches, null, 2)}
    `;

    const finalResponsePrompt = ENV_PROMPTS.finalResponseSystem
        ? renderPrompt(ENV_PROMPTS.finalResponseSystem, { originalQuery, actionQuery: action.query })
        : `You are a world-class health analyst and communicator. Your task is to provide a final, comprehensive answer to the user's original query based on the research data provided below.

IMPORTANT GUIDELINES:
- The search results were gathered by an AI research system and may contain irrelevant or low-quality information
- Critically evaluate all search results - ignore irrelevant content (gaming, entertainment, unrelated topics)
- Focus on medically accurate, evidence-based information from reputable sources
- If search results are poor quality or irrelevant, acknowledge this limitation explicitly
- Prioritize personal health data (Fitbit) as the most reliable source for individual analysis
- Do not invent information - only use what's provided in the data
- Be transparent about data gaps and limitations
 - End with a short section titled "Key Insights to Remember" summarizing 3-5 durable, generally useful insights that should be stored for future reference.

Instruction: ${action.query}

Synthesize the relevant data—filtering out irrelevant search results, focusing on quality analyses, and emphasizing personal activity/sleep data—into a clear, well-structured, and medically sound response. Use Markdown format with clear sections and actionable recommendations.`;

    try {
        // Call the AI to generate the final response
        const finalAnswerResponse = await callOpenRouterWithFallback(finalResponsePrompt, contextForFinalResponse, jobId, 'Final Response AI');
        const finalAnswer = finalAnswerResponse.content || finalAnswerResponse;

        executionResults.finalResponse = finalAnswer;

        // Save the final answer as a Markdown file
        const responseFilename = `final_answer.md`;
        const responseFilePath = path.join(folderPath, responseFilename);
        await fs.writeFile(responseFilePath, finalAnswer);
        console.log(`[Job ${jobId}] Final answer generated and saved to ${responseFilename}`);

        // Extract and store Key Insights from final response
        try {
            const finalInsights = parseKeyInsightsFromText(finalAnswer);
            if (finalInsights && executionResults.userProfileId) {
                await storeMemory(executionResults.userProfileId, {
                    title: `AI Final Insights: ${originalQuery.substring(0, 50)}...`,
                    content: finalInsights,
                    memoryType: 'insight',
                    sourceType: 'ai_analysis',
                    sourceId: jobId,
                    importance: 0.75
                });
            }
        } catch (memErr) {
            console.warn(`[Job ${jobId}] Storing final insights failed:`, memErr.message);
        }

    } catch (error) {
        console.error(`[Job ${jobId}] Error during final response AI call:`, error.message);
    }
}

// Fitbit Data Retrieval Function (callable by JSON actions)
async function executeFitbitData(jobId, folderPath, action, executionResults) {
    console.log(`[Job ${jobId}] Retrieving Fitbit activity data...`);
    
    try {
        const accessToken = await getFitbitAccessToken();
        
        if (accessToken) {
            // Default to today's date for the activity data
            const date = action.query.includes('date:') ? 
                action.query.split('date:')[1].trim().split(' ')[0] : 
                new Date().toISOString().split('T')[0];
            
            const fitbitData = await getFitbitDailySummary(accessToken, date);
            
            if (fitbitData && fitbitData.summary) {
                const activitySummary = {
                    date: date,
                    steps: fitbitData.summary.steps || 0,
                    calories: fitbitData.summary.caloriesOut || 0,
                    distance: fitbitData.summary.distances?.[0]?.distance || 0,
                    activeMinutes: (fitbitData.summary.fairlyActiveMinutes || 0) + (fitbitData.summary.veryActiveMinutes || 0),
                    restingHeartRate: fitbitData.summary.restingHeartRate || 'N/A',
                    heartRateZones: fitbitData.summary.heartRateZones || [],
                    goals: fitbitData.goals || {},
                    timestamp: new Date().toISOString()
                };

                executionResults.fitbitData = activitySummary;
                
                // Save Fitbit activity data
                const fitbitFilename = `${Date.now()}_fitbit_activity.json`;
                const fitbitFilePath = path.join(folderPath, fitbitFilename);
                await fs.writeFile(fitbitFilePath, JSON.stringify(activitySummary, null, 2));
                console.log(`[Job ${jobId}] Fitbit activity data retrieved and saved to ${fitbitFilename}`);
                
                return activitySummary;
            }
        }
        
        console.log(`[Job ${jobId}] Fitbit activity data not available`);
        return null;
        
    } catch (error) {
        console.error(`[Job ${jobId}] Fitbit data retrieval error:`, error.message);
        return null;
    }
}

// FIXED: Fitbit Sleep Data Retrieval Function (callable by JSON actions)
async function executeFitbitSleep(jobId, folderPath, action, executionResults) {
    console.log(`[Job ${jobId}] Retrieving Fitbit sleep data...`);
    
    try {
        const accessToken = await getFitbitAccessToken();
        
        if (accessToken) {
            // Default to today's date for the sleep data
            const date = action.query.includes('date:') ? 
                action.query.split('date:')[1].trim().split(' ')[0] : 
                new Date().toISOString().split('T')[0];
            
            const fitbitSleepData = await getFitbitSleepData(accessToken, date);
            
            if (fitbitSleepData && fitbitSleepData.sleep && fitbitSleepData.sleep.length > 0) {
                const mainSleep = fitbitSleepData.sleep[0]; // Get the main sleep period
                
                const sleepSummary = {
                    date: date,
                    duration: mainSleep.duration || 0,
                    minutesAsleep: mainSleep.minutesAsleep || 0,
                    minutesAwake: mainSleep.minutesAwake || 0,
                    efficiency: mainSleep.efficiency || 0,
                    startTime: mainSleep.startTime || 'N/A',
                    endTime: mainSleep.endTime || 'N/A',
                    timeInBed: mainSleep.timeInBed || 0,
                    levels: mainSleep.levels || {},
                    restlessCount: mainSleep.restlessCount || 0,
                    restlessDuration: mainSleep.restlessDuration || 0,
                    summary: fitbitSleepData.summary || {},
                    timestamp: new Date().toISOString()
                };

                executionResults.fitbitSleepData = sleepSummary;
                
                // Save Fitbit sleep data
                const fitbitSleepFilename = `${Date.now()}_fitbit_sleep.json`;
                const fitbitSleepFilePath = path.join(folderPath, fitbitSleepFilename);
                await fs.writeFile(fitbitSleepFilePath, JSON.stringify(sleepSummary, null, 2));
                console.log(`[Job ${jobId}] Fitbit sleep data retrieved and saved to ${fitbitSleepFilename}`);
                
                return sleepSummary;
            }
        }
        
        console.log(`[Job ${jobId}] Fitbit sleep data not available`);
        return null;
        
    } catch (error) {
        console.error(`[Job ${jobId}] Fitbit sleep data retrieval error:`, error.message);
        return null;
    }
}

// ============================================================================
// ADDITIONAL UTILITY ENDPOINTS
// ============================================================================
// These endpoints help users see what jobs have been completed and access results

// --- LIST ALL COMPLETED JOBS ---
// Visit: GET /jobs
// This shows all the processing jobs that have been completed
router.get('/jobs', (req, res) => {
    try {
        // Read all folders in the outputs directory
        // Each folder represents one completed job
        const jobFolders = fs.readdirSync(OUTPUTS_DIR).filter(item => {
            const fullPath = path.join(OUTPUTS_DIR, item);
            return fs.statSync(fullPath).isDirectory(); // Only include directories, not files
        });

        // Get detailed information about each job
        const jobs = jobFolders.map(jobId => {
            const jobPath = path.join(OUTPUTS_DIR, jobId);
            const files = fs.readdirSync(jobPath); // List all files in this job's folder
            
            return {
                jobId,                                    // The unique job identifier
                fileCount: files.length,                  // How many files were created
                files: files,                            // List of all file names
                created: fs.statSync(jobPath).birthtime  // When the job was created
            };
        }).sort((a, b) => new Date(b.created) - new Date(a.created)); // Sort by creation date (newest first)

        // Send the job list back to the user
        res.json({
            message: 'Available jobs',
            totalJobs: jobs.length,
            jobs: jobs
        });
    } catch (error) {
        // If something goes wrong reading the job folders, send an error
        res.status(500).json({
            error: 'Failed to list jobs',
            message: error.message
        });
    }
});

// --- DOWNLOAD A SPECIFIC FILE FROM A JOB ---
// Visit: GET /jobs/[jobId]/[filename]
// This lets users download and read specific files from completed jobs
router.get('/jobs/:jobId/:filename', (req, res) => {
    try {
        // Extract the job ID and filename from the URL
        const { jobId, filename } = req.params;
        
        // Build the full path to the requested file
        const filePath = path.join(OUTPUTS_DIR, jobId, filename);
        
        // Check if the file actually exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                error: 'File not found'
            });
        }
        
        // Read the file content and send it back to the user
        const content = fs.readFileSync(filePath, 'utf8');
        res.json({
            jobId,      // Which job this file belongs to
            filename,   // The name of the file
            content     // The actual content of the file
        });
    } catch (error) {
        // If something goes wrong reading the file, send an error
        res.status(500).json({
            error: 'Failed to read file',
            message: error.message
        });
    }
});

// ============================================================================
// OPENROUTER MODEL FALLBACK SYSTEM
// ============================================================================
// Universal fallback system for handling rate limits and model availability

async function callOpenRouterWithFallback(messages, systemContent, jobId, taskName = 'AI Task') {
    // Define fallback models from environment variables or defaults
    const fallbackModels = [
        process.env.OPENROUTER_MODEL_1 || 'qwen/qwen3-30b-a3b:free',
        process.env.OPENROUTER_MODEL_2 || 'microsoft/phi-3-mini-128k-instruct:free',
        process.env.OPENROUTER_MODEL_3 || 'meta-llama/llama-3.1-8b-instruct:free',
        process.env.OPENROUTER_MODEL_4 || 'google/gemma-2-9b-it:free',
        process.env.OPENROUTER_MODEL_5 || 'mistralai/mistral-7b-instruct:free'
    ].filter(model => model && model !== 'undefined'); // Remove any undefined models
    
    console.log(`[Job ${jobId}] ${taskName} - Available fallback models: ${fallbackModels.length}`);
    
    for (let i = 0; i < fallbackModels.length; i++) {
        const model = fallbackModels[i];
        console.log(`[Job ${jobId}] ${taskName} - Attempting model ${i + 1}/${fallbackModels.length}: ${model}`);
        
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { 
                            role: 'system', 
                            content: systemContent 
                        },
                        { 
                            role: 'user', 
                            content: messages 
                        }
                    ]
                })
            });

            if (response.ok) {
                const data = await response.json();
                const aiAnswer = data.choices[0].message.content;
                console.log(`[Job ${jobId}] ${taskName} - SUCCESS with model: ${model}`);
                return {
                    success: true,
                    content: aiAnswer,
                    model: model,
                    attempt: i + 1
                };
            } else {
                const errorText = await response.text(); 
                console.log(`[Job ${jobId}] ${taskName} - Model ${model} failed: ${response.status} ${errorText}`);
                
                // If it's a rate limit (429) or server error (5xx), try next model
                if (response.status === 429 || response.status >= 500) {
                    console.log(`[Job ${jobId}] ${taskName} - Rate limited or server error, trying next model...`);
                    continue;
                }
                
                // For other errors (4xx), still try next model but log differently
                console.log(`[Job ${jobId}] ${taskName} - Client error, trying next model anyway...`);
                continue;
            }
        } catch (fetchError) {
            console.error(`[Job ${jobId}] ${taskName} - Network error with model ${model}:`, fetchError.message);
            continue;
        }
        
        // Add delay between attempts to avoid rapid-fire requests
        if (i < fallbackModels.length - 1) {
            console.log(`[Job ${jobId}] ${taskName} - Waiting 2 seconds before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // If all models failed
    console.error(`[Job ${jobId}] ${taskName} - ALL MODELS FAILED after ${fallbackModels.length} attempts`);
    return {
        success: false,
        error: `All ${fallbackModels.length} fallback models failed`,
        attempts: fallbackModels.length
    };
}

// JSON-specific OpenRouter fallback (native JSON when supported)
async function callOpenRouterJSONWithFallback(messages, systemContent, jobId, taskName = 'AI JSON Task', jsonSchema = null) {
    // Read JSON-capable model list from env
    let jsonFallbackModels = [
        process.env.OPENROUTER_JSON_MODEL_1,
        process.env.OPENROUTER_JSON_MODEL_2,
        process.env.OPENROUTER_JSON_MODEL_3,
        process.env.OPENROUTER_JSON_MODEL_4,
        process.env.OPENROUTER_JSON_MODEL_5
    ].filter(model => model && model !== 'undefined');

    // If none provided, fall back to the general list (best-effort)
    if (jsonFallbackModels.length === 0) {
        console.warn(`[Job ${jobId}] ${taskName} - No JSON model list found in env; using general fallback list`);
        jsonFallbackModels = [
            process.env.OPENROUTER_MODEL_1 || 'qwen/qwen3-30b-a3b:free',
            process.env.OPENROUTER_MODEL_2 || 'microsoft/phi-3-mini-128k-instruct:free',
            process.env.OPENROUTER_MODEL_3 || 'meta-llama/llama-3.1-8b-instruct:free',
            process.env.OPENROUTER_MODEL_4 || 'google/gemma-2-9b-it:free',
            process.env.OPENROUTER_MODEL_5 || 'mistralai/mistral-7b-instruct:free'
        ].filter(model => model && model !== 'undefined');
    }

    console.log(`[Job ${jobId}] ${taskName} - JSON fallback models: ${jsonFallbackModels.length}`);

    for (let i = 0; i < jsonFallbackModels.length; i++) {
        const model = jsonFallbackModels[i];
        console.log(`[Job ${jobId}] ${taskName} - Attempting JSON model ${i + 1}/${jsonFallbackModels.length}: ${model}`);

        try {
            const body = {
                model: model,
                messages: [
                    { role: 'system', content: systemContent },
                    { role: 'user', content: messages }
                ]
            };

            // Prefer native JSON output when supported
            if (jsonSchema && typeof jsonSchema === 'object') {
                body.response_format = {
                    type: 'json_schema',
                    json_schema: {
                        name: 'response',
                        schema: jsonSchema,
                        strict: true
                    }
                };
            } else {
                body.response_format = { type: 'json_object' };
            }

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                const data = await response.json();
                const rawContent = data?.choices?.[0]?.message?.content;
                const content = typeof rawContent === 'string' ? rawContent.trim() : JSON.stringify(rawContent || '');

                try {
                    const parsed = JSON.parse(content);
                    console.log(`[Job ${jobId}] ${taskName} - SUCCESS with model: ${model}`);
                    return {
                        success: true,
                        json: parsed,
                        model: model,
                        attempt: i + 1,
                        raw: content
                    };
                } catch (parseErr) {
                    console.log(`[Job ${jobId}] ${taskName} - Model ${model} returned non-JSON content, trying next model...`);
                    // Try next model
                    continue;
                }
            } else {
                const errorText = await response.text();
                console.log(`[Job ${jobId}] ${taskName} - Model ${model} failed: ${response.status} ${errorText}`);

                if (response.status === 429 || response.status >= 500) {
                    console.log(`[Job ${jobId}] ${taskName} - Rate limited/server error, trying next model...`);
                    continue;
                }

                console.log(`[Job ${jobId}] ${taskName} - Client error, trying next model anyway...`);
                continue;
            }
        } catch (fetchError) {
            console.error(`[Job ${jobId}] ${taskName} - Network error with model ${model}:`, fetchError.message);
            continue;
        }

        if (i < jsonFallbackModels.length - 1) {
            console.log(`[Job ${jobId}] ${taskName} - Waiting 2 seconds before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    console.error(`[Job ${jobId}] ${taskName} - ALL JSON MODELS FAILED after ${jsonFallbackModels.length} attempts`);
    return {
        success: false,
        error: `All ${jsonFallbackModels.length} JSON fallback models failed`,
        attempts: jsonFallbackModels.length
    };
}

// ============================================================================
// EXPORT THE ROUTER
// ============================================================================
// This makes our router available to be used by the main Express app
// The main app will import this and use it to handle requests

module.exports = router;