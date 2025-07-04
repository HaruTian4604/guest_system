const { readFile, writeFile } = require('fs').promises;

const data_path = __dirname + '/data.json';
/**
 * Data cache
 */
let all;

/**
 * Get model data
 * @param name
 */
export async function get_data(name?: ModelType) {
  if ( ! all) {
    // Read file, get JSON string data
    const json = await readFile(data_path);
    // Parse JSON to live data
    all = JSON.parse(json.toString());
  }

  return name ? all[name] : all;
}

/**
 * Get single record by id
 */
export async function pick(name: ModelType, id: number) {
  const list = await get_data(name);
  return list[id];
}

/**
 * Update a record
 * @param name
 * @param partial
 */
export async function update(name: ModelType, partial: any) {
  const id = partial.id;
  const list = await get_data(name);
  const row = list[id];
  const updated = { ...row, ...partial };
  list[id] = updated;
  await sync_to_file();
  return updated;
}

/**
 * Insert a new record
 * @param name
 */
export async function insert_data(name: ModelType, row, all?) {
  all = all || await get_data();
  all[name][row.id] = row;
  await sync_to_file();
}

/**
 * Delete a record
 */
export async function delete_row(name: ModelType, id: number) {
  const list = await get_data(name);
  delete list[id];
  await sync_to_file();
}

/**
 * Get latest id
 * @param name
 */
export async function get_last_id(name: ModelType) {
  const all = await get_data();
  return all._states.model[name].last_id;
}

/**
 * Write all data to file
 */
export async function sync_to_file() {
  // Convert data to JSON
  const json = JSON.stringify(all);
  // Save JSON back to file
  await writeFile(data_path, json);
}

/**
 * Return only specified keys from object
 * @param obj
 * @param keys
 */
export function only(obj, keys: string[]) {
  const r: any = {};
  for (let key in obj) {
    if ( ! keys.includes(key)) { continue; }
    r[key] = obj[key];
  }

  return r;
}

/**
 * Auto-increment id
 */
export async function increase(name: ModelType) {
  // Get last id
  const last_id = await get_last_id(name);
  // Increment by 1
  const id = last_id + 1;
  // Update state data
  all._states.model[name].last_id = id;
  // Sync to file
  await sync_to_file();
  return id;
}

export type ModelType = 'accommodations' | 'guests' | 'hosts' | 'placements'
