// Configuration file for API settings and environment variables
const CONFIG = {
    // API Configuration
    API_BASE_URL: 'https://openrouter.ai/api/v1/chat/completions', // OpenRouter API endpoint
    // Resolve API key with clear precedence: value in this file > localStorage > environment
    API_KEY: (() => {
        const FILE_KEY = '';
        const LS_KEY = (typeof window !== 'undefined' && window.localStorage ? (localStorage.getItem('OPENROUTER_API_KEY') || '').trim() : '');
        const ENV_KEY = (typeof process !== 'undefined' && process.env ? (process.env.OPENROUTER_API_KEY || '').trim() : '');
        const normalizedFileKey = FILE_KEY && !/your-openrouter-api-key-here/i.test(FILE_KEY) ? FILE_KEY.trim() : '';
        return normalizedFileKey || LS_KEY || ENV_KEY;
    })(),
    MODEL: 'openai/gpt-3.5-turbo', // Changed to a more commonly available model
    USE_API_ONLY: true, // when true, do not fallback to mock; surface errors instead
    
    // Alternative medical API endpoints (you can switch between these)
    MEDICAL_API_URL: 'https://api.healthcare.com/v1/symptoms', // Placeholder medical API
    RAPID_API_URL: 'https://symptom-checker.p.rapidapi.com/analyze', // RapidAPI symptom checker
    
    // Frontend-only mode: ML backend removed
    
    // API Headers
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.API_KEY}`,
            'HTTP-Referer': window.location.origin, // Required for OpenRouter
            'Referer': window.location.origin,      // Some proxies normalize header name
            'X-Title': 'Telemedicine AI Assistant', // Optional: App name for OpenRouter
            // For RapidAPI (uncomment if using RapidAPI)
            // 'X-RapidAPI-Key': 'your-rapidapi-key-here',
            // 'X-RapidAPI-Host': 'symptom-checker.p.rapidapi.com'
        };
    },
    
    // API Request Configuration
    REQUEST_TIMEOUT: 30000, // 30 seconds
    MAX_RETRIES: 3,
    
    // Symptom Analysis Prompt Template
        getAnalysisPrompt(symptoms) {
                return `You are a medical AI assistant. Analyze the following symptoms and return ONLY valid JSON (no markdown or prose outside JSON). Use clear, plain-English language (about 9th grade level), avoid jargon, and keep each description to 1–2 sentences.

Symptoms: ${symptoms}

Respond in this exact JSON schema:
{
    "riskLevel": "low|moderate|high",
    "probableCauses": [
        { "title": "cause name", "description": "simple explanation of what this is and why it fits the symptoms" }
    ],
    "precautions": [
        { "title": "action to take", "description": "what to do and why it helps; include when to stop or seek care if relevant" }
    ],
    "homeRemedies": [
        { "title": "remedy name", "description": "how to do it safely and what to watch for" }
    ],
    "recommendedSpecialist": "general|cardiology|neurology|dermatology|pediatrics|orthopedics",
    "urgency": "immediate|within_24_hours|within_week|routine"
}

Rules:
- Provide 3–5 items in each list when reasonable.
- Keep advice safe and conservative; do not provide prescriptions.
- If symptoms suggest an emergency, set riskLevel to "high" and urgency to "immediate".`;
        },
    
    // Error Messages
    ERROR_MESSAGES: {
        NO_API_KEY: 'API key is not configured. Please add your API key to the config file.',
        NETWORK_ERROR: 'Network error. Please check your internet connection and try again.',
        API_ERROR: 'API service error. Please try again later.',
        TIMEOUT_ERROR: 'Request timeout. Please try again.',
        INVALID_RESPONSE: 'Invalid response from API. Please try again.',
        RATE_LIMIT: 'API rate limit exceeded. Please wait a moment and try again.'
    }
};

// Environment detection
const isDevelopment = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const isProduction = !isDevelopment;

// Development mode warnings
if (isDevelopment) {
    console.warn('🔧 Development Mode: Make sure to configure your API keys in config.js');
    if (CONFIG.API_KEY === 'your-openrouter-api-key-here') {
        console.error('❌ API Key not configured! Please add your OpenRouter API key to config.js');
    } else {
        console.log('✅ API Key configured successfully');
    }
}

// Export configuration to browser global
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
} else {
    // For non-browser environments
    module.exports = CONFIG;
}

