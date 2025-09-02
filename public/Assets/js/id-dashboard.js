// State management
let currentPage = 1;
let pageSize = 25;
let filteredWorkers = [];
let sortColumn = '';
let sortDirection = 'asc';
let selectedWorkers = new Set();

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const filterDepartment = document.getElementById('filterDepartment');
const filterDesignation = document.getElementById('filterDesignation');
const filterSite = document.getElementById('filterSite');
const clearFilters = document.getElementById('clearFilters');
const resultsCount = document.getElementById('resultsCount');
const selectAll = document.getElementById('selectAll');
const bulkActions = document.getElementById('bulkActions');
const bulkMenu = document.getElementById('bulkMenu');
const workerTableBody = document.getElementById('workerTableBody');
const mobileCardView = document.getElementById('mobileCardView');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const pageSizeSelect = document.getElementById('pageSize');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const pageNumbers = document.getElementById('pageNumbers');

async function loadWorkers() {
    try {
        const response = await fetch('/id-dashboard/records');
        const data = await response.json();

        // keep all workers in memory
        window.allWorkers = data;

        // initially no filter, so filtered = all
        filteredWorkers = [...allWorkers];

        renderWorkers();
    } catch (err) {
        console.error("Error loading workers:", err);
        showEmptyState();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async function () {
    await loadWorkers();   // fetch workers from backend
    setupEventListeners();
});

// Format date
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr; // fallback: return original string
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Event listeners
function setupEventListeners() {
    // Mobile menu toggle
    document.getElementById('mobile-menu-button').addEventListener('click', function () {
        const mobileMenu = document.getElementById('mobile-menu');
        mobileMenu.classList.toggle('hidden');
    });

    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    searchClear.addEventListener('click', clearSearch);

    // Filter functionality
    filterDepartment.addEventListener('change', applyFilters);
    filterDesignation.addEventListener('change', applyFilters);
    filterSite.addEventListener('change', applyFilters);
    clearFilters.addEventListener('click', clearAllFilters);

    // Sorting
    document.querySelectorAll('[data-sort]').forEach(header => {
        header.addEventListener('click', () => handleSort(header.dataset.sort));
    });

    // Pagination
    pageSizeSelect.addEventListener('change', handlePageSizeChange);
    prevPage.addEventListener('click', () => changePage(currentPage - 1));
    nextPage.addEventListener('click', () => changePage(currentPage + 1));

    // Select all
    selectAll.addEventListener('change', handleSelectAll);

    // Bulk actions
    bulkActions.addEventListener('click', toggleBulkMenu);
    document.addEventListener('click', (e) => {
        if (!bulkActions.contains(e.target) && !bulkMenu.contains(e.target)) {
            bulkMenu.classList.add('hidden');
        }
    });

    // Delete modal
    document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDelete').addEventListener('click', confirmDelete);
}

// Search functionality
function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();

    if (query) {
        searchClear.classList.remove('hidden');
    } else {
        searchClear.classList.add('hidden');
    }

    applyFilters();
}

function clearSearch() {
    searchInput.value = '';
    searchClear.classList.add('hidden');
    applyFilters();
}

// Filter functionality
function applyFilters() {
    const searchQuery = searchInput.value.trim().toLowerCase(); // convert search to lowercase
    const department = filterDepartment.value;
    const designation = filterDesignation.value;
    const site = filterSite.value;

    filteredWorkers = allWorkers.filter(worker => {
        const matchesSearch = !searchQuery ||
            (worker.name && worker.name.toLowerCase().includes(searchQuery)) ||
            (worker.fatherName && worker.fatherName.toLowerCase().includes(searchQuery)) ||
            (worker.userID && worker.userID.toLowerCase().includes(searchQuery)) ||
            (worker.mobileNumber && worker.mobileNumber.toLowerCase().includes(searchQuery)) ||
            (worker.aadharNumber && worker.aadharNumber.toLowerCase().includes(searchQuery)) ||
            (worker.accountNumber && worker.accountNumber.toLowerCase().includes(searchQuery));

        const matchesDepartment = !department || worker.department === department;
        const matchesDesignation = !designation || worker.designation === designation;
        const matchesSite = !site || worker.site === site;

        return matchesSearch && matchesDepartment && matchesDesignation && matchesSite;
    });

    currentPage = 1;
    renderWorkers();
}

function clearAllFilters() {
    searchInput.value = '';
    searchClear.classList.add('hidden');
    filterDepartment.value = '';
    filterDesignation.value = '';
    filterSite.value = '';
    filteredWorkers = [...allWorkers];
    currentPage = 1;
    renderWorkers();
}

// Sorting functionality
function handleSort(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }

    filteredWorkers.sort((a, b) => {
        let aValue = a[column];
        let bValue = b[column];

        // Special handling for userID like "JRCW1", "JRCW10"
        if (column === 'userID') {
            const aNum = parseInt(aValue.replace(/\D/g, ''), 10);
            const bNum = parseInt(bValue.replace(/\D/g, ''), 10);
            return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }

        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        // Normal ascending/descending handling
        if (sortDirection === 'asc') {
            if (aValue < bValue) return -1;
            if (aValue > bValue) return 1;
            return 0;
        } else {
            if (aValue > bValue) return -1;
            if (aValue < bValue) return 1;
            return 0;
        }
    });

    updateSortIcons();
    renderWorkers();
}

function updateSortIcons() {
    document.querySelectorAll('[data-sort] i').forEach(icon => {
        icon.className = 'fas fa-sort text-secondary-400';
    });

    if (sortColumn) {
        const activeHeader = document.querySelector(`[data-sort="${sortColumn}"] i`);
        if (activeHeader) {
            activeHeader.className = `fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'} text-primary`;
        }
    }
}

// Pagination functionality
function handlePageSizeChange() {
    pageSize = parseInt(pageSizeSelect.value);
    currentPage = 1;
    renderWorkers();
}

function changePage(page) {
    const totalPages = Math.ceil(filteredWorkers.length / pageSize);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderWorkers();
    }
}



// Render functions
function renderWorkers() {
    showLoading();

    setTimeout(() => {
        // Ensure default sort: newest first if no sort applied
        if (!sortColumn) {
            filteredWorkers.sort((a, b) => {
                const aNum = parseInt(a.userID.replace(/\D/g, ''), 10);
                const bNum = parseInt(b.userID.replace(/\D/g, ''), 10);
                return bNum - aNum; // DESCENDING (newest first)
            });
        }

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageWorkers = filteredWorkers.slice(startIndex, endIndex);

        if (pageWorkers.length === 0 && filteredWorkers.length === 0) {
            showEmptyState();
        } else {
            hideLoadingAndEmpty();
            renderDesktopTable(pageWorkers);
            renderMobileCards(pageWorkers);
            renderPagination();
            updateResultsCount();
        }
    }, 300);
}

// --- helpers go first ---
function safeText(str) {
    return str || "";
}

function safeFirstChar(str) {
    return (str && typeof str === "string") ? str.charAt(0) : "";
}

function renderDesktopTable(workers) {
    workerTableBody.innerHTML = workers.map(worker => `
<tr class="hover:bg-secondary-50 transition-fast">
    <td class="px-6 py-4">
    <input type="checkbox" value="${safeText(worker.userID)}" 
            onchange="handleRowSelection('${safeText(worker.userID)}', this.checked)"
            class="rowCheckbox rounded border-secondary-300 text-primary focus:ring-primary-500">
    </td>
    <td class="px-6 py-4 whitespace-nowrap">
    <span class="text-sm font-medium text-text-primary font-data">${safeText(worker.userID)}</span>
    </td>

    <td class="px-6 py-4 whitespace-nowrap">
    <div class="flex items-center">
        <div class="flex-shrink-0 h-8 w-8">
        <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span class="text-xs font-medium text-primary">${safeFirstChar(worker.name)}</span>
        </div>
        </div>
        <div class="ml-3">
        <div class="text-sm font-medium text-text-primary">${safeText(worker.name)}</div>
        </div>
    </div>
    </td>

    <td class="px-6 py-4 whitespace-nowrap">
    <div class="flex items-center">
        <div class="flex-shrink-0 h-8 w-8">
        <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span class="text-xs font-medium text-primary">${safeFirstChar(worker.fatherName)}</span>
        </div>
        </div>
        <div class="ml-3">
        <div class="text-sm font-medium text-text-primary">${safeText(worker.fatherName)}</div>
        </div>
    </div>
    </td>

    <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center justify-center">
            <div class="flex-shrink-0 h-8 w-8">
                <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span class="text-xs font-medium text-primary">${safeFirstChar(worker.maritalStatus)}</span>
                </div>
            </div>
        </div>
    </td>

    <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center justify-center">
            <div class="flex-shrink-0 h-8 w-8">
                <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span class="text-xs font-medium text-primary">${safeFirstChar(worker.gender)}</span>
                </div>
            </div>
        </div>
    </td>

    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-data text-center">${formatDate(worker.dateOfBirth)}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-data text-center">${formatDate(worker.dateOfJoining)}</td>

    <td class="px-6 py-4 whitespace-nowrap text-center">
        <span class="status-badge ${getDepartmentBadgeClass(worker.department)}">${worker.department}</span>
    </td>

    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary text-center">${worker.designation}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">${worker.site}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-data text-center">${worker.mobileNumber}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-data text-center">${worker.aadharNumber}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-data">${worker.holderName}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-data text-center">${worker.accountNumber}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-data text-center">${worker.ifsc}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-data">${worker.bankName}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-data item-center">${worker.aadharPdf ? `<a href="${worker.aadharPdf}" target="_blank"><img src="/Assets/Images/pdfIcon.png" alt="PDF Icon" width="50" height="50"></a>` : 'N/A'}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-data item-center">${worker.panPdf ? `<a href="${worker.panPdf}" target="_blank"><img src="/Assets/Images/pdfIcon.png" alt="PDF Icon" width="50" height="50"></a>` : 'N/A'}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-data item-center">${worker.bankDetail ? `<a href="${worker.bankDetail}" target="_blank"><img src="/Assets/Images/pdfIcon.png" alt="PDF Icon" width="50" height="50"></a>` : 'N/A'}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-data item-center w-60 max-h-[60] rounded-lg overflow-hidden">${worker.photoFront ? `<img class="object-contain max-h-[60px] min-w-[60px] rounded-lg overflow-hidden" src="${worker.photoFront}" alt="Front Photo" width="50">` : 'N/A'}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-data item-center w-60 max-h-[60] rounded-lg overflow-hidden">${worker.photoLeft ? `<img class="object-contain max-h-[60px] min-w-[60px] rounded-lg overflow-hidden" src="${worker.photoLeft}" alt="Left Photo" width="50">` : 'N/A'}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-data item-center w-60 max-h-[60] rounded-lg overflow-hidden">${worker.photoRight ? `<img class="object-contain max-h-[60px] min-w-[60px] rounded-lg overflow-hidden" src="${worker.photoRight}" alt="Right Photo" width="50">` : 'N/A'}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-text-secondary font-data">${worker.remarks}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div class="flex items-center space-x-2">
            <button onclick="viewWorker('${worker.userID}')" 
                    class="text-primary hover:text-primary-700 transition-fast" title="View Details">
                <i class="fas fa-eye"></i>
            </button>
            <button onclick="editWorker('${worker.userID}')" 
                    class="text-accent hover:text-accent-600 transition-fast" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteWorker('${worker.userID}')" 
                    class="text-error hover:text-red-600 transition-fast" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
            <button onclick="generateID('${worker.userID}')" 
                    class="text-warning hover:text-warning-600 transition-fast" title="Generate ID">
                <i class="fas fa-download"></i>
            </button>
        </div>
    </td>
</tr>
    `).join('');
}

function renderMobileCards(workers) {
    mobileCardView.innerHTML = workers.map(worker => `
                <div class="card mb-4">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center space-x-3">
                            <input type="checkbox" value="${worker.userID}" 
                                   onchange="handleRowSelection('${worker.userID}', this.checked)"
                                   class="rounded border-secondary-300 text-primary focus:ring-primary-500">
                            <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <span class="text-sm font-medium text-primary">${worker.name.charAt(0)}</span>
                            </div>
                            <div>
                                <div class="text-sm font-medium text-text-primary">${worker.name} S/O ${worker.fatherName}</div>
                                <div class="text-xs font-bold text-primary">${worker.userID}</div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button onclick="viewWorker('${worker.userID}')" 
                                    class="text-primary hover:text-primary-700 transition-fast p-1">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="editWorker('${worker.userID}')" 
                                    class="text-accent hover:text-accent-600 transition-fast p-1">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteWorker('${worker.userID}')" 
                                    class="text-error hover:text-red-600 transition-fast p-1">
                                <i class="fas fa-trash"></i>
                            </button>
                            <button onclick="generateID('${worker.userID}')" 
                                    class="text-warning hover:text-warning-600 transition-fast p-1">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <span class="text-text-secondary">Gender:</span>
                            <span class="status-badge ${getGenderBadgeClass(worker.gender)} ml-1">${safeFirstChar(worker.gender)}</span>
                        </div>
                        <div>
                            <span class="text-text-secondary">Marital Status:</span>
                            <span class="status-badge ${getMaritalStatusBadgeClass(worker.maritalStatus)} ml-1">${safeFirstChar(worker.maritalStatus)}</span>
                        </div>
                        <div>
                            <span class="text-text-secondary">Date of Birth:</span>
                            <span class="text-text-primary ml-1">${formatDate(worker.dateOfBirth)}</span>
                        </div>
                        <div>
                            <span class="text-text-secondary">Date of Joining:</span>
                            <span class="text-text-primary ml-1">${formatDate(worker.dateOfJoining)}</span>
                        </div>
                        <div>
                            <span class="text-text-secondary">Department:</span>
                            <span class="status-badge ${getDepartmentBadgeClass(worker.department)} ml-1">${worker.department}</span>
                        </div>
                        <div>
                            <span class="text-text-secondary">Designation:</span>
                            <span class="text-text-primary ml-1">${worker.designation}</span>
                        </div>
                        <div>
                            <span class="text-text-secondary">Site:</span>
                            <span class="text-text-primary ml-1">${worker.site}</span>
                        </div>
                        <div>
                            <span class="text-text-secondary">Mobile:</span>
                            <span class="text-text-primary font-data ml-1">${worker.mobileNumber}</span>
                        </div>
                        <div>
                            <span class="text-text-secondary">Aadhar:</span>
                            <span class="text-text-primary font-data ml-1">${worker.aadharNumber}</span>
                        </div>
                        <div>
                            <span class="text-text-secondary">Holder Name:</span>
                            <span class="text-text-primary font-data ml-1">${worker.holderName}</span>
                        </div>
                        <div>
                            <span class="text-text-secondary">Account:</span>
                            <span class="text-text-primary font-data ml-1">${worker.accountNumber}</span>
                        </div>
                        <div>
                            <span class="text-text-secondary">IFSC:</span>
                            <span class="text-text-primary font-data ml-1">${worker.ifsc}</span>
                        </div>
                        <div>
                            <span class="text-text-secondary">Bank Name:</span>
                            <span class="text-text-primary font-data ml-1">${worker.bankName}</span>
                        </div>
                        <div>
                            <span class="text-text-secondary">Remarks:</span>
                            <span class="text-text-primary font-data ml-1">${worker.remarks}</span>
                        </div>

                        <div class="flex items-center space-x-2">
                            <div>
                            <span class="text-text-primary font-data ml-1">${worker.aadharPdf ? `<a href="${worker.aadharPdf}" target="_blank"><img src="/Assets/Images/pdfIcon.png" alt="PDF Icon" width="50" height="50"></a>` : 'N/A'}</span>
                            </div>
                            <div>
                                <span class="text-text-primary font-data ml-1">${worker.panPdf ? `<a href="${worker.panPdf}" target="_blank"><img src="/Assets/Images/pdfIcon.png" alt="PDF Icon" width="50" height="50"></a>` : 'N/A'}</span>
                            </div>
                            <div>
                                <span class="text-text-primary font-data ml-1">${worker.bankDetail ? `<a href="${worker.bankDetail}" target="_blank"><img src="/Assets/Images/pdfIcon.png" alt="PDF Icon" width="50" height="50"></a>` : 'N/A'}</span>
                            </div>
                        </div>

                        <div class="flex items-center space-x-2">
                            <div>
                                <span class="text-text-primary font-data ml-1 w-60 max-h-[60] rounded-lg overflow-hidden">${worker.photoFront ? `<img class="object-contain max-h-[60px] min-w-[60px] rounded-lg overflow-hidden" src="${worker.photoFront}" alt="Front Photo">` : 'N/A'}</span>
                            </div>
                            <div>
                                <span class="text-text-primary font-data ml-1 w-60 max-h-[60] rounded-lg overflow-hidden">${worker.photoLeft ? `<img class="object-contain max-h-[60px] min-w-[60px] rounded-lg overflow-hidden" src="${worker.photoLeft}" alt="Left Photo">` : 'N/A'}</span>
                            </div>
                            <div>
                                <span class="text-text-primary font-data ml-1 w-60 max-h-[60] rounded-lg overflow-hidden">${worker.photoRight ? `<img class="object-contain max-h-[60px] min-w-[60px] rounded-lg overflow-hidden" src="${worker.photoRight}" alt="Right Photo">` : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
}

function renderPagination() {
    const totalPages = Math.ceil(filteredWorkers.length / pageSize);

    prevPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;

    // Generate page numbers
    let pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    // Build pagination buttons (with First & Last)
    pageNumbers.innerHTML = `
        <button onclick="changePage(1)" 
                class="px-3 py-2 text-sm rounded-md text-text-secondary hover:bg-secondary-100"
                ${currentPage === 1 ? 'disabled' : ''}>
            First
        </button>
        ${pages.map(page => `
            <button onclick="changePage(${page})" 
                    class="px-3 py-2 text-sm rounded-md transition-fast ${page === currentPage
            ? 'bg-primary text-white'
            : 'text-text-secondary hover:bg-secondary-100'}">
                ${page}
            </button>
        `).join('')}
        <button onclick="changePage(${totalPages})" 
                class="px-3 py-2 text-sm rounded-md text-text-secondary hover:bg-secondary-100"
                ${currentPage === totalPages ? 'disabled' : ''}>
            Last
        </button>
    `;
}

function updateResultsCount() {
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, filteredWorkers.length);
    const total = filteredWorkers.length;

    resultsCount.textContent = `Showing ${startIndex}-${endIndex} of ${total} workers`;
}

// <<------------Selection functionality------------>>

// Excel Export Handler
document.addEventListener("DOMContentLoaded", () => {
    const exportBtn = document.getElementById("exportSelectedExcel");
    if (!exportBtn) return;

    exportBtn.addEventListener("click", async () => {
        if (selectedWorkers.size === 0) {
            alert("Please select at least one worker to export.");
            return;
        }

        exportBtn.disabled = true;
        const originalText = exportBtn.textContent;
        exportBtn.textContent = "Exporting...";

        try {
            const response = await fetch("/id-dashboard/export-excel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: Array.from(selectedWorkers) })
            });

            if (!response.ok) {
                throw new Error(`Failed to export Excel. Status: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            // Extract filename from response headers if possible
            const disposition = response.headers.get("Content-Disposition");
            let filename = "workers.xlsx";
            if (disposition && disposition.includes("filename=")) {
                filename = disposition.split("filename=")[1].replace(/"/g, '');
            }
            a.download = filename;

            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error("Excel export error:", err);
            alert("Error exporting Excel. See console for details.");
        } finally {
            exportBtn.disabled = false;
            exportBtn.textContent = originalText;
        }
    });
});


// Handle select all checkbox
function handleSelectAll() {
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
        if (selectAll.checked) {
            selectedWorkers.add(checkbox.value);
        } else {
            selectedWorkers.delete(checkbox.value);
        }
    });
    updateBulkActions();
}

function handleRowSelection(userID, checked) {
    if (checked) {
        selectedWorkers.add(userID);
    } else {
        selectedWorkers.delete(userID);
    }
    updateBulkActions();
}

function updateBulkActions() {
    const hasSelection = selectedWorkers.size > 0;
    bulkActions.disabled = !hasSelection;

    if (hasSelection) {
        bulkActions.classList.remove('opacity-50');
    } else {
        bulkActions.classList.add('opacity-50');
        bulkMenu.classList.add('hidden');
    }
}

function toggleBulkMenu() {
    if (!bulkActions.disabled) {
        bulkMenu.classList.toggle('hidden');
    }
}

// Utility functions
function getDepartmentBadgeClass(department) {
    const classes = {
        'Carpenter': 'bg-accent-100 text-accent-600',
        'Chef': 'bg-error-100 text-error-600',
        'Civil': 'status-error',
        'Housekeeping': 'status-info',
        'Inventory': 'bg-success',
        'Painter': 'status-warning',
        'POP': 'status-warning'
    };
    return classes[department] || 'bg-secondary-100 text-secondary-600';
}

function getMaritalStatusBadgeClass(maritalStatus) {
    const classes = {
        'Married': 'status-error',
        'Unmarried': 'status-success'
    };
    return classes[maritalStatus] || 'bg-secondary-100 text-secondary-600';
}

function getGenderBadgeClass(gender) {
    const classes = {
        'Male': 'status-success',
        'Female': 'status-error'
    };
    return classes[gender] || 'bg-secondary-100 text-secondary-600';
}

function showLoading() {
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    workerTableBody.innerHTML = '';
    mobileCardView.innerHTML = '';
}

function showEmptyState() {
    loadingState.classList.add('hidden');
    emptyState.classList.remove('hidden');
    workerTableBody.innerHTML = '';
    mobileCardView.innerHTML = '';
}

function hideLoadingAndEmpty() {
    loadingState.classList.add('hidden');
    emptyState.classList.add('hidden');
}

// Fetch summary stats
async function fetchSummaryStats() {
    try {
        const res = await fetch('/summary-stats');
        const stats = await res.json();

        document.getElementById("totalWorkers").textContent = stats.totalWorkers;
        document.getElementById("idsToday").textContent = stats.idsGeneratedToday;
    } catch (err) {
        console.error("Failed to load summary stats", err);
    }
}

// Fetch on page load
fetchSummaryStats();

// Load department breakdown
async function loadDepartmentBreakdown() {
  try {
    const res = await fetch("/department-breakdown");
    const data = await res.json();

    const container = document.querySelector("#department-breakdown");
    container.innerHTML = ""; // Clear old content

    data.forEach(dep => {
      const colorClass = getRandomColor(); // Optional color function
      container.innerHTML += `
        <div class="flex items-center justify-between">
          <span class="text-sm text-text-secondary">${dep.department}</span>
          <div class="flex items-center space-x-2">
            <div class="w-16 bg-secondary-200 rounded-full h-2">
              <div class="${colorClass} h-2 rounded-full" style="width: ${dep.percentage}%"></div>
            </div>
            <span class="w-8 text-center text-sm font-medium text-text-primary">${dep.count}</span>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error("Error loading department breakdown:", err);
  }
}

// Simple helper to rotate bar colors
function getRandomColor() {
  const colors = ["bg-primary", "bg-accent", "bg-warning", "bg-error", "bg-success"];
  return colors[Math.floor(Math.random() * colors.length)];
}

loadDepartmentBreakdown();


// Action functions
function viewWorker(userID) {
    window.location.href = `worker-detail-view?id=${userID}`;
}

function deleteWorker(userID, event) {
    // Showing modal
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('hidden');

    // Save userID in dataset for later use
    modal.dataset.userID = userID;

    // Clear password input
    document.getElementById('adminPassword').value = '';
}

function generateID(userID) {
    // Simulate ID generation
    const button = event.target.closest('button');
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    button.disabled = true;

    setTimeout(() => {
        button.innerHTML = originalHTML;
        button.disabled = false;
        alert(`ID card generated for ${userID}`);
    }, 2000);
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
    document.getElementById('adminPassword').value = '';
}

function confirmDelete() {
    const password = document.getElementById('adminPassword').value;
    const userID = document.getElementById('deleteModal').dataset.userID;

    if (password === 'admin123') {
        fetch(`/id-dashboard/records/${userID}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Remove from frontend array
                    const index = allWorkers.findIndex(emp => emp.userID === userID);
                    if (index > -1) allWorkers.splice(index, 1);

                    applyFilters(); // refresh table
                    closeDeleteModal();
                    alert(`Worker ${userID} deleted successfully`);
                } else {
                    alert(data.error || 'Failed to delete worker');
                }
            })
            .catch(err => {
                console.error('Error deleting worker:', err);
                alert('Failed to delete worker');
            });
    } else {
        alert('Invalid admin password');
    }
}