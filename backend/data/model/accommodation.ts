import { Invalid_argument } from '../../error/invalid_argument';
import { ModelType } from '../utility';
import { Base } from './base';

export class Accommodation extends Base {
  static type: ModelType = 'accommodations';
  static searchable: string[] = ['address', 'postcode'];
  static fillable: string[] = ['address', 'postcode', 'host_id', 'status'];
  static statuses: string[] = ['available', 'unavailable'];

  address: string;
  postcode: string;
  host_id: number;
  status: string;

  /**
   * Validate accommodation data
   */
  static validate(row: Accommodation) {
    if (row.status && !this.statuses.includes(row.status)) {
      throw new Invalid_argument('Invalid status type');
    }

    if (row.postcode && !/^[A-Za-z0-9\- ]+$/.test(row.postcode)) {
      throw new Invalid_argument('Invalid postcode format');
    }

    if (row.host_id && isNaN(Number(row.host_id))) {
      throw new Invalid_argument('Host ID must be a number');
    }

    return true;
  }
}
