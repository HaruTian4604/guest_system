import { readFileSync, writeFileSync } from 'fs';

const path = __dirname + '/data.json';

/**
 * Get all data from storage
 */
export function get_all() {
  const json = readFileSync(path).toString();
  return JSON.parse(json);
}

/**
 * Save all data to storage
 */
export function set_all(data) {
  const json2 = JSON.stringify(data);
  writeFileSync(path, json2);
}

/**
 * List all guests
 */
export async function list_guests() {
  return get_all().guests;
}

/**
 * Find guest by ID
 * @param guestId
 */
export async function find_guest_by_id(guestId) {
  const guests = await list_guests();
  return guests.find(g => g.id === guestId);
}

/**
 * Create a new guest
 * @param full_name
 * @param date_of_birth
 * @param additional_info (optional)
 */
export async function create_guest(full_name, date_of_birth, additional_info = {}) {
  const all = await get_all();

  if (!all.guests) {
    all.guests = [];
  }

  // Validate input
  if (!full_name || full_name.length < 2) {
    throw new Error('Full name must be at least 2 characters');
  }

  if (!date_of_birth || isNaN(new Date(date_of_birth).getTime())) {
    throw new Error('Invalid date of birth');
  }

  const newGuest = {
    id: Date.now().toString(), // Simple ID generation
    full_name,
    date_of_birth,
    created_at: new Date().toISOString(),
    ...additional_info
  };

  all.guests.push(newGuest);
  set_all(all);
  return newGuest;
}

/**
 * Update guest information
 * @param guestId
 * @param updates
 */
export async function update_guest(guestId, updates) {
  const all = await get_all();
  const guestIndex = all.guests.findIndex(g => g.id === guestId);

  if (guestIndex === -1) {
    throw new Error('Guest not found');
  }

  // Validate updates
  if (updates.full_name && updates.full_name.length < 2) {
    throw new Error('Full name must be at least 2 characters');
  }

  if (updates.date_of_birth && isNaN(new Date(updates.date_of_birth).getTime())) {
    throw new Error('Invalid date of birth');
  }

  all.guests[guestIndex] = {
    ...all.guests[guestIndex],
    ...updates,
    updated_at: new Date().toISOString()
  };

  set_all(all);
  return all.guests[guestIndex];
}

/**
 * Delete a guest
 * @param guestId
 */
export async function delete_guest(guestId) {
  const all = await get_all();
  const initialLength = all.guests.length;

  all.guests = all.guests.filter(g => g.id !== guestId);

  if (all.guests.length === initialLength) {
    throw new Error('Guest not found');
  }

  set_all(all);
  return true;
}
