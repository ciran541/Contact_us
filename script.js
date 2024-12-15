// Initialize map
let map;

function initMap() {
    const location = { lat: 1.2855, lng: 103.8521 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 16,
        center: location,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT
        }
    });

    const markerInfo = `
        <div style="padding: 10px;">
            <h3 style="margin: 0 0 5px;">The Loan Connection</h3>
            <div style="color: #666;">
                <div style="margin-bottom: 5px;">
                    <span style="color: #ffd700;">★★★★★</span> 5.0
                </div>
                <div>1 Fullerton Rd, #02-01</div>
                <div>Singapore 049213</div>
            </div>
        </div>
    `;

    const infowindow = new google.maps.InfoWindow({
        content: markerInfo
    });

    const marker = new google.maps.Marker({
        position: location,
        map: map,
        title: "The Loan Connection"
    });

    marker.addListener("click", () => {
        infowindow.open(map, marker);
    });

    infowindow.open(map, marker);
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contactForm');
    const loadingSpinner = document.querySelector('.loading-spinner');
    const feedbackMessage = document.querySelector('.feedback-message');

    // Utility functions
    function toggleLoading(show) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
    }

    function showFeedback(message, isSuccess) {
        feedbackMessage.textContent = message;
        feedbackMessage.className = 'feedback-message ' + 
            (isSuccess ? 'feedback-success' : 'feedback-error');
        feedbackMessage.style.top = '20px';
        
        setTimeout(() => {
            feedbackMessage.style.top = '-100px';
        }, 5000);
    }

    function clearError(input) {
        const errorMessage = input.parentElement.nextElementSibling;
        input.style.borderColor = '#ddd';
        input.parentElement.querySelector('.input-icon').style.borderColor = '#ddd';
        if (errorMessage && errorMessage.classList.contains('error-message')) {
            errorMessage.style.display = 'none';
        }
    }

    function validateField(input) {
        if (input.type === 'checkbox') {
            return validateCheckbox(input);
        }

        const errorMessage = input.parentElement.nextElementSibling;
        
        if (input.required && !input.value.trim()) {
            input.style.borderColor = '#dc3545';
            input.parentElement.querySelector('.input-icon').style.borderColor = '#dc3545';
            if (errorMessage) {
                errorMessage.style.display = 'block';
            }
            return false;
        }

        if (input.type === 'email' && !isValidEmail(input.value)) {
            input.style.borderColor = '#dc3545';
            input.parentElement.querySelector('.input-icon').style.borderColor = '#dc3545';
            if (errorMessage) {
                errorMessage.textContent = 'Please enter a valid email address';
                errorMessage.style.display = 'block';
            }
            return false;
        }

        if (input.id === 'contactNumber' && !isValidPhone(input.value)) {
            input.style.borderColor = '#dc3545';
            input.parentElement.querySelector('.input-icon').style.borderColor = '#dc3545';
            if (errorMessage) {
                errorMessage.textContent = 'Please enter a valid phone number';
                errorMessage.style.display = 'block';
            }
            return false;
        }

        clearError(input);
        return true;
    }

    function validateCheckbox(checkbox) {
        const errorMessage = checkbox.parentElement.nextElementSibling;
        if (checkbox.required && !checkbox.checked) {
            if (errorMessage) {
                errorMessage.style.display = 'block';
            }
            return false;
        }
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
        return true;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPhone(phone) {
        return /^\+?[\d\s-]{8,}$/.test(phone);
    }

    // Submit form data to Google Sheets
    async function submitToGoogleSheets(formData) {
        // Replace with your Google Apps Script deployment URL
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbxXPz6CT74hEXDEjXYAqIpaxmvaBUkXVo2Xo1tMyQWweVuxcB9dfuaInIdvfdHQZ2Df/exec';
        
        // Prepare data object
        const data = {
            timestamp: new Date().toLocaleString(),
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            contactNumber: document.getElementById('contactNumber').value,
            email: document.getElementById('email').value,
            purposes: Array.from(document.querySelectorAll('input[name="purpose"]:checked'))
                .map(cb => cb.value)
                .join(', '),
            message: document.getElementById('message').value,
            terms: document.getElementById('terms').checked ? 'Yes' : 'No'
        };

        try {
            const response = await fetch(scriptUrl, {
                method: 'POST',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.status === 'success') {
                showFeedback('Form submitted successfully!', true);
                form.reset();
            } else {
                throw new Error(result.message || 'Submission failed');
            }
        } catch (error) {
            showFeedback('Error submitting form. Please try again.', false);
            console.error('Submission error:', error);
        }
    }

    // Form submit handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        let isValid = true;

        // Validate required inputs
        const requiredFields = ['firstName', 'lastName', 'contactNumber', 'email'];
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!validateField(field)) {
                isValid = false;
            }
        });

        // Validate terms checkbox
        if (!document.getElementById('terms').checked) {
            document.querySelector('#terms').parentElement.nextElementSibling.style.display = 'block';
            isValid = false;
        }

        if (isValid) {
            toggleLoading(true);
            const formData = new FormData(this);
            await submitToGoogleSheets(formData);
            toggleLoading(false);
        }
    });

    // Real-time validation
    form.querySelectorAll('.input-field').forEach(input => {
        if (input.type !== 'checkbox') {
            input.addEventListener('input', function() {
                clearError(input);
            });

            input.addEventListener('blur', function() {
                validateField(input);
            });
        }
    });

    // Terms checkbox validation
    document.getElementById('terms').addEventListener('change', function() {
        validateCheckbox(this);
    });
});