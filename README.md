# Sleep Diary AI - Health Tracking and Analysis System

## Overview
This project is an AI-powered application designed to help users track their sleep patterns, health metrics, and daily routines. It integrates with Fitbit API for automatic data collection, analyzes user input through AI, and provides personalized recommendations for managing ADHD symptoms and improving overall well-being. Built with a modern stack including Node.js, Express, Supabase, and React, this system offers a comprehensive dashboard for monitoring health metrics, correlating them with diary entries, and generating actionable insights.

## Key Features

- **Fitbit Integration**: Automatically collects heart rate, sleep, activity, and other health metrics from a Pixel Watch 3 or compatible device.
- **AI-Driven Analysis**: Uses OpenRouter API to process user diary entries and physiological data, identifying patterns and correlations for personalized guidance.
- **Real-Time Monitoring**: Tracks and visualizes health metrics with time-series data storage in Supabase.
- **Personalized Recommendations**: Generates tailored advice based on sleep quality, heart rate variability, and mood patterns.
- **User Authentication**: Secure login with OAuth 2.0 support.
- **Dashboard Visualization**: Clean UI for viewing health trends, sleep scores, and AI-generated insights.
- **Rate Limiting**: Background polling service handles 150 requests per hour to stay within Fitbit API limits.

## Technologies Used

- **Frontend**: React.js with Tailwind CSS for responsive design
- **Backend**: Node.js with Express.js for API endpoints
- **Database**: Supabase for PostgreSQL-based storage with Row Level Security
- **API Integration**: Fitbit API for health data, OpenRouter for AI processing
- **Authentication**: Supabase Auth and OAuth 2.0
- **Build Tools**: Webpack, Babel, ESLint
- **Deployment**: Docker for containerization (optional)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account with the database schema defined in `ai/sql_for_supabase.sql`
- Fitbit developer account with credentials for OAuth 2.0 (Client ID and Secret)
- Environment variables configured (see `.env.example`)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sleep-diary-ai.git
   cd sleep-diary-ai
   ```

2. Install dependencies:
   ```bash
   npm install  # or yarn install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory with:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_key
     FITBIT_CLIENT_ID=your_fitbit_client_id
     FITBIT_CLIENT_SECRET=your_fitbit_client_secret
     JWT_SECRET=your_jwt_secret
     PORT=3000  # or your preferred port
     ```
   - Reference the `.env.example` file for full details.

4. Initialize the database:
   - Run the Supabase setup script (if needed):
     ```bash
     npx supabase db import ai/sql_for_supabase.sql
     ```
   - Ensure tables and RLS policies are applied.

### Running the Application

1. Start the backend server:
   ```bash
   npm run dev  # or yarn dev
   ```

2. Run the frontend development server:
   ```bash
   cd frontend
   npm run dev  # or yarn dev
   ```

3. Access the application at `http://localhost:4200` (port may vary).
