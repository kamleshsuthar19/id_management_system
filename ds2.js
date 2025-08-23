document.addEventListener('DOMContentLoaded', () => {
    console.log("Dashboard loaded");
});

const filters = [
  'filterName',
  'filterMobileNumber',
  'filterAadharNumber',
  'filterDepartment',
  'filterDesignation',
  'filterSite'
];

let debounceTimer;
filters.forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loadRecords();
    }, 300);
  });
});

function clearFilters() {
  filters.forEach(id => document.getElementById(id).value = '');
  loadRecords();
}

filters.forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    const hasInput = filters.some(f => document.getElementById(f).value.trim() !== '');
    if (!hasInput) loadRecords();
  });
});

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

async function loadRecords() {
  const name = document.getElementById('filterName').value.trim();
  const aadharNumber = document.getElementById('filterAadharNumber').value.trim();
  const mobileNumber = document.getElementById('filterMobileNumber').value.trim();
  const department = document.getElementById('filterDepartment').value.trim();
  const designation = document.getElementById('filterDesignation').value.trim();
  const site = document.getElementById('filterSite').value.trim();

  const query = new URLSearchParams({ name, aadharNumber, mobileNumber, department, designation, site }).toString();
  const res = await fetch(`/id-dashboard/records?${query}`);
  const data = await res.json();

  const tbody = document.getElementById('recordsTableBody');
  tbody.innerHTML = data.map(user => `
    <tr>
      <td>${user.userID || 'N/A'}</td>
      <td>${user.name || 'N/A'}</td>
      <td>${user.fatherName || 'N/A'}</td>
      <td>${user.maritalStatus || 'N/A'}</td>
      <td>${user.gender || 'N/A'}</td>
      <td>${formatDate(user.dateOfBirth) || 'N/A'}</td>
      <td>${formatDate(user.dateOfJoining) || 'N/A'}</td>
      <td>${user.department || 'N/A'}</td>
      <td>${user.designation || 'N/A'}</td>
      <td>${user.site || 'N/A'}</td>
      <td>${user.mobileNumber || 'N/A'}</td>
      <td>${user.aadharNumber || 'N/A'}</td>
      <td>${user.accountNumber || 'N/A'}</td>
      <td>${user.ifsc || 'N/A'}</td>
      <td>${user.bankName || 'N/A'}</td>
      <td class="td-wrap">${user.remarks || 'N/A'}</td>
      <td class="td-wrap">${user.aadharPdf ? `<a href="${user.aadharPdf}" target="_blank"><img src="/Assets/Images/pdfIcon.png" alt="PDF Icon" width="50" height="50"></a>` : 'N/A'}</td>
      <td class="td-wrap">${user.panPdf ? `<a href="${user.panPdf}" target="_blank"><img src="/Assets/Images/pdfIcon.png" alt="PDF Icon" width="50" height="50"></a>` : 'N/A'}</td>
      <td>${user.photoFront ? `<img src="${user.photoFront}" alt="Front Photo" width="50">` : 'N/A'}</td>
      <td>${user.photoLeft ? `<img src="${user.photoLeft}" alt="Left Photo" width="50">` : 'N/A'}</td>
      <td>${user.photoRight ? `<img src="${user.photoRight}" alt="Right Photo" width="50">` : 'N/A'}</td>
      <td class="td-wrap">${user.bankDetail ? `<a href="${user.bankDetail}" target="_blank"><img src="/Assets/Images/pdfIcon.png" alt="PDF Icon" width="50" height="50"></a>` : 'N/A'}</td>
      <td><button class="edit-btn" onclick="editRecord('${user.userID}', '${(user.name || '').replace(/'/g, "\\'")}')">Edit</button></td>
    </tr>
  `).join('');
}

async function editRecord(userID, currentName) {
  const newName = prompt('Edit name:', currentName);
  if (!newName || newName === currentName) return;

  const res = await fetch(`/id-dashboard/records/${userID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName })
  });

  if (res.ok) {
    alert('Name updated successfully.');
    loadRecords();
  } else {
    alert('Failed to update record.');
  }
}

window.onload = loadRecords;