// Mobile menu toggle
document.getElementById('mobile-menu-button').addEventListener('click', function () {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
});

// Real-time validation
function validateField(fieldId, errorId, validationFn) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(errorId);

    field.addEventListener('blur', function () {
        if (!validationFn(this.value)) {
            error.classList.remove('hidden');
            field.classList.add('border-error', 'focus:ring-error-500', 'focus:border-error-500');
        } else {
            error.classList.add('hidden');
            field.classList.remove('border-error', 'focus:ring-error-500', 'focus:border-error-500');
        }
    });

    field.addEventListener('input', function () {
        if (validationFn(this.value)) {
            error.classList.add('hidden');
            field.classList.remove('border-error', 'focus:ring-error-500', 'focus:border-error-500');
        }
    });
}

// Map interaction for mobile
const mapOverlay = document.getElementById('map-overlay');
if (mapOverlay) {
    mapOverlay.addEventListener('click', function () {
        this.style.display = 'none';
    });
}

// Directions button
document.getElementById('directions-btn').addEventListener('click', function () {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const destination = "New York, NY 10001";
            const url = `https://www.google.com/maps/dir/${lat},${lng}/${encodeURIComponent(destination)}`;
            window.open(url, '_blank');
        }, function () {
            // Fallback if geolocation fails
            const url = `https://www.google.com/maps/dir//New+York,+NY+10001`;
            window.open(url, '_blank');
        });
    } else {
        // Fallback for browsers without geolocation
        const url = `https://www.google.com/maps/dir//New+York,+NY+10001`;
        window.open(url, '_blank');
    }
});

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});