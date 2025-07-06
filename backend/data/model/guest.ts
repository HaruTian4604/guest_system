import { Invalid_argument } from '../../error/invalid_argument';
import { ModelType } from '../utility';
import { Base } from './base';

export class Guest extends Base {
  static type: ModelType = 'guests';
  static searchable: string[] = ['full_name','status'];
  static fillable: string[] = ['full_name', 'date_of_birth', 'status'];
  static statuses: string[] = ['placed', 'unplaced'];

  full_name: string; // Full name
  date_of_birth: string; // Date in DD-MM-YYYY format
  status: string; // Current placement status

  /**
   * Validate guest data
   */
  static validate(row: Guest) {
    // Validate full name
    if (row.full_name) {
      if (row.full_name.length < 2) {
        throw new Invalid_argument('Full name must be at least 2 characters long');
      }
      if (!/^[a-zA-Z\s\-']+$/.test(row.full_name)) {
        throw new Invalid_argument('Full name contains invalid characters');
      }
    }

    // Validate date of birth (DD-MM-YYYY)
    if (row.date_of_birth) {
      if (!/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-(19|20)\d\d$/.test(row.date_of_birth)) {
        throw new Invalid_argument('Date of birth must be in DD-MM-YYYY format');
      }

      // Additional date validation (check if date is valid)
      const [day, month, year] = row.date_of_birth.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (date.getDate() !== day || date.getMonth() + 1 !== month || date.getFullYear() !== year) {
        throw new Invalid_argument('Invalid date of birth');
      }
    }

    // Validate status
    if (row.status && !this.statuses.includes(row.status)) {
      throw new Invalid_argument(`Status must be one of: ${this.statuses.join(', ')}`);
    }

    return true;
  }

  /**
   * Calculate age from date of birth
   */
  static calculateAge(dateOfBirth: string): number {
    const [day, month, year] = dateOfBirth.split('-').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}
