// Mobile menu toggle
document.getElementById('mobile-menu-button').addEventListener('click', function () {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
});

// Form validation and preview updates
const form = document.getElementById('userForm');
const submitBtn = document.getElementById('submitBtn');

// Update preview in real-time
function updatePreview() {
    const name = document.getElementById('name').value;
    const department = document.getElementById('department').value;
    const designation = document.getElementById('designation').value;
    const site = document.getElementById('site').value;
    const mobileNumber = document.getElementById('mobileNumber').value;
    const userID = document.getElementById('userID').value;

    document.getElementById('previewName').textContent = name || '-';
    document.getElementById('previewUserID').textContent = userID || '-';
    document.getElementById('previewDepartment').textContent = department ? department.charAt(0).toUpperCase() + department.slice(1) : '-';
    document.getElementById('previewDesignation').textContent = designation ? designation.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-';
    document.getElementById('previewSite').textContent = site ? site.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-';
    document.getElementById('previewMobile').textContent = mobileNumber || '-';
}

// Event listeners for preview updates
['name', 'department', 'designation', 'site', 'mobileNumber'].forEach(fieldId => {
    document.getElementById(fieldId).addEventListener('input', updatePreview);
});

// ----------------- Validation Helpers -----------------
function validateField(field, errorContainer, validator, message) {
    const valid = validator(field.value);
    if (!valid) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
        field.classList.add('border-error');
    } else {
        errorContainer.textContent = '';
        errorContainer.classList.add('hidden');
        field.classList.remove('border-error');
    }
    return valid;
}


// Generic validation attachment
function attachValidation(fieldIds, validator, errorMessage) {
    fieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.addEventListener('blur', function () {
                const errorContainer = this.parentNode.querySelector('.error-message');
                validateField(this, errorContainer, validator, errorMessage);
            });
        }
    });
}

// Usage:
attachValidation(
    ['name', 'fatherName', 'holderName'],
    value => /^[A-Za-z\s]+$/.test(value),
    'Please enter a valid name (letters and spaces only)'
);

// Mobile number validation
document.getElementById('mobileNumber').addEventListener('blur', function () {
    const errorContainer = this.parentNode.querySelector('.error-message');
    validateField(this, errorContainer, value => /^\d{10}$/.test(value), 'Mobile number must be exactly 10 digits');
});

// Aadhar validation
document.getElementById('aadharNumber').addEventListener('blur', function () {
    const errorContainer = this.parentNode.querySelector('.error-message');
    validateField(this, errorContainer, value => /^\d{12}$/.test(value), 'Aadhar must be exactly 12 digits');
});

// ifsc pattern
document.getElementById('ifsc').addEventListener('blur', function () {
    const errorContainer = this.parentNode.querySelector('.error-message');
    validateField(this, errorContainer,
        value => /^[A-Za-z]{4}[0-9]{7}$/.test(value),
        'Please enter a valid 11-character IFSC code (e.g., SBIN0001234)'
    );
});

// IFSC validation and autofill
document.getElementById('ifsc').addEventListener('blur', function () {
    const errorContainer = this.parentNode.querySelector('.error-message');
    const value = this.value.trim().toUpperCase();
    const bankInput = document.getElementById('bankName');

    const isValid = /^[A-Za-z]{4}[0-9]{7}$/.test(value);
    validateField(this, errorContainer, () => isValid, 'Please enter a valid 11-character IFSC code');

    if (isValid) {
        fetch(`https://ifsc.razorpay.com/${value}`)
            .then(res => {
                if (!res.ok) throw new Error('Invalid IFSC');
                return res.json();
            })
            .then(data => {
                bankInput.value = data.BANK || '';
                bankInput.style.borderColor = '';
            })
            .catch(() => {
                bankInput.value = '';
                bankInput.style.borderColor = 'red';
                alert('Invalid IFSC code. Please check.');
            });
    } else {
        bankInput.value = '';
        bankInput.style.borderColor = 'red';
    }
});

// ----------------- File Upload & Preview -----------------
document.querySelectorAll('.upload-zone').forEach(zone => {
    const input = zone.querySelector('input[type="file"]');
    const uploadContent = zone.querySelector('.upload-content');
    const previewContainer = zone.querySelector('.preview-container');
    const previewImage = zone.querySelector('.preview-image');
    const cropBtn = zone.querySelector('.crop-btn');
    const removeBtn = zone.querySelector('.remove-btn');

    // Click to upload
    zone.addEventListener('click', () => input.click());

    // Drag and drop
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('border-primary-400');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('border-primary-400');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('border-primary-400');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0], zone);
        }
    });

    // File input change
    input.addEventListener('change', e => {
        if (e.target.files.length) handleFileUpload(e.target.files[0], zone);
    });

    // Remove button
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        input.value = '';
        uploadContent.classList.remove('hidden');
        previewContainer.classList.add('hidden');

        // Update preview if it's a photo
        if (zone.dataset.uploadType === 'photoFront') {
            document.getElementById('previewPhoto').innerHTML = '<i class="fas fa-user text-2xl text-secondary-400"></i>';
        }
    });

    // Crop button
    cropBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openCropModal(previewImage.src, zone);
    });
});

function handleFileUpload(file, zone) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const uploadContent = zone.querySelector('.upload-content');
        const previewContainer = zone.querySelector('.preview-container');
        const previewImage = zone.querySelector('.preview-image');

        previewImage.src = e.target.result;
        uploadContent.classList.add('hidden');
        previewContainer.classList.remove('hidden');

        // Update main preview if it's front photo
        if (zone.dataset.uploadType === 'photoFront') {
            document.getElementById('previewPhoto').innerHTML = `<img src="${e.target.result}" alt="Employee Photo" class="w-full h-full object-cover rounded-lg">`;
        }
    };
    reader.readAsDataURL(file);
}

// Crop modal functionality
let currentCropZone = null;
let cropCanvas = null;
let cropContext = null;

function openCropModal(imageSrc, zone) {
    currentCropZone = zone;
    const modal = document.getElementById('cropModal');
    cropCanvas = document.getElementById('cropCanvas');
    cropContext = cropCanvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
        const maxWidth = 500;
        const maxHeight = 400;
        let { width, height } = img;

        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }

        cropCanvas.width = width;
        cropCanvas.height = height;
        cropContext.drawImage(img, 0, 0, width, height);
    };
    img.src = imageSrc;
    modal.classList.remove('hidden');
}

['closeCropModal', 'cancelCrop'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => document.getElementById('cropModal').classList.add('hidden'));
});

document.getElementById('applyCrop').addEventListener('click', () => {
    // Simple crop implementation - in real app, you'd use a proper cropping library
    const croppedDataURL = cropCanvas.toDataURL();
    const previewImage = currentCropZone.querySelector('.preview-image');
    previewImage.src = croppedDataURL;

    if (currentCropZone.dataset.uploadType === 'photoFront') {
        document.getElementById('previewPhoto').innerHTML = `<img src="${croppedDataURL}" alt="Employee Photo" class="w-full h-full object-cover rounded-lg">`;
    }
    document.getElementById('cropModal').classList.add('hidden');
});

// ----------------- Form Initialization -----------------
const today = new Date().toISOString().split('T')[0];
document.getElementById('doj').value = today;
const maxBirthDate = new Date();
maxBirthDate.setFullYear(maxBirthDate.getFullYear() - 18);
document.getElementById('dob').max = maxBirthDate.toISOString().split('T')[0];

// ----------------- Toast Notification -----------------
function showToast(message, type = "error") {
    const containerId = "toast-container";
    let container = document.getElementById(containerId);

    // Create container if it doesn't exist
    if (!container) {
        container = document.createElement("div");
        container.id = containerId;
        container.style.position = "fixed";
        container.style.top = "20px";
        container.style.right = "20px";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "10px";
        container.style.zIndex = "9999";
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement("div");
    toast.textContent = message;

    toast.style.position = "fixed";
    toast.style.top = "20px";
    toast.style.right = "20px";
    toast.style.padding = "12px 20px";
    toast.style.color = "#fff";
    toast.style.borderRadius = "8px";
    toast.style.fontSize = "14px";
    toast.style.boxShadow = "0 4px 6px rgba(0,0,0,0.2)";
    toast.style.zIndex = "1000";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    toast.style.transform = "translateY(20px)";
    toast.style.background = type === "error" ? "#e74c3c" : "#2ecc71";

    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    });

    // Auto Remove after 3s
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(20px)";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


// ----------------- Form Submit -----------------
form.addEventListener('submit', async e => {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const formData = new FormData(form);
        const res = await fetch('/submit', { method: 'POST', body: formData });
        const data = await res.json();

        if (!data.success) {
            // Backend validation errors
            showToast(data.message || 'Submission failed.', "error");
            return;
        }

        // Success
        showToast('Worker ID generated successfully! Redirecting...', "success");
        setTimeout(() => {
            window.location.href = '/redirecting-page';
        }, 1500);

    } catch (err) {
        console.error(err);
        showToast('Server error.', "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Form';
    }
});