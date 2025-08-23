form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    try {
        const response = await fetch('/submit', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            alert('Form submitted successfully!');
            // Redirect to the ID card or a new form page
            window.location.href = data.redirect;
        } else {
            alert('Form submission failed: ' + data.message);
        }
    } catch (error) {
        console.error('Error during form submission:', error);
        alert('An unexpected error occurred.');
    }
});