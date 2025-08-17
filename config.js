// Configuration file for API settings and environment variables
const CONFIG = {
    // API Configuration
    API_BASE_URL: 'https://openrouter.ai/api/v1/chat/completions', // OpenRouter API endpoint
    API_KEY: (typeof window !== 'undefined' && window.localStorage ? (localStorage.getItem('OPENROUTER_API_KEY') || '').trim() : '') || process.env.OPENROUTER_API_KEY || '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',
    MODEL: 'openai/gpt-4o-mini',
    USE_API_ONLY: true, // when true, do not fallback to mock; surface errors instead
    
    // Alternative medical API endpoints (you can switch between these)
    MEDICAL_API_URL: 'https://api.healthcare.com/v1/symptoms', // Placeholder medical API
    RAPID_API_URL: 'https://symptom-checker.p.rapidapi.com/analyze', // RapidAPI symptom checker
    
    // Flask Backend (for ML image processing)
    FLASK_API_BASE_URL: 'http://localhost:5000',
    FLASK_ANALYZE_ENDPOINT: '/analyze', // POST multipart/form-data { symptoms, image }
    
    // API Headers
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.API_KEY}`,
            'HTTP-Referer': window.location.origin, // Required for OpenRouter
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
        return `You are a medical AI assistant. Analyze the following symptoms and provide a structured response in JSON format:

Symptoms: ${symptoms}

Please provide analysis in this exact JSON format:
{
    "riskLevel": "low|moderate|high",
    "probableCauses": ["cause1", "cause2", "cause3"],
    "precautions": ["precaution1", "precaution2", "precaution3"],
    "homeRemedies": ["remedy1", "remedy2", "remedy3"],
    "recommendedSpecialist": "general|cardiology|neurology|dermatology|pediatrics|orthopedics",
    "urgency": "immediate|within_24_hours|within_week|routine"
}

Risk levels:
- "low": Minor symptoms, can be managed at home
- "moderate": Symptoms requiring medical attention but not emergency
- "high": Serious symptoms requiring immediate medical attention

Be conservative in risk assessment. Always prioritize patient safety.`;
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
