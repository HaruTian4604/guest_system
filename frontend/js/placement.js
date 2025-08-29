// placement-form.js
document.addEventListener('DOMContentLoaded', async function() {
  const form = document.getElementById('placement-form');
  const guestSelect = document.getElementById('guest_id');
  const accommodationSelect = document.getElementById('accommodation_id');
  const startDateInput = document.getElementById('start_date');
  const endDateInput = document.getElementById('end_date');
  const conflictMessage = document.getElementById('conflict-message');

  // 加载可用的guest和accommodation
  await loadAvailableOptions();

  // 日期变化时检查冲突
  [startDateInput, endDateInput].forEach(input => {
    input.addEventListener('change', checkConflicts);
  });

  // 表单提交前验证
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const conflicts = await checkConflicts();
    if (conflicts) {
      yo_error('Cannot save placement due to conflicts');
      return;
    }

    // 提交表单
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const action = data.id ? 'update' : 'create';
    const result = await api(`placement/${action}`, data);

    if (result.ok) {
      yo_success('Placement saved successfully');
      window.location.href = 'placement-list.html';
    } else {
      yo_error(result.error);
    }
  });

  async function loadAvailableOptions() {
    // 加载未安置的guest
    const guestsResult = await api('guest/list', { status: 'unplaced', limit: 1000 });
    if (guestsResult.ok) {
      guestSelect.innerHTML = '<option value="">Select Guest</option>';
      guestsResult.data.forEach(guest => {
        const option = document.createElement('option');
        option.value = guest.id;
        option.textContent = `${guest.full_name} (DOB: ${guest.date_of_birth})`;
        guestSelect.appendChild(option);
      });
    }

    // 加载可用的accommodation
    const accommodationsResult = await api('accommodation/list', { status: 'available', limit: 1000 });
    if (accommodationsResult.ok) {
      accommodationSelect.innerHTML = '<option value="">Select Accommodation</option>';
      accommodationsResult.data.forEach(accommodation => {
        const option = document.createElement('option');
        option.value = accommodation.id;
        option.textContent = `${accommodation.address} (${accommodation.postcode})`;
        accommodationSelect.appendChild(option);
      });
    }
  }

  async function checkConflicts() {
    const guestId = guestSelect.value;
    const accommodationId = accommodationSelect.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (!guestId || !accommodationId || !startDate) {
      conflictMessage.classList.add('d-none');
      return false;
    }

    const result = await api('placement/check-conflicts', {
      guest_id: guestId,
      accommodation_id: accommodationId,
      start_date: startDate,
      end_date: endDate,
      exclude_id: form.id.value || undefined
    });

    if (result.ok && result.has_conflict) {
      conflictMessage.textContent = result.message;
      conflictMessage.classList.remove('d-none');
      return true;
    } else {
      conflictMessage.classList.add('d-none');
      return false;
    }
  }
});
