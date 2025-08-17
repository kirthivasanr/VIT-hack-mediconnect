// Global data storage
const doctorsData = {
    general: [
        { id: 1, name: "Dr. Sarah Johnson", specialization: "General Medicine", experience: "15 years", rating: "4.8", description: "Experienced general practitioner with expertise in preventive care and chronic disease management." },
        { id: 2, name: "Dr. Michael Chen", specialization: "Internal Medicine", experience: "12 years", rating: "4.7", description: "Board-certified internist specializing in adult medicine and preventive healthcare." },
        { id: 3, name: "Dr. Emily Rodriguez", specialization: "Family Medicine", experience: "10 years", rating: "4.9", description: "Family medicine specialist providing comprehensive care for all age groups." }
    ],
    pediatrics: [
        { id: 4, name: "Dr. James Wilson", specialization: "Pediatrics", experience: "18 years", rating: "4.9", description: "Pediatrician with extensive experience in child development and adolescent health." },
        { id: 5, name: "Dr. Lisa Thompson", specialization: "Pediatric Care", experience: "14 years", rating: "4.8", description: "Specialized in newborn care and early childhood development." }
    ],
    dermatology: [
        { id: 6, name: "Dr. Robert Kim", specialization: "Dermatology", experience: "16 years", rating: "4.8", description: "Dermatologist specializing in skin conditions, cosmetic procedures, and skin cancer screening." },
        { id: 7, name: "Dr. Amanda Davis", specialization: "Dermatology", experience: "11 years", rating: "4.7", description: "Expert in treating acne, psoriasis, and other common skin disorders." }
    ],
    cardiology: [
        { id: 8, name: "Dr. David Martinez", specialization: "Cardiology", experience: "20 years", rating: "4.9", description: "Cardiologist with expertise in heart disease prevention and treatment." },
        { id: 9, name: "Dr. Jennifer Lee", specialization: "Cardiology", experience: "13 years", rating: "4.8", description: "Specialized in interventional cardiology and cardiac rehabilitation." }
    ],
    orthopedics: [
        { id: 10, name: "Dr. Thomas Brown", specialization: "Orthopedics", experience: "17 years", rating: "4.8", description: "Orthopedic surgeon specializing in joint replacement and sports injuries." },
        { id: 11, name: "Dr. Rachel Green", specialization: "Orthopedics", experience: "12 years", rating: "4.7", description: "Expert in treating back pain, fractures, and musculoskeletal conditions." }
    ],
    neurology: [
        { id: 12, name: "Dr. Christopher White", specialization: "Neurology", experience: "19 years", rating: "4.9", description: "Neurologist specializing in stroke treatment and neurological disorders." },
        { id: 13, name: "Dr. Michelle Garcia", specialization: "Neurology", experience: "15 years", rating: "4.8", description: "Expert in epilepsy, multiple sclerosis, and movement disorders." }
    ]
};

// Test API connection function
async function testApiConnection() {
    try {
        console.log('🧪 Testing API connection...');
        console.log('🔑 API Key:', window.CONFIG?.API_KEY ? 'Configured' : 'Not configured');
        console.log('🌐 API URL:', window.CONFIG?.API_BASE_URL);
        
        if (!window.apiService) {
            console.error('❌ API Service not available');
            return false;
        }
        
        const isConnected = await window.apiService.testConnection();
        console.log('🔗 API Connection:', isConnected ? '✅ Success' : '❌ Failed');
        return isConnected;
    } catch (error) {
        console.error('❌ API Test failed:', error);
        return false;
    }
}

// Use the API service for symptom analysis
async function analyzeSymptoms(symptoms) {
    try {
        // Check if API service is available
        if (!window.apiService) {
            throw new Error('API service not available. Please check your configuration.');
        }
        
        console.log('🔍 Starting API analysis for symptoms:', symptoms.substring(0, 50) + '...');
        console.log('🔑 Using API Key:', window.CONFIG?.API_KEY ? 'Yes' : 'No');
        
        // Store symptoms for reference
        window.apiService.lastAnalyzedSymptoms = symptoms;
        
        // Call the API service
        const analysis = await window.apiService.analyzeSymptoms(symptoms);
        console.log('✅ API analysis completed successfully:', analysis.riskLevel);
    return analysis;
        
    } catch (error) {
        console.error('❌ API analysis failed:', error.message);
        console.error('🔍 Full error:', error);
    // No mock fallback: surface error so UI can show a message and avoid redirect
    throw error;
    }
}

// Page-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    // Removed automatic API status popup per new requirements
    initSosFeature();
    
    switch(currentPage) {
        case 'symptom-input.html':
            initSymptomPage();
            break;
    // analysis-result.html is handled by analysis.js (AnalysisHandler)
        case 'doctor-booking.html':
            initDoctorBookingPage();
            break;
        case 'confirmation.html':
            initConfirmationPage();
            break;
    }
});

// Symptom Input Page
function initSymptomPage() {
    const form = document.getElementById('symptomForm');
    const analyseBtn = document.getElementById('analyseBtn');
    const btnText = document.getElementById('btnText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    // Voice input setup
    const micBtn = document.getElementById('micBtn');
    const micStatus = document.getElementById('micStatus');
    const symptomsField = document.getElementById('symptoms');
    let recognition = null;
    let listening = false;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        let finalTranscript = '';
        recognition.onstart = () => {
            listening = true;
            micBtn.setAttribute('aria-pressed', 'true');
            micBtn.classList.add('bg-[#1991e6]', 'text-white');
            micStatus.classList.remove('hidden');
            micStatus.textContent = 'Listening...';
        };
        recognition.onerror = (e) => {
            micStatus.textContent = 'Mic error: ' + (e.error || 'unknown');
        };
        recognition.onend = () => {
            listening = false;
            micBtn.setAttribute('aria-pressed', 'false');
            micBtn.classList.remove('bg-[#1991e6]', 'text-white');
            if (!finalTranscript) {
                micStatus.textContent = 'No speech detected';
                setTimeout(()=>micStatus.classList.add('hidden'), 1500);
            } else {
                micStatus.textContent = 'Recording stopped';
                setTimeout(()=>micStatus.classList.add('hidden'), 1000);
            }
        };
        recognition.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interim += transcript;
                }
            }
            symptomsField.value = (finalTranscript + ' ' + interim).trim();
        };
        micBtn.addEventListener('click', () => {
            if (!recognition) return;
            if (!listening) {
                finalTranscript = symptomsField.value ? symptomsField.value + ' ' : '';
                try { recognition.start(); } catch(_) {}
            } else {
                recognition.stop();
            }
        });
    } else if (micBtn) {
        micBtn.disabled = true;
        micBtn.title = 'Speech recognition not supported in this browser';
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const symptoms = document.getElementById('symptoms').value.trim();
        if (!symptoms) {
            alert('Please describe your symptoms.');
            return;
        }
        
        // Show loading state
        analyseBtn.disabled = true;
        btnText.textContent = 'Analyzing...';
        loadingSpinner.style.display = 'inline-block';
        
        try {
            console.log('🚀 Starting symptom analysis...');
            console.log('📝 Symptoms:', symptoms);
            let analysis;
            analysis = await analyzeSymptoms(symptoms);
            
            console.log('📊 Analysis results:', analysis);
            
            // Store analysis results
            localStorage.setItem('analysisResults', JSON.stringify(analysis));
            
            // Redirect to results page
            window.location.href = 'analysis-result.html';
        } catch (error) {
            console.error('❌ Analysis error:', error);
            // Show inline error and do not redirect
            const msg = (error && error.message) ? error.message : 'Error analyzing symptoms. Please try again.';
            const existing = document.getElementById('analysisErrorBanner');
            if (existing) existing.remove();
            const banner = document.createElement('div');
            banner.id = 'analysisErrorBanner';
            banner.className = 'mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700';
            banner.textContent = msg;
            form.parentElement.appendChild(banner);
        } finally {
            // Reset button state
            analyseBtn.disabled = false;
            btnText.textContent = 'Analyse Symptoms';
            loadingSpinner.style.display = 'none';
        }
    });
}

// SOS / Ambulance Feature
function initSosFeature() {
    const sosBtn = document.getElementById('sosBtn');
    const modal = document.getElementById('sosModal');
    if (!sosBtn || !modal) return; // not on this page
    const confirmBtn = document.getElementById('confirmSosBtn');
    const cancelBtn = document.getElementById('cancelSosBtn');
    const locationStatus = document.getElementById('sosLocationStatus');
    const feedback = document.getElementById('sosFeedback');
    const notesField = document.getElementById('sosNotes');
    const typeField = document.getElementById('sosType');

    let locationData = null;
    let lastDispatchTs = 0;
    const DISPATCH_COOLDOWN_MS = 60_000; // 1 minute to prevent spam

    sosBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        feedback.classList.add('hidden');
        feedback.textContent = '';
        acquireLocation();
    });

    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            cancelBtn.click();
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cancelBtn.click();
        }
    });

    confirmBtn.addEventListener('click', async () => {
        const now = Date.now();
        if (now - lastDispatchTs < DISPATCH_COOLDOWN_MS) {
            showFeedback('Please wait before sending another emergency request.', false);
            return;
        }
        if (!confirm('Confirm this is a real emergency and you need an ambulance?')) {
            return;
        }
        confirmBtn.disabled = true;
        confirmBtn.classList.add('opacity-60');
        confirmBtn.querySelector('span').textContent = 'Dispatching...';
        try {
            const payload = {
                id: 'SOS-' + Date.now(),
                type: typeField.value,
                notes: notesField.value.trim() || null,
                location: locationData,
                ts: new Date().toISOString(),
                status: 'pending'
            };
            // Simulated network send; integrate real API here
            await new Promise(r => setTimeout(r, 1200));
            payload.status = 'sent';
            enqueueSos(payload);
            lastDispatchTs = now;
            showFeedback('Emergency request sent. Stay safe and keep your phone accessible.', true);
            confirmBtn.querySelector('span').textContent = 'Sent';
            setTimeout(()=>cancelBtn.click(), 1800);
        } catch (err) {
            showFeedback('Failed to send emergency request. Try again.', false);
            confirmBtn.querySelector('span').textContent = 'Retry Dispatch';
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('opacity-60');
        }
    });

    function showFeedback(msg, success) {
        feedback.textContent = msg;
        feedback.className = 'mt-2 text-sm font-medium p-3 rounded-lg border ' + (success ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200');
        feedback.classList.remove('hidden');
    }

    function acquireLocation() {
        locationStatus.textContent = 'Attempting to get location...';
        if (!('geolocation' in navigator)) {
            locationStatus.textContent = 'Geolocation not supported.';
            return;
        }
        navigator.geolocation.getCurrentPosition(pos => {
            locationData = {
                lat: parseFloat(pos.coords.latitude.toFixed(6)),
                lng: parseFloat(pos.coords.longitude.toFixed(6)),
                accuracy: pos.coords.accuracy
            };
            locationStatus.textContent = `Location locked (±${Math.round(pos.coords.accuracy)}m)`;
        }, err => {
            locationStatus.textContent = 'Location denied/unavailable.';
        }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 });
    }
}

function enqueueSos(entry) {
    try {
        const key = 'sosQueue';
        const list = JSON.parse(localStorage.getItem(key)) || [];
        list.unshift(entry);
        // keep last 20
        while (list.length > 20) list.pop();
        localStorage.setItem(key, JSON.stringify(list));
    } catch(_) {}
}

// Analysis Result Page
// analysis-result.html logic is now handled exclusively in analysis.js

// Doctor Booking Page
function initDoctorBookingPage() {
    const departmentsView = document.getElementById('departmentsView');
    const doctorsView = document.getElementById('doctorsView');
    const backToDepartmentsBtn = document.getElementById('backToDepartments');
    const departmentTitle = document.getElementById('departmentTitle');
    const doctorsList = document.getElementById('doctorsList');
    const bookingModal = document.getElementById('bookingModal');
    const closeModal = document.getElementById('closeModal');
    const confirmBooking = document.getElementById('confirmBooking');
    
    let selectedDoctor = null;
    let selectedDate = null;
    let selectedTime = null;
    
    // Department selection
    document.querySelectorAll('.department-card').forEach(card => {
        card.addEventListener('click', function() {
            const department = this.dataset.department;
            const doctors = doctorsData[department];
            
            if (doctors) {
                displayDoctors(department, doctors);
                departmentsView.style.display = 'none';
                doctorsView.style.display = 'block';
            }
        });
    });
    
    // Back to departments
    backToDepartmentsBtn.addEventListener('click', function() {
        doctorsView.style.display = 'none';
        departmentsView.style.display = 'block';
    });
    
    // Close modal
    closeModal.addEventListener('click', function() {
        bookingModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === bookingModal) {
            bookingModal.style.display = 'none';
        }
    });
    
    // Confirm booking
    confirmBooking.addEventListener('click', function() {
        if (selectedDoctor && selectedDate && selectedTime) {
            const bookingDetails = {
                doctor: selectedDoctor,
                date: selectedDate,
                time: selectedTime,
                bookingId: 'BK' + Date.now()
            };
            
            localStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));
            window.location.href = 'confirmation.html';
        } else {
            alert('Please select a date and time for your appointment.');
        }
    });
    
    function displayDoctors(department, doctors) {
        const departmentNames = {
            general: 'General Medicine',
            pediatrics: 'Pediatrics',
            dermatology: 'Dermatology',
            cardiology: 'Cardiology',
            orthopedics: 'Orthopedics',
            neurology: 'Neurology'
        };
        
        departmentTitle.textContent = departmentNames[department];
        
        doctorsList.innerHTML = doctors.map(doctor => `
            <div class="doctor-card" data-doctor-id="${doctor.id}">
                <div class="doctor-avatar">
                    <i class="fas fa-user-md"></i>
                </div>
                <h4>${doctor.name}</h4>
                <p><strong>${doctor.specialization}</strong></p>
                <p>Experience: ${doctor.experience}</p>
                <p>Rating: ⭐ ${doctor.rating}</p>
                <p style="font-size: 0.8rem; color: #666;">${doctor.description}</p>
            </div>
        `).join('');
        
        // Add click event to doctor cards
        document.querySelectorAll('.doctor-card').forEach(card => {
            card.addEventListener('click', function() {
                const doctorId = parseInt(this.dataset.doctorId);
                const doctor = doctors.find(d => d.id === doctorId);
                if (doctor) {
                    openBookingModal(doctor);
                }
            });
        });
    }
    
    function openBookingModal(doctor) {
        selectedDoctor = doctor;
        
        // Update modal content
        document.getElementById('modalTitle').textContent = `Book Appointment with ${doctor.name}`;
        document.getElementById('doctorInfo').innerHTML = `
            <h4>${doctor.name}</h4>
            <p><strong>Specialization:</strong> ${doctor.specialization}</p>
            <p><strong>Experience:</strong> ${doctor.experience}</p>
            <p><strong>Rating:</strong> ⭐ ${doctor.rating}</p>
        `;
        
        // Generate date options (next 7 days)
        const dateSelector = document.getElementById('dateSelector');
        dateSelector.innerHTML = '';
        
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateStr = date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            const dateValue = date.toISOString().split('T')[0];
            
            const dateOption = document.createElement('div');
            dateOption.className = 'date-option';
            dateOption.textContent = dateStr;
            dateOption.dataset.date = dateValue;
            
            dateOption.addEventListener('click', function() {
                document.querySelectorAll('.date-option').forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                selectedDate = this.dataset.date;
                generateTimeSlots();
            });
            
            dateSelector.appendChild(dateOption);
        }
        
        // Generate time slots
        generateTimeSlots();
        
        // Show modal
        bookingModal.style.display = 'block';
    }
    
    function generateTimeSlots() {
        const timeSlots = document.getElementById('timeSlots');
        timeSlots.innerHTML = '';
        
        const times = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];
        
        times.forEach(time => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = time;
            
            timeSlot.addEventListener('click', function() {
                document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
                this.classList.add('selected');
                selectedTime = time;
            });
            
            timeSlots.appendChild(timeSlot);
        });
    }
}

// Confirmation Page
function initConfirmationPage() {
    const bookingDetails = JSON.parse(localStorage.getItem('bookingDetails'));
    
    if (!bookingDetails) {
        window.location.href = 'index.html';
        return;
    }
    
    const bookingDetailsDiv = document.getElementById('bookingDetails');
    bookingDetailsDiv.innerHTML = `
        <p><strong>Doctor:</strong> ${bookingDetails.doctor.name}</p>
        <p><strong>Specialization:</strong> ${bookingDetails.doctor.specialization}</p>
        <p><strong>Date:</strong> ${new Date(bookingDetails.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}</p>
        <p><strong>Time:</strong> ${bookingDetails.time}</p>
        <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
    `;
    
    // Clear booking details from localStorage after displaying
    localStorage.removeItem('bookingDetails');
}
