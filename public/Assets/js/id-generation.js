// Mobile menu toggle
document.getElementById('mobile-menu-button').addEventListener('click', function () {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
});

// Form validation and preview updates
const form = document.getElementById('userForm');
const submitBtn = document.getElementById('submitBtn');

// // Auto-generate User ID
// function generateUserID() {
//     const timestamp = Date.now().toString().slice(-6);
//     const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
//     return `EMP${timestamp}${random}`;
// }

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

// Form field event listeners
['name', 'department', 'designation', 'site', 'mobileNumber'].forEach(fieldId => {
    document.getElementById(fieldId).addEventListener('input', updatePreview);
});

// Form validation
function validateField(field, errorContainer, validationFn, errorMessage) {
    const isValid = validationFn(field.value);
    if (!isValid) {
        errorContainer.textContent = errorMessage;
        errorContainer.classList.remove('hidden');
        field.classList.add('border-error');
    } else {
        errorContainer.classList.add('hidden');
        field.classList.remove('border-error');
    }
    return isValid;
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
    validateField(this, errorContainer,
        value => /^\d{10}$/.test(value),
        'Please enter a valid 10-digit mobile number'
    );
});

// Aadhar validation
document.getElementById('aadharNumber').addEventListener('blur', function () {
    const errorContainer = this.parentNode.querySelector('.error-message');
    validateField(this, errorContainer,
        value => /^\d{12}$/.test(value),
        'Please enter a valid 12-digit Aadhar number'
    );
});

// ifsc pattern
document.getElementById('ifsc').addEventListener('blur', function () {
    const errorContainer = this.parentNode.querySelector('.error-message');
    validateField(this, errorContainer,
        value => /^[A-Za-z]{4}[0-9]{7}$/.test(value),
        'Please enter a valid 11-character IFSC code (e.g., SBIN0001234)'
    );
});

// <<------  *Autofill Bank name using IFSC code*  ------>>
document.getElementById('ifsc').addEventListener('blur', function () {
    const ifsc = this.value.trim().toUpperCase();
    const bankNameInput = document.getElementById('bankName');

    if (ifsc === '') {
        bankNameInput.value = '';
        bankNameInput.style.borderColor = '';
        return;
    }

    if (ifsc.length === 11) {
        fetch(`https://ifsc.razorpay.com/${ifsc}`)
            .then(response => {
                if (!response.ok) throw new Error('Invalid IFSC');
                return response.json();
            })
            .then(data => {
                bankNameInput.value = data.BANK || '';
                bankNameInput.style.borderColor = '';
            })
            .catch(() => {
                bankNameInput.value = '';
                bankNameInput.style.borderColor = 'red';
                alert('Invalid IFSC code. Please check.');
            });
    } else {
        bankNameInput.value = '';
        bankNameInput.style.borderColor = 'red';
    }
});



// File upload handling
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
    input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0], zone);
        }
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
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
    }

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

document.getElementById('closeCropModal').addEventListener('click', () => {
    document.getElementById('cropModal').classList.add('hidden');
});

document.getElementById('cancelCrop').addEventListener('click', () => {
    document.getElementById('cropModal').classList.add('hidden');
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

// Form submission
form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Show loading state
    const submitText = submitBtn.querySelector('.submit-text');
    const loadingText = submitBtn.querySelector('.loading-text');

    submitText.classList.add('hidden');
    loadingText.classList.remove('hidden');
    submitBtn.disabled = true;

    // Simulate form processing
    setTimeout(() => {
        alert('Employee ID card generated successfully! PDF will be downloaded shortly.');

        // Reset loading state
        submitText.classList.remove('hidden');
        loadingText.classList.add('hidden');
        submitBtn.disabled = false;

        // Redirect to records dashboard
        window.location.href = 'id-dashboard';
    }, 3000);
});

// Initialize form
document.addEventListener('DOMContentLoaded', function () {
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('doj').value = today;

    // Set max date for date of birth (18 years ago)
    const maxBirthDate = new Date();
    maxBirthDate.setFullYear(maxBirthDate.getFullYear() - 18);
    document.getElementById('dob').max = maxBirthDate.toISOString().split('T')[0];
});

// <<------  *Redirecting to ID card page*  ------>>
document.getElementById('userForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    const response = await fetch('/submit', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (result.success && result.redirect) {
      window.location.href = result.redirect;
    } else {
      alert('Submission failed. Try again.');
    }
  } catch (err) {
    console.error(err);
    alert('Server error.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Form';
  }
});