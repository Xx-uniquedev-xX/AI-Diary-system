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
// FITBIT OAUTH AUTHENTICATION SYSTEM
// ============================================================================
// Fitbit requires special permission (OAuth) to access user's health data
// This is a security measure to protect personal information

// In-memory storage for Fitbit access tokens
// In a real production app, you'd store these in a database
let fitbitTokens = {
  access_token: null,    // The key that lets us access Fitbit data
  refresh_token: null,   // Used to get new access tokens when they expire
  expires_at: null       // When the current access token expires
};

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
  
  // Define what permissions we're asking for
  const scopes = ['activity', 'heartrate', 'profile'].join(' ');
  
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
        expires_at: Date.now() + (response.data.expires_in * 1000)  // Calculate expiration time
      };
      
      console.log('Fitbit tokens obtained successfully');
      console.log('Scopes granted:', response.data.scope);
      
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
        expires_at: Date.now() + (response.data.expires_in * 1000)
      };
      
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

    console.log(`Fetching Fitbit daily summary for: ${targetDate}`);
    
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
// MAIN AI PROCESSING ENDPOINT
// ============================================================================
// This is the heart of our application - it processes user questions with AI

// Main endpoint that starts the AI processing job
// Send POST request to /process-and-save with JSON body: {"text": "your question here"}
router.post('/process-and-save', (req, res) => {
    // Extract the user's question from the request
    const userText = req.body.text;
    
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
    processAndCritique(jobId, jobFolderPath, userText);
});

// ============================================================================
// MAIN AI PROCESSING LOGIC
// ============================================================================
// This function orchestrates the entire AI processing workflow

async function processAndCritique(jobId, folderPath, textToAnalyze) {
    console.log(`[Job ${jobId}] Starting enhanced 3-step background processing with Google Search and Fitbit integration...`);
    
    try {
        // =================================================================
        // STEP 0: GOOGLE SEARCH INTEGRATION (TEMPORARILY DISABLED)
        // =================================================================
        console.log(`[Job ${jobId}] --- Google search disabled for first turn...`);
        
        // Initialize variables for search results (empty for now)
        let searchResults = [];
        let searchSummary = "Google Search disabled for first turn - will be triggered by magic phrase.";
        
        /* TEMPORARILY COMMENTED OUT - GOOGLE SEARCH CODE
        // Get Google API credentials from environment variables
        const googleApiKey = process.env.GOOGLE_API_KEY;
        const googleCseId = process.env.GOOGLE_CSE_ID;
        
        // Only attempt search if we have the required credentials
        if (googleApiKey && googleCseId) {
            try {
                // Generate multiple search queries for comprehensive results
                const searchQueries = generateSearchQueries(textToAnalyze);
                console.log(`[Job ${jobId}] Generated search queries:`, searchQueries);
                
                // Perform all searches concurrently (faster than doing them one by one)
                const searchPromises = searchQueries.map(query =>
                    performGoogleSearch(query, googleApiKey, googleCseId)
                );
                
                // Wait for all searches to complete
                const searchResultArrays = await Promise.all(searchPromises);
                
                // Flatten the results from all searches into a single array
                searchResults = searchResultArrays.flat();
                console.log(`[Job ${jobId}] Total search results found: ${searchResults.length}`);
                
                // Create a summary of all search results for the AI to use
                if (searchResults.length > 0) {
                    searchSummary = searchResults.map((result, index) => 
                        `**Result ${index + 1}:** ${result.title}\n${result.snippet}\nSource: ${result.link}`
                    ).join('\n\n');
                } else {
                    searchSummary = "No relevant search results were found.";
                }
                
                // Save search results to a file for later reference
                const searchFilename = `${Date.now()}_search_results.md`;
                const searchFilePath = path.join(folderPath, searchFilename);
                const searchFileContent = `# Google Search Results\n\nOriginal Query: "${textToAnalyze}"\n\nSearch Queries Used: ${searchQueries.join(', ')}\n\n${searchSummary}`;
                await fs.writeFile(searchFilePath, searchFileContent);
                console.log(`[Job ${jobId}] Search results saved to ${searchFilename}`);
                
            } catch (searchError) {
                console.error(`[Job ${jobId}] Search error:`, searchError);
                searchSummary = `Google Search encountered an error: ${searchError.message}`;
            }
        } else {
            console.log(`[Job ${jobId}] Google Search not configured (missing GOOGLE_API_KEY or GOOGLE_CSE_ID)`);
        }
        END OF COMMENTED GOOGLE SEARCH CODE */
        
        // =================================================================
        // STEP 0.5: FITBIT DATA INTEGRATION
        // =================================================================
        console.log(`[Job ${jobId}] --- Fetching Fitbit daily activity summary...`);
        
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
                    
                    console.log(`[Job ${jobId}] Fitbit data retrieved successfully`);
                } else {
                    fitbitSummary = "Fitbit data could not be retrieved.";
                }
                
                // Save Fitbit data to file for reference
                const fitbitFilename = `${Date.now()}_fitbit_data.md`;
                const fitbitFilePath = path.join(folderPath, fitbitFilename);
                const fitbitFileContent = `# Fitbit Daily Activity Summary\n\nDate: ${new Date().toISOString().split('T')[0]}\n\n${fitbitSummary}\n\n## Raw Data\n\`\`\`json\n${JSON.stringify(fitbitData, null, 2)}\n\`\`\``;
                await fs.writeFile(fitbitFilePath, fitbitFileContent);
                console.log(`[Job ${jobId}] Fitbit data saved to ${fitbitFilename}`);
                
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
        
        // Create task breakdown prompt
        const localTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Singapore' });
        const breakdownPrompt = `You are a task breakdown specialist. The current date and time is ${localTime}. Your job is to analyze user queries and break them down into clear, actionable steps for an AI system to execute.

IMPORTANT CONTEXT:
- You are creating a plan for AI systems to execute, not for humans
- The AI will search Google, analyze results, and synthesize information automatically
- User's Fitbit data is already available to the system if needed
- Focus on logical sequencing: search → analyze → synthesize → respond

For the user query, create:
1. A numbered list of research and analysis steps
2. A system prompt for the JSON executor

Available action types:
- google_search: Search Google for specific information
- analyze_results: Analyze and extract insights from search results
- synthesize: Combine information from multiple sources into coherent insights
- formulate_response: Create final comprehensive answer
- get_fitbit_data: Access user's activity data (steps, calories, heart rate, etc.)

IMPORTANT: End with this EXACT phrase: "Pikachu's diapers are eaten by steve"

## BREAKDOWN STEPS:
1) [First research step]
2) [Second research step]
3) [Analysis step]
4) [Synthesis step]
5) [Final response step]

## PROGRESS CHECK:
Ensure searches cover all aspects of the query before analysis.
Verify synthesis can occur with available data before final response.
Always end with formulate_response to create the user's answer.

## EXECUTOR SYSTEM PROMPT:
You are an AI task executor. Convert the breakdown steps into a JSON array of actions.

IMPORTANT PRIORITY RULES:
- LOWER numbers = HIGHER priority (1 executes before 2)
- Search actions: priority 1-3
- Analysis actions: priority 4-5 (after searches complete)
- Synthesis: priority 6 (after analysis)
- Final response: priority 7 (last step)

Each action needs:
- "type": MUST be one of: google_search, analyze_results, synthesize, formulate_response, get_fitbit_data
- "query": specific instruction for that action
- "priority": number 1-10 (lower = executes first)
- "dependencies": array of step numbers this depends on

SUPPORTED ACTIONS:
- google_search: Search Google for information
- analyze_results: Extract insights from search results and data
- synthesize: Combine insights from multiple sources
- formulate_response: Create final comprehensive answer
- get_fitbit_data: Access user's Fitbit activity data

Return JSON only, this is important!:
{
  "actions": [
    {"type": "google_search", "query": "search term", "priority": 1, "dependencies": []},
    {"type": "analyze_results", "query": "extract key insights", "priority": 4, "dependencies": [1,2,3]},
    {"type": "synthesize", "query": "combine insights", "priority": 6, "dependencies": [4]},
    {"type": "formulate_response", "query": "create final answer", "priority": 7, "dependencies": [5]}
  ]
}

User query to break down: "${textToAnalyze}"

Remember: End with "Pikachu's diapers are eaten by steve" to trigger execution.`;
        
        // Make API call to OpenRouter (AI service)
        const firstResponse = await callOpenRouterWithFallback(breakdownPrompt, 'You are a task breakdown specialist. You analyze user queries and create numbered lists of actionable steps needed to fully answer their questions. Be specific and practical in your breakdowns.', jobId, 'Task Breakdown AI');
        
        // Check if the API call was successful
        if (!firstResponse.success) {
            const errorText = firstResponse.error;
            throw new Error(`Task Breakdown AI returned an error: ${errorText}`);
        }

        // Extract the AI's response
        const firstAiData = firstResponse.content;
        const firstAiAnswer = firstAiData;

        // Save the breakdown response to file
        const responseFilename = `${Date.now()}_response.md`;
        const responseFilePath = path.join(folderPath, responseFilename);
        const responseWithMetadata = `# AI Response\n\n**Original Query:** "${textToAnalyze}"\n\n**Search Results Included:** ${searchResults.length > 0 ? 'Yes' : 'No'}\n\n**Generated Response:**\n\n${firstAiAnswer}`;
        await fs.writeFile(responseFilePath, responseWithMetadata);
        console.log(`[Job ${jobId}] Task Breakdown AI response saved to ${responseFilename}`);

        // =================================================================
        // MAGIC PHRASE DETECTION & CONDITIONAL EXECUTION
        // =================================================================
        const magicPhrase = "Pikachu's diapers are eaten by steve";
        const shouldExecute = firstAiAnswer.includes(magicPhrase);
        
        console.log(`[Job ${jobId}] Magic phrase detection: ${shouldExecute ? 'FOUND' : 'NOT FOUND'}`);
        
        let parsedPlan = { actions: [], executed: false };
        let executionPlan = "No execution plan generated - magic phrase not detected.";

        if (shouldExecute) {
            console.log(`[Job ${jobId}] Magic phrase detected! Triggering Ollama executor...`);
            
            // =================================================================
            // STEP 2: OLLAMA AI EXECUTOR (JSON CONVERTER)
            // =================================================================
            // This AI converts the breakdown steps into executable JSON actions
            console.log(`[Job ${jobId}] --- Calling Ollama Executor AI...`);

            // Extract the breakdown steps and system prompt from the first AI response
            const breakdownSections = firstAiAnswer.split('## EXECUTOR SYSTEM PROMPT:');
            const breakdownSteps = breakdownSections[0].replace('## BREAKDOWN STEPS:', '').trim();
            const executorSystemPrompt = breakdownSections[1] ? breakdownSections[1].trim() : 
                `You are an AI task executor. Convert the breakdown steps into a JSON array of actions. 

IMPORTANT: Use ONLY these action types:
- "google_search" - for searching Google with specific queries
- "analyze_results" - for analyzing search results  
- "synthesize" - for combining information from multiple sources
- "formulate_response" - for creating final responses

Each action should have:
- "type": MUST be one of the 4 types listed above
- "query": the specific search query or instruction
- "priority": number from 1-10 (lower = higher priority)
- "dependencies": array of step numbers this depends on
Ignore the last sentence about pikachu
Return ONLY valid JSON in this format:
{
  "actions": [
    {"type": "google_search", "query": "specific search term", "priority": 1, "dependencies": []},
    {"type": "google_search", "query": "another search term", "priority": 2, "dependencies": []},
    {"type": "analyze_results", "query": "look for specific information", "priority": 3, "dependencies": [1,2]},
    {"type": "synthesize", "query": "combine philosophical and scientific perspectives", "priority": 4, "dependencies": [3]},
    {"type": "formulate_response", "query": "create comprehensive answer", "priority": 5, "dependencies": [4]}
  ]
}`;
            
            // Create the prompt for Ollama
            const ollamaPrompt = `${executorSystemPrompt}

Breakdown Steps to Convert:
${breakdownSteps}

Convert these steps into JSON actions:`;

            // Make API call to Ollama (LOCAL)
            const secondResponse = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    model: 'llama3.2:3b',
                    prompt: ollamaPrompt,
                    format: 'json',
                    stream: false
                })
            });
            
            // Check if the API call was successful
            if (!secondResponse.ok) {
                const errorText = await secondResponse.text();
                throw new Error(`Ollama Executor AI returned an error: ${secondResponse.status} ${errorText}`);
            }

            // Extract the AI's JSON response
            const secondData = await secondResponse.json();
            executionPlan = secondData.response;
            console.log(`[Job ${jobId}] Ollama Executor AI generated execution plan`);

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
                await executeJsonActions(jobId, folderPath, parsedPlan, textToAnalyze, fitbitData);
                
            } catch (parseError) {
                console.error(`[Job ${jobId}] Failed to parse execution plan JSON:`, parseError.message);
                parsedPlan = { actions: [], error: 'Invalid JSON format', executed: false };
            }
        } else {
            console.log(`[Job ${jobId}] Skipping execution - magic phrase not found in AI response`);
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

async function executeJsonActions(jobId, folderPath, parsedPlan, originalQuery, preFetchedFitbitData = null) {
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
        fitbitData: preFetchedFitbitData // Initialize with pre-fetched data
    };
    
    console.log(`[Job ${jobId}] Executing ${sortedActions.length} actions in priority order`);
    
    for (let i = 0; i < sortedActions.length; i++) {
        const action = sortedActions[i];
        console.log(`[Job ${jobId}] Executing action ${i + 1}/${sortedActions.length}: ${action.type}`);
        
        try {
            switch (action.type) {
                case 'google_search':
                    await executeGoogleSearch(jobId, folderPath, action, executionResults);
                    break;
                    
                case 'analyze_results':
                    await executeAnalyzeResults(jobId, folderPath, action, executionResults, originalQuery);
                    break;
                    
                case 'synthesize':
                    await executeSynthesize(jobId, folderPath, action, executionResults, originalQuery);
                    break;
                    
                case 'formulate_response':
                    await executeFormulateResponse(jobId, folderPath, action, executionResults, originalQuery);
                    break;
                    
                case 'get_fitbit_data':
                    await executeFitbitData(jobId, folderPath, action, executionResults);
                    break;
                    
                default:
                    console.log(`[Job ${jobId}] Unknown action type: ${action.type}`);
            }
        } catch (actionError) {
            console.error(`[Job ${jobId}] Error executing action ${action.type}:`, actionError.message);
        }
        
        // Check if plan update was triggered during analysis
        if (executionResults.planUpdateTriggered && executionResults.updatedPlan) {
            console.log(`[Job ${jobId}] Plan update detected! Switching to new execution plan...`);
            
            // Replace remaining actions with new plan
            const remainingIndex = i + 1;
            const newActions = executionResults.updatedPlan.actions || [];
            
            console.log(`[Job ${jobId}] Replacing ${sortedActions.length - remainingIndex} remaining actions with ${newActions.length} new actions`);
            
            // Remove remaining old actions and add new ones
            sortedActions.splice(remainingIndex, sortedActions.length - remainingIndex, ...newActions);
            
            // Reset the plan update flag
            executionResults.planUpdateTriggered = false;
            
            console.log(`[Job ${jobId}] Plan updated! Now executing ${sortedActions.length} total actions`);
        }
        
        // Small delay between actions to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Save execution summary
    const executionSummary = {
        totalActions: sortedActions.length,
        searchResultsFound: executionResults.searchResults.length,
        analysisCompleted: executionResults.analysisResults.length > 0,
        synthesisCompleted: executionResults.synthesisResults.length > 0,
        finalResponseGenerated: !!executionResults.finalResponse,
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

FITBIT DATA AVAILABLE: Use get_fitbit_daily_summary() function if health data is relevant to the analysis.
`;

    // Create the progress analysis prompt
    const progressPrompt = `You are an AI progress analyzer and plan updater. Your job is to:

1. Analyze the current progress and search results
2. Determine if the current plan is sufficient or needs updates
3. If updates needed, create NEW breakdown steps (like the first AI does)
4. Always ensure the final step is "formulate_response"

Available Functions:
- get_fitbit_daily_summary(): Returns user's daily activity, steps, calories, heart rate data

AVAILABLE ACTION TYPES (use ONLY these in your breakdown steps):
- google_search: Search Google for information
- analyze_results: Analyze search results or data
- synthesize: Combine information from multiple sources
- formulate_response: Create final user response
- get_fitbit_data: Get user's Fitbit activity data

Context from previous steps:
${contextSummary}

Based on this progress, you should:
A) If current plan is sufficient: Just say "Current plan is sufficient, continue execution"
B) If plan needs updates: Create NEW breakdown steps in this EXACT format:

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
You are an AI task executor. Convert the breakdown steps above into a JSON array of actions. Each action should have:
- "type": the action type - MUST be one of: google_search, analyze_results, synthesize, formulate_response, get_fitbit_data
- "query": the specific search query or instruction
- "priority": number from 1-10
- "dependencies": array of step numbers this depends on

SUPPORTED ACTION TYPES ONLY:
- google_search: Search Google for information
- analyze_results: Analyze search results or data
- synthesize: Combine information from multiple sources  
- formulate_response: Create final user response
- get_fitbit_data: Get user's Fitbit activity data

Return ONLY valid JSON in this format:
{
  "actions": [
    {"type": "google_search", "query": "specific search term", "priority": 1, "dependencies": []},
    {"type": "analyze_results", "query": "look for specific information", "priority": 2, "dependencies": [1]},
    {"type": "formulate_response", "query": "create comprehensive answer", "priority": 3, "dependencies": [2]}
  ]
}

IMPORTANT: If you create new breakdown steps, end your response with this EXACT magic phrase: "Steve ran away with pikachu's diapers in the wild west"

Provide your analysis:`;

    try {
        // Call OpenRouter with fallback for progress analysis
        const progressResponse = await callOpenRouterWithFallback(
            progressPrompt, 
            'You are an intelligent progress analyzer. You review search results and execution progress. If the current plan is working, say so. If major updates are needed, create new breakdown steps like the first AI does, with the same format and structure. Always ensure final step is formulate_response.',
            jobId, 
            'Progress Analyzer AI'
        );

        if (!progressResponse.success) {
            console.log(`[Job ${jobId}] Progress analysis failed, continuing with basic analysis`);
            return await basicAnalysis(jobId, folderPath, action, executionResults);
        }

        const analysisResult = progressResponse.content;
        
        // Save the progress analysis as markdown (NOT JSON)
        const analysisFilename = `${Date.now()}_progress_analysis.md`;
        const analysisFilePath = path.join(folderPath, analysisFilename);
        const analysisContent = `# Progress Analysis\n\n**Instruction:** ${action.query}\n\n**AI Analysis:**\n\n${analysisResult}`;
        await fs.writeFile(analysisFilePath, analysisContent);
        console.log(`[Job ${jobId}] Progress analysis saved to ${analysisFilename}`);

        // Check for NEW magic phrase to trigger plan update
        const planUpdatePhrase = "Steve ran away with pikachu's diapers in the wild west";
        const shouldUpdatePlan = analysisResult.includes(planUpdatePhrase);
        
        if (shouldUpdatePlan) {
            console.log(`[Job ${jobId}] Plan update magic phrase detected! Calling Ollama to generate new JSON plan...`);
            
            // Extract the breakdown steps and system prompt from the progress analysis response
            const breakdownSections = analysisResult.split('## EXECUTOR SYSTEM PROMPT:');
            const breakdownSteps = breakdownSections[0].replace('## UPDATED BREAKDOWN STEPS:', '').trim();
            const executorSystemPrompt = breakdownSections[1] ? breakdownSections[1].trim() : 
                `You are an AI task executor. Convert the breakdown steps into a JSON array of actions. 

IMPORTANT: Use ONLY these action types:
- "google_search" - for searching Google with specific queries
- "analyze_results" - for analyzing search results  
- "synthesize" - for combining information from multiple sources
- "formulate_response" - for creating final responses

Each action should have:
- "type": MUST be one of the 4 types listed above
- "query": the specific search query or instruction
- "priority": number from 1-10 (lower = higher priority)
- "dependencies": array of step numbers this depends on

Return ONLY valid JSON in this format:
{
  "actions": [
    {"type": "google_search", "query": "specific search term", "priority": 1, "dependencies": []},
    {"type": "google_search", "query": "another search term", "priority": 2, "dependencies": []},
    {"type": "analyze_results", "query": "look for specific information", "priority": 3, "dependencies": [1,2]},
    {"type": "synthesize", "query": "combine philosophical and scientific perspectives", "priority": 4, "dependencies": [3]},
    {"type": "formulate_response", "query": "create comprehensive answer", "priority": 5, "dependencies": [4]}
  ]
}`;
            
            // Create the prompt for Ollama (EXACT COPY from first AI)
            const ollamaPrompt = `${executorSystemPrompt}

Breakdown Steps to Convert:
${breakdownSteps}

Convert these steps into JSON actions:`;

            // Make API call to Ollama (LOCAL) - EXACT COPY from first AI
            const secondResponse = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    model: 'llama3.2:3b',
                    prompt: ollamaPrompt,
                    format: 'json',
                    stream: false
                })
            });
            
            // Check if the API call was successful
            if (!secondResponse.ok) {
                const errorText = await secondResponse.text();
                console.error(`[Job ${jobId}] Ollama Executor AI returned an error: ${secondResponse.status} ${errorText}`);
            } else {
                // Extract the AI's JSON response
                const secondData = await secondResponse.json();
                const updatedExecutionPlan = secondData.response;
                console.log(`[Job ${jobId}] Ollama Executor AI generated updated execution plan`);

                // Save the execution plan to file
                const executionFilename = `${Date.now()}_updated_plan.json`;
                const executionFilePath = path.join(folderPath, executionFilename);
                await fs.writeFile(executionFilePath, updatedExecutionPlan);
                console.log(`[Job ${jobId}] Updated execution plan saved to ${executionFilename}`);

                // Parse the JSON to validate it
                try {
                    const newPlan = JSON.parse(updatedExecutionPlan);
                    console.log(`[Job ${jobId}] Updated execution plan parsed successfully:`, newPlan.actions?.length || 0, 'actions');
                    
                    // Store the updated plan for main executor to use
                    executionResults.updatedPlan = newPlan;
                    executionResults.planUpdateTriggered = true;
                    
                } catch (parseError) {
                    console.error(`[Job ${jobId}] Failed to parse updated execution plan JSON:`, parseError.message);
                }
            }
        } else {
            console.log(`[Job ${jobId}] Analysis complete - continuing with current plan (no updates needed)`);
        }

        // Store analysis results (as regular data, not JSON output)
        const analysis = {
            instruction: action.query,
            aiAnalysis: analysisResult,
            planUpdated: shouldUpdatePlan,
            searchResultsAnalyzed: executionResults.searchResults.length,
            analysisType: 'intelligent_progress_check',
            timestamp: new Date().toISOString()
        };
        
        executionResults.analysisResults.push(analysis);
        
    } catch (error) {
        console.error(`[Job ${jobId}] Progress analysis error:`, error.message);
        return await basicAnalysis(jobId, folderPath, action, executionResults);
    }
}

// Generate updated execution plan using Ollama
async function generateUpdatedPlan(jobId, folderPath, analysisResult, executionResults) {
    console.log(`[Job ${jobId}] --- Generating Updated Execution Plan ---`);
    
    const updatePrompt = `Based on the progress analysis, generate an updated execution plan.

Progress Analysis:
${analysisResult}

Current Results Summary:
- Search results: ${executionResults.searchResults.length}
- Analyses completed: ${executionResults.analysisResults.length}

Generate a JSON plan with new actions to complete the research. Use ONLY these action types:
- "google_search" - for new searches based on findings
- "get_fitbit_data" - to retrieve health data if relevant
- "analyze_results" - for deeper analysis
- "synthesize" - to combine information
- "formulate_response" - for final response

Return ONLY valid JSON:`;

    try {
        // Call local Ollama for JSON generation
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                model: 'llama3.2:3b',
                prompt: updatePrompt,
                format: 'json',
                stream: false
            })
        });

        if (response.ok) {
            const data = await response.json();
            const planJson = JSON.parse(data.response);
            console.log(`[Job ${jobId}] Updated plan generated successfully`);
            return planJson;
        }
    } catch (error) {
        console.error(`[Job ${jobId}] Failed to generate updated plan:`, error.message);
    }
    
    return null;
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

    // Consolidate all gathered data for the synthesis AI
    const contextForSynthesis = `
        Current Date and Time: ${localTime}
        Original User Query: "${originalQuery}"
        Current Action Query: "${action.query}"
        
        Search Results Found:
        ${JSON.stringify(executionResults.searchResults, null, 2)}
        
        Analysis Results:
        ${JSON.stringify(executionResults.analysisResults, null, 2)}
        
        Fitbit Data:
        ${JSON.stringify(executionResults.fitbitData, null, 2)}
    `;

    const synthesisPrompt = `You are a Progress Analyzer AI. You are analyzing the progress of an AI research system that is working to answer this user query: "${originalQuery}"

CURRENT CONTEXT:
- You are reviewing what the AI system has discovered through automated searches and analysis
- The user has NOT seen any of this research yet - they are waiting for the final answer
- Your job is to synthesize the AI's findings and assess if we're ready to provide a comprehensive response

Current synthesis task: ${action.query}

Based on the AI system's research data provided below, you must:

1. **ANALYZE RESEARCH PROGRESS**: Review what information the AI system has gathered from Google searches, analysis, and Fitbit data. What key insights have emerged from the automated research?

2. **IDENTIFY KNOWLEDGE GAPS**: What important aspects of the original query "${originalQuery}" are still missing from our research? What contradictions exist in the findings?

3. **SYNTHESIZE FINDINGS**: Combine the search results, analysis insights, and personal data (Fitbit) into a coherent understanding that addresses the user's question.

4. **ASSESS COMPLETENESS**: Do we have sufficient information to provide a comprehensive answer to "${originalQuery}"? Are there critical gaps that would make our response incomplete?

5. **RECOMMEND NEXT ACTION**: Should the system proceed to formulate the final response, or do we need additional specific research first?

IMPORTANT: Remember that the user hasn't seen any of this research data - they're waiting for a final synthesized answer. Focus on whether our AI research system has gathered enough information to provide a complete, helpful response.

Provide your analysis in natural language format. Write a comprehensive progress assessment of the AI system's research findings.`;

    try {
        // Call the AI to perform the synthesis
        const synthesisResult = await callOpenRouterWithFallback(synthesisPrompt, contextForSynthesis, jobId, 'Progress Analyzer AI');
        
        const synthesisReport = {
            originalQuery: originalQuery,
            actionInstruction: action.query,
            progressAnalysis: synthesisResult,
            dataProcessed: {
                searchResults: executionResults.searchResults.length,
                analyses: executionResults.analysisResults.length,
                fitbitDataAvailable: !!executionResults.fitbitData
            },
            timestamp: new Date().toISOString()
        };

        const synthesisFilename = `${Date.now()}_synthesis.json`;
        const synthesisFilePath = path.join(folderPath, synthesisFilename);
        await fs.writeFile(synthesisFilePath, JSON.stringify(synthesisReport, null, 2));

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

    // Consolidate all gathered data for the final response AI
    const contextForFinalResponse = `
        Current Date and Time: ${localTime}
        Original User Query: ${originalQuery}
        Fitbit Data: ${JSON.stringify(executionResults.fitbitData, null, 2)}
        Search Results: ${JSON.stringify(executionResults.searchResults, null, 2)}
        Analysis Results: ${JSON.stringify(executionResults.analysisResults, null, 2)}
        Progress Synthesis: ${JSON.stringify(executionResults.synthesisResults, null, 2)}
    `;

    const finalResponsePrompt = `You are a world-class analyst and communicator. Your task is to provide a final, comprehensive answer to the user's original query based *only* on the information provided below. Do not invent information. 

Instruction: ${action.query}

Synthesize all the data provided—search results, analyses, and personal data—into a clear, well-structured, and insightful response. The response should be in Markdown format.`;

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
            const date = action.query || new Date().toISOString().split('T')[0];
            const fitbitData = await getFitbitDailySummary(accessToken, date);
            
            if (fitbitData && fitbitData.summary) {
                const activitySummary = {
                    steps: fitbitData.summary.steps || 0,
                    calories: fitbitData.summary.caloriesOut || 0,
                    distance: fitbitData.summary.distances?.[0]?.distance || 0,
                    activeMinutes: (fitbitData.summary.fairlyActiveMinutes || 0) + (fitbitData.summary.veryActiveMinutes || 0),
                    restingHeartRate: fitbitData.summary.restingHeartRate || 'N/A',
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

// ============================================================================
// EXPORT THE ROUTER
// ============================================================================
// This makes our router available to be used by the main Express app
// The main app will import this and use it to handle requests
module.exports = router;