// API Service for handling all external API calls
class ApiService {
    constructor() {
        this.config = (typeof window !== 'undefined' && window.CONFIG) ? window.CONFIG : {};
        this.retryCount = 0;
    }

    // Main symptom analysis method
    async analyzeSymptoms(symptoms) {
        try {
            // Validate API key
            if (!this.config.API_KEY || this.config.API_KEY === 'your-openrouter-api-key-here') {
                throw new Error(this.config.ERROR_MESSAGES.NO_API_KEY);
            }

            // Validate symptoms input
            if (!symptoms || symptoms.trim().length < 10) {
                throw new Error('Please provide more detailed symptoms (at least 10 characters)');
            }

            console.log('🔍 Analyzing symptoms:', symptoms.substring(0, 50) + '...');

            // Make API call with retry logic
            const response = await this.makeApiCall(symptoms);
            
            // Parse and validate response
            const analysis = this.parseApiResponse(response);
            
            console.log('✅ Analysis completed:', analysis.riskLevel);
            return analysis;

        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            throw error;
        }
    }

    // Generate specific diagnosis for a skin condition
    generateDiagnosisForCondition(condition, symptoms) {
        const diagnosisTemplates = {
            'Eczema': {
                probableCauses: [
                    'Atopic dermatitis (genetic predisposition)',
                    'Environmental triggers (allergens, irritants)',
                    'Dry skin and weather changes',
                    'Stress and immune system response'
                ],
                precautions: [
                    'Avoid harsh soaps and hot water',
                    'Use fragrance-free moisturizers',
                    'Identify and avoid trigger factors',
                    'Keep skin well-hydrated'
                ],
                homeRemedies: [
                    'Apply coconut oil or petroleum jelly',
                    'Use colloidal oatmeal baths',
                    'Apply cool compresses to reduce itching',
                    'Take lukewarm showers instead of hot baths'
                ],
                recommendedSpecialist: 'dermatology',
                urgency: 'within_week'
            },
            'Psoriasis': {
                probableCauses: [
                    'Autoimmune disorder',
                    'Genetic factors',
                    'Environmental triggers',
                    'Immune system dysfunction'
                ],
                precautions: [
                    'Avoid skin injuries and trauma',
                    'Manage stress levels',
                    'Avoid smoking and excessive alcohol',
                    'Protect skin from sun exposure'
                ],
                homeRemedies: [
                    'Apply moisturizing creams regularly',
                    'Use coal tar products',
                    'Take warm baths with Epsom salts',
                    'Expose skin to natural sunlight (in moderation)'
                ],
                recommendedSpecialist: 'dermatology',
                urgency: 'within_week'
            },
            'Melanoma': {
                probableCauses: [
                    'Excessive UV radiation exposure',
                    'Genetic predisposition',
                    'Fair skin and light eyes',
                    'History of severe sunburns'
                ],
                precautions: [
                    'Immediate medical evaluation required',
                    'Avoid sun exposure completely',
                    'Regular skin examinations',
                    'Use broad-spectrum sunscreen'
                ],
                homeRemedies: [
                    'DO NOT attempt home treatment',
                    'Seek immediate medical attention',
                    'Document any changes in the lesion',
                    'Protect the area from further trauma'
                ],
                recommendedSpecialist: 'dermatology',
                urgency: 'immediate'
            },
            'Basal Cell Carcinoma (BCC)': {
                probableCauses: [
                    'Chronic sun exposure',
                    'Fair skin and light eyes',
                    'History of sunburns',
                    'Weakened immune system'
                ],
                precautions: [
                    'Immediate dermatological evaluation',
                    'Avoid sun exposure',
                    'Regular skin cancer screenings',
                    'Protect skin with clothing and sunscreen'
                ],
                homeRemedies: [
                    'DO NOT attempt home treatment',
                    'Seek medical attention promptly',
                    'Protect the area from trauma',
                    'Document any changes'
                ],
                recommendedSpecialist: 'dermatology',
                urgency: 'within_24_hours'
            }
        };

        // Get template for the condition or use default
        const template = diagnosisTemplates[condition.name] || {
            probableCauses: [
                'Skin condition requiring evaluation',
                'Possible inflammatory response',
                'Environmental or genetic factors'
            ],
            precautions: [
                'Avoid scratching or irritating the area',
                'Keep the area clean and dry',
                'Protect from sun exposure',
                'Monitor for changes'
            ],
            homeRemedies: [
                'Apply gentle moisturizer',
                'Use mild, fragrance-free cleansers',
                'Avoid harsh chemicals',
                'Keep the area protected'
            ],
            recommendedSpecialist: 'dermatology',
            urgency: condition.riskLevel === 'high' ? 'within_24_hours' : 'within_week'
        };

        return {
            riskLevel: condition.riskLevel,
            probableCauses: template.probableCauses,
            precautions: template.precautions,
            homeRemedies: template.homeRemedies,
            recommendedSpecialist: template.recommendedSpecialist,
            urgency: template.urgency
        };
    }

    // Make API call with retry logic
    async makeApiCall(symptoms) {
        const maxRetries = this.config.MAX_RETRIES;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 API attempt ${attempt}/${maxRetries}`);
                
                const response = await this.callOpenRouter(symptoms);
                return response;
                
            } catch (error) {
                console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Wait before retry (exponential backoff)
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                await this.sleep(delay);
            }
        }
    }

    // Call OpenRouter API
    async callOpenRouter(symptoms) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.REQUEST_TIMEOUT);

        try {
            const requestBody = {
                model: this.config.MODEL || "openai/gpt-4o-mini", // OpenRouter recommended lightweight model
                messages: [
                    {
                        role: "system",
                        content: "You are a medical AI assistant. Provide accurate, helpful, and safe medical information. Always prioritize patient safety and recommend professional medical consultation when appropriate."
                    },
                    {
                        role: "user",
                        content: this.config.getAnalysisPrompt(symptoms)
                    }
                ],
                temperature: 0.3,
                max_tokens: 700
            };

            console.log('📤 Sending API request to:', this.config.API_BASE_URL);
            console.log('📋 Request body:', JSON.stringify(requestBody, null, 2));
            console.log('🔑 Headers:', this.config.getHeaders());

            const response = await fetch(this.config.API_BASE_URL, {
                method: 'POST',
                headers: this.config.getHeaders(),
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log('📥 Response status:', response.status);
            console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ API Error Response:', errorData);
                throw this.handleApiError(response.status, errorData);
            }

            const data = await response.json();
            console.log('✅ API Response:', data);
            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error(this.config.ERROR_MESSAGES.TIMEOUT_ERROR);
            }
            
            throw error;
        }
    }

    // Alternative: Call RapidAPI symptom checker
    async callRapidAPI(symptoms) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.REQUEST_TIMEOUT);

        try {
            const response = await fetch(this.config.RAPID_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-RapidAPI-Key': 'your-rapidapi-key-here',
                    'X-RapidAPI-Host': 'symptom-checker.p.rapidapi.com'
                },
                body: JSON.stringify({
                    symptoms: symptoms,
                    age: 30, // You can make this dynamic
                    gender: 'not_specified'
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw this.handleApiError(response.status, {});
            }

            return await response.json();

        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    // Parse and validate API response
    parseApiResponse(apiResponse) {
        try {
            let content;
            
            // Handle OpenAI response format
            if (apiResponse.choices && apiResponse.choices[0] && apiResponse.choices[0].message) {
                content = apiResponse.choices[0].message.content;
            } else if (apiResponse.content) {
                content = apiResponse.content;
            } else {
                throw new Error('Invalid API response format');
            }

            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in API response');
            }

            const analysis = JSON.parse(jsonMatch[0]);

            // Validate required fields
            const requiredFields = ['riskLevel', 'probableCauses', 'precautions', 'homeRemedies'];
            for (const field of requiredFields) {
                if (!analysis[field]) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }

            // Validate risk level
            const validRiskLevels = ['low', 'moderate', 'high'];
            if (!validRiskLevels.includes(analysis.riskLevel)) {
                analysis.riskLevel = 'moderate'; // Default to moderate if invalid
            }

            // Normalize arrays to array of objects { title, description }
            const toItems = (arr) => {
                const list = Array.isArray(arr) ? arr : [arr];
                return list
                    .filter(Boolean)
                    .map((item) => {
                        if (typeof item === 'string') {
                            return { title: item, description: '' };
                        }
                        if (typeof item === 'object' && item.title) {
                            return { title: String(item.title), description: String(item.description || '') };
                        }
                        // Fallback stringify unknown types
                        return { title: String(item), description: '' };
                    });
            };
            analysis.probableCauses = toItems(analysis.probableCauses);
            analysis.precautions = toItems(analysis.precautions);
            analysis.homeRemedies = toItems(analysis.homeRemedies);

            // Add timestamp
            analysis.timestamp = new Date().toISOString();
            analysis.symptoms = this.lastAnalyzedSymptoms;

            return analysis;

        } catch (error) {
            console.error('❌ Response parsing failed:', error);
            throw new Error(this.config.ERROR_MESSAGES.INVALID_RESPONSE);
        }
    }

    // Handle API errors
    handleApiError(status, errorData) {
        switch (status) {
            case 401:
                return new Error('Invalid API key. Please check your configuration.');
            case 429:
                return new Error(this.config.ERROR_MESSAGES.RATE_LIMIT);
            case 500:
                return new Error(this.config.ERROR_MESSAGES.API_ERROR);
            case 503:
                return new Error('API service temporarily unavailable. Please try again later.');
            default:
                return new Error(`API error (${status}): ${errorData.error?.message || 'Unknown error'}`);
        }
    }

    // Utility method for delays
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Test API connection
    async testConnection() {
        try {
            const response = await fetch(this.config.API_BASE_URL, {
                method: 'POST',
                headers: this.config.getHeaders(),
                body: JSON.stringify({
                    model: "openai/gpt-3.5-turbo",
                    messages: [{ role: "user", content: "Hello" }],
                    max_tokens: 5
                })
            });

            return response.ok;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }

    // Get API usage statistics (if available)
    async getUsageStats() {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
                headers: this.config.getHeaders()
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Could not fetch usage stats:', error);
        }
        return null;
    }
}

// Create global instance
const apiService = new ApiService();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
} else {
    window.apiService = apiService;
}
