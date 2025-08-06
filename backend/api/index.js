// This code creates a web server that takes user questions and provides enhanced AI responses

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
    console.log(`Using OAuth access token: ${accessToken.substring(0, 10)}...`); // Show first 10 chars only for security
    console.log(`API URL: https://api.fitbit.com/1/user/-/activities/date/${targetDate}.json`);
    
    // Make request to Fitbit API
    const response = await axios.get(
      `https://api.fitbit.com/1/user/-/activities/date/${targetDate}.json`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`  // Use Bearer token authentication
        }
      }
    );
    
    // Check if we got data back
    if (response.data) {
      console.log('Fitbit daily summary retrieved successfully');
      console.log('Data includes:', Object.keys(response.data));
      return response.data;
    } else {
      throw new Error('No data in Fitbit response');
    }
  } catch (error) {
    console.error('Fitbit API error:', error.response?.data || error.message);
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
        // STEP 0: GOOGLE SEARCH INTEGRATION
        // =================================================================
        console.log(`[Job ${jobId}] --- Performing Google searches...`);
        
        // Get Google API credentials from environment variables
        const googleApiKey = process.env.GOOGLE_API_KEY;
        const googleCseId = process.env.GOOGLE_CSE_ID;
        
        // Initialize variables for search results
        let searchResults = [];
        let searchSummary = "Google Search was not configured or failed.";
        
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
                const searchResultsArrays = await Promise.all(searchPromises);
                
                // Combine all results and remove duplicates
                const allResults = searchResultsArrays.flat();
                searchResults = allResults.filter((result, index, self) =>
                    index === self.findIndex(r => r.link === result.link)
                ).slice(0, 8); // Keep only top 8 unique results
                
                console.log(`[Job ${jobId}] Found ${searchResults.length} unique search results`);
                
                // Create a readable summary of search results for AI context
                if (searchResults.length > 0) {
                    searchSummary = `Based on Google searches, here are relevant research findings:\n\n`;
                    searchResults.forEach((result, index) => {
                        searchSummary += `${index + 1}. **${result.title}**\n`;
                        searchSummary += `   ${result.snippet}\n`;
                        searchSummary += `   Source: ${result.link}\n\n`;
                    });
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
        // STEP 1: FIRST AI CALL (THE GENERATOR)
        // =================================================================
        // This AI call generates an initial response using search context
        console.log(`[Job ${jobId}] --- Calling Generator AI with search context...`);
        
        // Create enhanced prompt that includes search results
        const enhancedUserPrompt = `User Query: "${textToAnalyze}"

${searchSummary}

Please provide a comprehensive response to the user's query, incorporating relevant information from the search results above where applicable.`;
        
        // Make API call to OpenRouter (AI service)
        const firstResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                model: 'qwen/qwen3-30b-a3b:free', // Free AI model that works well
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are a helpful assistant that provides comprehensive, research-backed responses. When search results are provided, integrate them naturally into your response while maintaining accuracy and helpfulness.' 
                    },
                    { 
                        role: 'user', 
                        content: enhancedUserPrompt 
                    }
                ]
            })
        });

        // Check if the API call was successful
        if (!firstResponse.ok) {
            const errorText = await firstResponse.text();
            throw new Error(`Generator AI returned an error: ${firstResponse.status} ${errorText}`);
        }

        // Extract the AI's response
        const firstAiData = await firstResponse.json();
        const firstAiAnswer = firstAiData.choices[0].message.content;

        // Save the first AI response to a file
        const responseFilename = `${Date.now()}_response.md`;
        const responseFilePath = path.join(folderPath, responseFilename);
        const responseWithMetadata = `# AI Response\n\n**Original Query:** "${textToAnalyze}"\n\n**Search Results Included:** ${searchResults.length > 0 ? 'Yes' : 'No'}\n\n**Generated Response:**\n\n${firstAiAnswer}`;
        await fs.writeFile(responseFilePath, responseWithMetadata);
        console.log(`[Job ${jobId}] Generator AI response saved to ${responseFilename}`);

        // =================================================================
        // STEP 2: SECOND AI CALL (THE CRITIC)
        // =================================================================
        // This AI analyzes the first response and provides constructive criticism
        console.log(`[Job ${jobId}] --- Calling Critic AI with enhanced context...`);

        // Create a detailed critique prompt
        const critiquePrompt = `
        The original user query was:
        "${textToAnalyze}"

        Google Search Context:
        ${searchSummary}

        A helpful assistant responded with the following text:
        ---
        ${firstAiAnswer}
        ---

        Your task is to analyze the assistant's response based on:
        1. How well it addresses the original query
        2. How effectively it incorporates the search results and research findings
        3. Any factual errors or missed opportunities
        4. The overall quality and helpfulness of the response
        5. Suggestions for improvement

        Please provide constructive criticism and specific recommendations for enhancement.
        `;

        // Make API call for critique
        const secondResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                model: 'qwen/qwen3-30b-a3b:free', 
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are an AI agent specializing in finding flaws and providing constructive criticism. You analyze responses for accuracy, completeness, research integration, and overall quality. You provide specific, actionable feedback for improvement.' 
                    },
                    { 
                        role: 'user', 
                        content: critiquePrompt 
                    }
                ]
            })
        });
        
        // Check if the critique API call was successful
        if (!secondResponse.ok) {
            const errorText = await secondResponse.text();
            throw new Error(`Critic AI returned an error: ${secondResponse.status} ${errorText}`);
        }

        // Extract the critique response
        const secondAiData = await secondResponse.json();
        const secondAiAnswer = secondAiData.choices[0].message.content;

        // Save the critique to a separate file
        const critiqueFilename = `${Date.now()}_critique.md`;
        const critiqueFilePath = path.join(folderPath, critiqueFilename);
        const critiqueWithMetadata = `# AI Critique\n\n**Original Query:** "${textToAnalyze}"\n\n**Search Results Available:** ${searchResults.length > 0 ? 'Yes' : 'No'}\n\n**Critique Analysis:**\n\n${secondAiAnswer}`;
        await fs.writeFile(critiqueFilePath, critiqueWithMetadata);
        console.log(`[Job ${jobId}] Critic AI response saved to ${critiqueFilename}`);

        // =================================================================
        // STEP 3: THIRD AI CALL (THE IMPROVER)
        // =================================================================
        // This AI creates a final improved response based on the critique and health data
        console.log(`[Job ${jobId}] --- Calling Improver AI with complete context...`);

        // Create comprehensive improvement prompt
        const improvementPrompt = `
        The original user query was:
        "${textToAnalyze}"

        Google Search Context:
        ${searchSummary}

        Personal Health Data (Fitbit):
        ${fitbitSummary}

        Initial AI Response:
        ---
        ${firstAiAnswer}
        ---

        Critique and Analysis:
        ---
        ${secondAiAnswer}
        ---

        Your task is to generate a completely new improved response that:
        1. Incorporates the critique feedback to address any identified issues
        2. Integrates relevant Fitbit health data insights where applicable
        3. Maintains the valuable information from the original response
        4. Provides personalized recommendations based on the user's current activity levels and health metrics
        5. Uses the Google search results to support evidence-based suggestions

        Generate a comprehensive, improved response that addresses the original query with enhanced personalization and accuracy.
        `;

        // Make API call for the improved response
        const thirdResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                model: 'qwen/qwen3-30b-a3b:free',
                messages: [
                    { 
                        role: 'system', 
                        content: 'You are an AI assistant specializing in creating improved, personalized responses. You excel at integrating health data, research findings, and critique feedback to generate comprehensive, actionable advice. Focus on providing practical, evidence-based recommendations that consider the user\'s personal health metrics and activity levels.' 
                    },
                    { 
                        role: 'user', 
                        content: improvementPrompt 
                    }
                ]
            })
        });
        
        // Check if the improvement API call was successful
        if (!thirdResponse.ok) {
            const errorText = await thirdResponse.text();
            throw new Error(`Improver AI returned an error: ${thirdResponse.status} ${errorText}`);
        }

        // Extract the improved response
        const thirdAiData = await thirdResponse.json();
        const thirdAiAnswer = thirdAiData.choices[0].message.content;

        // Save the final improved response to a file
        const improvedFilename = `${Date.now()}_improved_response.md`;
        const improvedFilePath = path.join(folderPath, improvedFilename);
        const improvedWithMetadata = `# Improved AI Response\n\n**Original Query:** "${textToAnalyze}"\n\n**Enhancements Applied:**\n- ✅ Critique feedback integration\n- ✅ Fitbit health data personalization\n- ✅ Google search evidence support\n\n**Final Improved Response:**\n\n${thirdAiAnswer}`;
        await fs.writeFile(improvedFilePath, improvedWithMetadata);
        console.log(`[Job ${jobId}] Improved AI response saved to ${improvedFilename}`);

        // =================================================================
        // STEP 4: CREATE SUMMARY FILE
        // =================================================================
        // Create a summary document that gives an overview of the entire process
        const summaryContent = `# Job Summary\n\n**Job ID:** ${jobId}\n**Timestamp:** ${new Date().toISOString()}\n**Original Query:** "${textToAnalyze}"\n\n## Process Completed:\n✅ Google Search (${searchResults.length} results found)\n✅ Fitbit Data Integration (${fitbitData ? 'Success' : 'Failed'})\n✅ AI Generator Response\n✅ AI Critic Analysis\n✅ AI Improved Response\n\n## Files Generated:\n- Search Results: search_results.md\n- Fitbit Data: fitbit_data.md\n- AI Response: response.md\n- AI Critique: critique.md\n- Improved Response: improved_response.md\n- This Summary: summary.md\n\n## Search Queries Used:\n${generateSearchQueries(textToAnalyze).map(q => `- "${q}"`).join('\n')}\n\n## Health Data Summary:\n${fitbitData ? `Steps: ${fitbitData.summary?.steps || 0}, Calories: ${fitbitData.summary?.caloriesOut || 0}` : 'No health data available'}`;
        
        // Save the summary file
        const summaryFilename = `${Date.now()}_summary.md`;
        const summaryFilePath = path.join(folderPath, summaryFilename);
        await fs.writeFile(summaryFilePath, summaryContent);
        console.log(`[Job ${jobId}] Summary saved to ${summaryFilename}`);

        console.log(`[Job ${jobId}] SUCCESS! Full enhanced 3-step process complete with Google Search and Fitbit integration.`);

    } catch (error) {
        // If any step fails, log the error and save it to a file
        console.error(`[Job ${jobId}] ERROR during processing:`, error);
        const errorFilePath = path.join(folderPath, 'error.txt');
        await fs.writeFile(errorFilePath, `Error occurred during processing:\n\n${error.toString()}\n\nStack trace:\n${error.stack}`);
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
// EXPORT THE ROUTER
// ============================================================================
// This makes our router available to be used by the main Express app
// The main app will import this and use it to handle requests
module.exports = router;