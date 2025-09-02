// Mobile menu toggle
document.getElementById('mobile-menu-button').addEventListener('click', function () {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
});

// Add loading animation to action cards
document.querySelectorAll('.card.group').forEach(card => {
    card.addEventListener('click', function () {
        if (this.onclick) {
            this.style.opacity = '0.7';
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.opacity = '1';
                this.style.transform = 'scale(1)';
            }, 200);
        }
    });
});

// Fetch summary stats
async function fetchSummaryStats() {
    try {
        const res = await fetch('/summary-stats');
        const stats = await res.json();

        document.getElementById("totalWorkers").textContent = stats.totalWorkers;
        document.getElementById("idsGeneratedByMonth").textContent = stats.idsGeneratedByMonth;
        document.getElementById("totalDepartments").textContent = stats.totalDepartments;
    } catch (err) {
        console.error("Failed to load summary stats", err);
    }
}

// Fetch on page load
fetchSummaryStats();