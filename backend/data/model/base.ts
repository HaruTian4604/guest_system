import { Invalid_argument } from '../../error/invalid_argument';
import { delete_row, get_data, increase, insert_data, ModelType, only, pick, update } from '../utility';

/**
 * Base class
 */
export class Base {
  static type: ModelType;
  static searchable: string[];
  static fillable: string[];

  id: number; // Unique identifier

  /**
   * Get total count of records
   */
  static async count() {
    const all = await get_data(this.type);
    return Object.keys(all).length;
  }

  /**
   * Create a new record
   * @param row
   */
  static async create(row: any) {
    const obj = only(row, this.fillable);
    // Auto-increment ID
    obj.id = await increase(this.type);
    // Validate data
    this.validate(row);
    // Insert new record
    await insert_data(this.type, obj);
    return obj;
  }

  /**
   * Delete a record
   * @param id
   */
  static async delete(id: number) {
    if (!id) { throw new Invalid_argument('ID parameter is required'); }
    await delete_row(this.type, id);
  }

  /**
   * Update a record
   * @param partial
   */
  static async update(partial: any) {
    if (!partial.id) { throw new Invalid_argument('ID parameter is required'); }

    const obj = only(partial, this.fillable);
    obj.id = parseInt(partial.id);
    // Validate data
    this.validate(partial);
    await update(this.type, obj);
    return this.pick(partial.id);
  }

  /**
   * List records with pagination
   * @param page
   * @param limit
   * @param order_by
   */
  static async list(page = 1, limit = 15, order_by = 'id', desc = false, keyword?: string) {
    const list = Object.values(await get_data(this.type));
    let copy = [...list];

    // Search
    if (keyword) {
      copy = copy.filter((it: any) => {
        for (let prop of this.searchable) {
          if (it[prop]?.toLowerCase().includes(keyword.toLowerCase())) {
            return true;
          }
        }

        return false;
      });
    }

    // Sort
    // copy.sort((a, b) => {
    //   const va = a[order_by] + '';
    //   const vb = b[order_by] + '';
    //   let num = va.localeCompare(vb);
    //   if (desc) { num = num * -1; }
    //   return num;
    // });
    copy.sort((a, b) => {
      const va = a[order_by];
      const vb = b[order_by];

      let num;
      if (typeof va === 'number' && typeof vb === 'number') {
        num = va - vb;
      } else {
        num = String(va).localeCompare(String(vb));
      }

      return desc ? -num : num;
    });

    const skip = (page - 1) * limit;
    const range = page * limit;
    return copy.slice(skip, range);
  }

  /**
   * Get a record by ID
   * @param id
   */
  static async pick(id: number) {
    return pick(this.type, id);
  }

  /**
   * Validate record data
   */
  static validate(row: any) { }
}
