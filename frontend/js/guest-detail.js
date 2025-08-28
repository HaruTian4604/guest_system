// Get guest ID from URL parameters
function getGuestIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Calculate age from date of birth (DD-MM-YYYY)
function calculateAge(dob) {
    if (!dob) return null;

    try {
        const [day, month, year] = dob.split('-').map(Number);
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    } catch (e) {
        console.error('Error calculating age:', e);
        return null;
    }
}

// Format date from DD-MM-YYYY to more readable format
function formatDate(dateStr) {
    if (!dateStr) return '-';

    try {
        const [day, month, year] = dateStr.split('-');
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
}

// Load guest details from API
async function loadGuestDetails(guestId) {
    try {
        const guestData = await api('guest/pick', { id: guestId });

        if (guestData.ok) {
            displayGuestDetails(guestData.data);
            loadPlacementHistory(guestId);
        } else {
            showError('Failed to load guest details: ' + (guestData.error || 'Unknown error'));
        }
    } catch (error) {
        showError('Network error: ' + error.message);
    }
}

// Display guest details in the UI
function displayGuestDetails(guest) {
    document.getElementById('guest-id').textContent = guest.id;
    document.getElementById('guest-fullname').textContent = guest.full_name || '-';
    document.getElementById('guest-dob').textContent = guest.date_of_birth ? formatDate(guest.date_of_birth) : '-';

    const age = calculateAge(guest.date_of_birth);
    document.getElementById('guest-age').textContent = age || '-';

    const statusBadge = document.getElementById('guest-status');
    statusBadge.textContent = guest.status || '-';
    statusBadge.classList.add(
        guest.status === 'placed' ? 'badge-success' : 'badge-warning'
    );

    // Set note content
    const noteContent = document.getElementById('note-content');
    const noteTextarea = document.getElementById('note-textarea');

    if (guest.note) {
        noteContent.textContent = guest.note;
        noteTextarea.value = guest.note;
    } else {
        noteContent.textContent = 'No notes available.';
        noteTextarea.value = '';
    }

    // Show the content and hide loading
    document.getElementById('loading').classList.add('d-none');
    document.getElementById('guest-details').classList.remove('d-none');

    syncNotesHeight();
}

// Load placement history for the guest
async function loadPlacementHistory(guestId) {
    try {
        const placementsData = await api('placement/list-by-guest', { guest_id: guestId });

        if (placementsData.ok && placementsData.data && placementsData.data.length > 0) {
            displayPlacements(placementsData.data);
        } else {
            document.getElementById('no-placements').classList.remove('d-none');
        }
    } catch (error) {
        console.error('Failed to load placement history:', error);
        document.getElementById('no-placements').classList.remove('d-none');
    }
}

// Display placements in the table
function displayPlacements(placements) {
    const placementsBody = document.getElementById('placements-body');
    placementsBody.innerHTML = '';

    placements.forEach(placement => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${placement.host_name || '-'}</td>
            <td>${placement.accommodation_address || '-'} ${placement.accommodation_postcode || ''}</td>
            <td>${formatDate(placement.start_date)}</td>
            <td>${placement.end_date ? formatDate(placement.end_date) : 'Ongoing'}</td>
            <td><span class="badge ${placement.end_date ? 'badge-secondary' : 'badge-success'}">${placement.end_date ? 'Completed' : 'Active'}</span></td>
        `;

        placementsBody.appendChild(row);
    });

    document.getElementById('placements-table').classList.remove('d-none');
}

// Show error message
function showError(message) {
    document.getElementById('loading').classList.add('d-none');
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
}

// Toggle note editing mode
function toggleNoteEditing(isEditing) {
    const noteView = document.getElementById('note-view');
    const noteEdit = document.getElementById('note-edit');
    const editButton = document.getElementById('note-edit-btn');

    if (isEditing) {
        noteView.classList.add('d-none');
        noteEdit.classList.remove('d-none');
        editButton.textContent = 'Save';
        editButton.classList.remove('btn-outline-primary');
        editButton.classList.add('btn-primary');
    } else {
        noteView.classList.remove('d-none');
        noteEdit.classList.add('d-none');
        editButton.textContent = 'Edit';
        editButton.classList.remove('btn-primary');
        editButton.classList.add('btn-outline-primary');
    }

    syncNotesHeight();
}

// Save note to server
async function saveNote(guestId, noteContent) {
    const statusElement = document.getElementById('note-status');

    try {
        const result = await api('guest/update', {
            id: guestId,
            note: noteContent
        });

        if (result.ok) {
            yo_success('Note saved successfully', '');

            // Update the displayed note
            document.getElementById('note-content').textContent = noteContent || 'No notes available.';

            return true;
        } else {
            yo_error('Error: ', result.error);
            return false;
        }
    } catch (error) {
        yo_error('Error: ', error.message);
        return false;
    }
}

// Initialize page
async function initPage() {
    const guestId = getGuestIdFromUrl();

    if (!guestId || isNaN(parseInt(guestId))) {
        showError('Invalid guest ID');
        return;
    }

    await loadGuestDetails(parseInt(guestId));

    // Set up note editing functionality
    const editButton = document.getElementById('note-edit-btn');
    const cancelButton = document.getElementById('note-cancel-btn');
    const saveButton = document.getElementById('note-save-btn');
    const noteTextarea = document.getElementById('note-textarea');

    let isEditing = false;

    editButton.addEventListener('click', async function () {
        if (!isEditing) {
            // Switch to edit mode
            toggleNoteEditing(true);
            isEditing = true;
        } else {
            // Save the note
            const success = await saveNote(guestId, noteTextarea.value);
            if (success) {
                toggleNoteEditing(false);
                isEditing = false;
            }
        }
    });

    cancelButton.addEventListener('click', function () {
        // Reset textarea to original value
        const originalNote = document.getElementById('note-content').textContent;
        noteTextarea.value = originalNote === 'No notes available.' ? '' : originalNote;

        toggleNoteEditing(false);
        isEditing = false;
    });

    saveButton.addEventListener('click', async function () {
        const success = await saveNote(guestId, noteTextarea.value);
        if (success) {
            toggleNoteEditing(false);
            isEditing = false;
        }
    });
}

function syncNotesHeight() {
    const gi = document.getElementById('guest-info-card');
    const notes = document.getElementById('notes-card');
    if (!gi || !notes) return;
    // 用 !important 强制覆盖所有高度声明
    notes.style.setProperty('height', gi.offsetHeight + 'px', 'important');
}

// Start the page when DOM is loaded
document.addEventListener('DOMContentLoaded', initPage);
window.addEventListener('resize', syncNotesHeight);
