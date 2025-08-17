// Analysis Results Page Handler
class AnalysisHandler {
    constructor() {
        this.apiService = window.apiService;
        this.analysisResults = null;
        this.init();
    }

    init() {
        this.loadAnalysisResults();
        this.setupEventListeners();
        this.displayResults();
    }

    // Load analysis results from localStorage
    loadAnalysisResults() {
        try {
            const storedResults = localStorage.getItem('analysisResults');
            if (!storedResults) {
                this.redirectToSymptoms();
                return;
            }

            this.analysisResults = JSON.parse(storedResults);
            console.log('📊 Loaded analysis results:', this.analysisResults.riskLevel);

        } catch (error) {
            console.error('❌ Failed to load analysis results:', error);
            this.redirectToSymptoms();
        }
    }

    // Display analysis results
    displayResults() {
        if (!this.analysisResults) {
            this.showError('No analysis results found');
            return;
        }

        this.displayRiskLevel();
        this.displayAnalysisDetails();
        this.setupActionButtons();
        this.showSuccessMessage();
    }

    // Display risk level indicator
    displayRiskLevel() {
        const riskIndicator = document.getElementById('riskIndicator');
        if (!riskIndicator) return;

        const riskClass = `risk-${this.analysisResults.riskLevel}`;
        const riskText = this.analysisResults.riskLevel.charAt(0).toUpperCase() + this.analysisResults.riskLevel.slice(1);
        
        // Get appropriate icon based on risk level
        const iconMap = {
            'high': 'exclamation-triangle',
            'moderate': 'info-circle', 
            'low': 'check-circle'
        };
        const icon = iconMap[this.analysisResults.riskLevel] || 'info-circle';

        riskIndicator.className = `risk-indicator ${riskClass}`;
        riskIndicator.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <div>
                <div class="risk-title">Risk Level: ${riskText}</div>
                <div class="risk-description">${this.getRiskDescription()}</div>
            </div>
        `;

        // Add urgency indicator if available
        if (this.analysisResults.urgency) {
            this.displayUrgencyIndicator();
        }
    }

    // Get risk level description
    getRiskDescription() {
        const descriptions = {
            'high': 'Requires immediate medical attention',
            'moderate': 'Medical consultation recommended',
            'low': 'Can be managed with home care'
        };
        return descriptions[this.analysisResults.riskLevel] || 'Medical assessment advised';
    }

    // Display urgency indicator
    displayUrgencyIndicator() {
        const urgency = this.analysisResults.urgency;
        const urgencyMap = {
            'immediate': { text: 'Seek immediate care', class: 'urgent-immediate' },
            'within_24_hours': { text: 'See doctor within 24 hours', class: 'urgent-24h' },
            'within_week': { text: 'Schedule appointment this week', class: 'urgent-week' },
            'routine': { text: 'Routine check-up recommended', class: 'urgent-routine' }
        };

        const urgencyInfo = urgencyMap[urgency];
        if (urgencyInfo) {
            const urgencyElement = document.createElement('div');
            urgencyElement.className = `urgency-indicator ${urgencyInfo.class}`;
            urgencyElement.innerHTML = `
                <i class="fas fa-clock"></i>
                ${urgencyInfo.text}
            `;
            
            const riskIndicator = document.getElementById('riskIndicator');
            if (riskIndicator) {
                riskIndicator.appendChild(urgencyElement);
            }
        }
    }

    // Display analysis details
    displayAnalysisDetails() {
        // Display image analysis information if available
        if (this.analysisResults.hasImage && this.analysisResults.imageAnalysis) {
            this.displayImageAnalysis();
        }
        
        this.displaySection('probableCauses', 'Probable Causes');
        this.displaySection('precautions', 'Precautions');
        this.displaySection('homeRemedies', 'Home Remedies');
        
        // Display recommended specialist if available
        if (this.analysisResults.recommendedSpecialist) {
            this.displayRecommendedSpecialist();
        }
    }

    // Display image analysis information
    displayImageAnalysis() {
        const imageAnalysis = this.analysisResults.imageAnalysis;
        const resultDetails = document.querySelector('.result-details');
        
        if (resultDetails && imageAnalysis) {
            const imageSection = document.createElement('div');
            imageSection.className = 'image-analysis-section';
            imageSection.innerHTML = `
                <h3 class="flex items-center gap-2 text-xl font-semibold text-[#0e151b] mb-2">
                    <i class="fas fa-camera text-[#1991e6]"></i> 
                    Image Analysis Results
                </h3>
                <div class="image-analysis-details bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="analysis-item">
                            <strong class="text-[#1991e6]">Detected Condition:</strong>
                            <span class="ml-2 font-medium">${imageAnalysis.condition}</span>
                        </div>
                        <div class="analysis-item">
                            <strong class="text-[#1991e6]">Confidence Level:</strong>
                            <span class="ml-2 font-medium">
                                <span class="confidence-indicator ${imageAnalysis.confidence >= 0.9 ? 'confidence-high' : imageAnalysis.confidence >= 0.7 ? 'confidence-medium' : 'confidence-low'}">
                                    ${Math.round(imageAnalysis.confidence * 100)}%
                                </span>
                            </span>
                        </div>
                        <div class="analysis-item">
                            <strong class="text-[#1991e6]">Analysis Method:</strong>
                            <span class="ml-2 text-sm">${imageAnalysis.analysisMethod}</span>
                        </div>
                        <div class="analysis-item">
                            <strong class="text-[#1991e6]">Dataset Samples:</strong>
                            <span class="ml-2 font-medium">${imageAnalysis.sampleCount.toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="mt-3 p-3 bg-blue-100 rounded-lg">
                        <p class="text-sm text-blue-800 m-0">
                            <i class="fas fa-info-circle mr-2"></i>
                            This analysis was performed using AI-powered image recognition trained on a comprehensive dermatological dataset.
                        </p>
                    </div>
                </div>
            `;
            
            // Insert at the beginning of result details
            resultDetails.insertBefore(imageSection, resultDetails.firstChild);
        }
    }

    // Display a section of analysis details
    displaySection(sectionId, title) {
        const container = document.getElementById(sectionId);
        if (!container || !this.analysisResults[sectionId]) return;

        const items = Array.isArray(this.analysisResults[sectionId]) 
            ? this.analysisResults[sectionId] 
            : [this.analysisResults[sectionId]];

        container.innerHTML = items.map(item => `
            <div class="analysis-item">
                <i class="fas fa-chevron-right"></i>
                <span>${item}</span>
            </div>
        `).join('');
    }

    // Display recommended specialist
    displayRecommendedSpecialist() {
        const specialist = this.analysisResults.recommendedSpecialist;
        const specialistNames = {
            'general': 'General Medicine',
            'cardiology': 'Cardiology',
            'neurology': 'Neurology',
            'dermatology': 'Dermatology',
            'pediatrics': 'Pediatrics',
            'orthopedics': 'Orthopedics'
        };

        const specialistName = specialistNames[specialist] || specialist;
        
        // Add to the result details
        const resultDetails = document.querySelector('.result-details');
        if (resultDetails) {
            const specialistSection = document.createElement('div');
            specialistSection.innerHTML = `
                <h3><i class="fas fa-user-md"></i> Recommended Specialist</h3>
                <div class="specialist-recommendation">
                    <div class="specialist-card">
                        <i class="fas fa-stethoscope"></i>
                        <span>${specialistName}</span>
                    </div>
                </div>
            `;
            resultDetails.appendChild(specialistSection);
        }
    }

    // Setup action buttons
    setupActionButtons() {
        const actionButtons = document.querySelector('.action-buttons');
        if (!actionButtons) return;

        // Update doctor booking button based on risk level
        const doctorBtn = actionButtons.querySelector('.btn-doctor');
        if (doctorBtn) {
            if (this.analysisResults.riskLevel === 'high') {
                doctorBtn.innerHTML = '<i class="fas fa-ambulance"></i> Emergency Care';
                doctorBtn.classList.add('urgent');
            } else if (this.analysisResults.recommendedSpecialist) {
                const specialist = this.analysisResults.recommendedSpecialist;
                doctorBtn.innerHTML = `<i class="fas fa-user-md"></i> Book ${specialist.charAt(0).toUpperCase() + specialist.slice(1)} Specialist`;
            }
        }

        // Add print/share functionality
        this.addPrintShareButtons();
    }

    // Add print and share buttons
    addPrintShareButtons() {
        const actionButtons = document.querySelector('.action-buttons');
        if (!actionButtons) return;

        const utilityButtons = document.createElement('div');
        utilityButtons.className = 'utility-buttons';
        // Only Print button (Share removed per requirement)
        utilityButtons.innerHTML = `
            <button class="utility-btn" onclick="analysisHandler.printResults()">
                <i class="fas fa-print"></i> Print
            </button>
        `;

        actionButtons.appendChild(utilityButtons);
    }

    // Print analysis results
    printResults() {
        const printWindow = window.open('', '_blank');
        
        // Generate image analysis section if available
        let imageAnalysisSection = '';
        if (this.analysisResults.hasImage && this.analysisResults.imageAnalysis) {
            const ia = this.analysisResults.imageAnalysis;
            imageAnalysisSection = `
                <div class="section">
                    <h3>Image Analysis Results:</h3>
                    <div class="item"><strong>Detected Condition:</strong> ${ia.condition}</div>
                    <div class="item"><strong>Confidence Level:</strong> ${Math.round(ia.confidence * 100)}%</div>
                    <div class="item"><strong>Analysis Method:</strong> ${ia.analysisMethod}</div>
                    <div class="item"><strong>Dataset Samples:</strong> ${ia.sampleCount.toLocaleString()}</div>
                </div>
            `;
        }
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Medical Analysis Results</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .risk-level { padding: 10px; margin: 10px 0; border-radius: 5px; }
                        .risk-high { background: #ffebee; color: #c62828; }
                        .risk-moderate { background: #fff3e0; color: #ef6c00; }
                        .risk-low { background: #e8f5e8; color: #2e7d32; }
                        .section { margin: 20px 0; }
                        .item { margin: 5px 0; }
                        .image-analysis { background: #f0f8ff; padding: 15px; border-radius: 5px; border: 1px solid #b0d4f1; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>MediConnect AI - Analysis Results</h1>
                        <p>Generated on: ${new Date().toLocaleString()}</p>
                        ${this.analysisResults.hasImage ? '<p><strong>Analysis Type:</strong> Image-based AI Diagnosis</p>' : '<p><strong>Analysis Type:</strong> Symptom-based AI Analysis</p>'}
                    </div>
                    
                    <div class="risk-level risk-${this.analysisResults.riskLevel}">
                        <h2>Risk Level: ${this.analysisResults.riskLevel.toUpperCase()}</h2>
                    </div>
                    
                    ${imageAnalysisSection}
                    
                    <div class="section">
                        <h3>Probable Causes:</h3>
                        ${this.analysisResults.probableCauses.map(cause => `<div class="item">• ${cause}</div>`).join('')}
                    </div>
                    
                    <div class="section">
                        <h3>Precautions:</h3>
                        ${this.analysisResults.precautions.map(precaution => `<div class="item">• ${precaution}</div>`).join('')}
                    </div>
                    
                    <div class="section">
                        <h3>Home Remedies:</h3>
                        ${this.analysisResults.homeRemedies.map(remedy => `<div class="item">• ${remedy}</div>`).join('')}
                    </div>
                    
                    ${this.analysisResults.recommendedSpecialist ? `
                        <div class="section">
                            <h3>Recommended Specialist:</h3>
                            <div class="item">• ${this.analysisResults.recommendedSpecialist.charAt(0).toUpperCase() + this.analysisResults.recommendedSpecialist.slice(1)}</div>
                        </div>
                    ` : ''}
                    
                    <div style="margin-top: 30px; padding: 10px; border: 1px solid #ccc;">
                        <strong>Disclaimer:</strong> This analysis is for informational purposes only and should not replace professional medical advice.
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    // Share analysis results
    shareResults() {
        if (navigator.share) {
            const shareData = {
                title: 'Medical Analysis Results',
                text: `Risk Level: ${this.analysisResults.riskLevel.toUpperCase()}. ${this.getRiskDescription()}`,
                url: window.location.href
            };
            navigator.share(shareData);
        } else {
            // Fallback: copy to clipboard
            const text = `Medical Analysis Results\nRisk Level: ${this.analysisResults.riskLevel.toUpperCase()}\n${this.getRiskDescription()}`;
            navigator.clipboard.writeText(text).then(() => {
                this.showMessage('Results copied to clipboard!', 'success');
            });
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Back button
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = 'symptom-input.html';
            });
        }

        // Action buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-doctor')) {
                this.handleDoctorBooking();
            } else if (e.target.closest('.btn-pharma')) {
                this.handlePharmacy();
            }
        });
    }

    // Handle doctor booking
    handleDoctorBooking() {
        // Store recommended specialist if available
        if (this.analysisResults.recommendedSpecialist) {
            localStorage.setItem('recommendedSpecialist', this.analysisResults.recommendedSpecialist);
        }
        window.location.href = 'doctor-booking.html';
    }

    // Handle pharmacy
    handlePharmacy() {
        window.location.href = 'e-pharma.html';
    }

    // Show success message
    showSuccessMessage() {
        const message = document.createElement('div');
        message.className = 'success-message';
        message.innerHTML = `
            <i class="fas fa-check-circle"></i>
            Analysis completed successfully!
        `;
        
        const container = document.querySelector('.result-container');
        if (container) {
            container.insertBefore(message, container.firstChild);
            
            // Remove message after 3 seconds
            setTimeout(() => {
                message.remove();
            }, 3000);
        }
    }

    // Show error message
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            ${message}
        `;
        
        const container = document.querySelector('.result-container');
        if (container) {
            container.appendChild(errorDiv);
        }
    }

    // Show general message
    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `message message-${type}`;
        message.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            ${text}
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    // Redirect to symptoms page
    redirectToSymptoms() {
        window.location.href = 'symptom-input.html';
    }
}

// Initialize analysis handler when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('analysis-result.html')) {
        window.analysisHandler = new AnalysisHandler();
    }
});
