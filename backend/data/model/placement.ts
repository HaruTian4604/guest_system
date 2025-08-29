import { Base } from './base';
import { Invalid_argument } from '../../error/invalid_argument';
import { Connection, RowDataPacket } from 'mysql2/promise';
import { get_connection } from '../../boot/database';

export class Placement extends Base {
    static tableName = 'placements';
    static searchable: string[] = ['guest_id', 'host_id', 'accommodation_id'];
    static fillable: string[] = ['guest_id', 'host_id', 'accommodation_id', 'start_date', 'end_date'];

    static validate(row: any) {
        if (!row.guest_id) throw new Invalid_argument('Guest ID is required');
        if (!row.host_id) throw new Invalid_argument('Host ID is required');
        if (!row.accommodation_id) throw new Invalid_argument('Accommodation ID is required');
        if (!row.start_date) throw new Invalid_argument('Start date is required');

        // 日期格式验证
        if (row.start_date && !/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-(19|20)\d\d$/.test(row.start_date)) {
            throw new Invalid_argument('Start date must be in DD-MM-YYYY format');
        }

        if (row.end_date && !/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-(19|20)\d\d$/.test(row.end_date)) {
            throw new Invalid_argument('End date must be in DD-MM-YYYY format');
        }

        // 日期逻辑验证
        if (row.start_date && row.end_date) {
            const [startDay, startMonth, startYear] = row.start_date.split('-').map(Number);
            const [endDay, endMonth, endYear] = row.end_date.split('-').map(Number);

            const start = new Date(startYear, startMonth - 1, startDay);
            const end = new Date(endYear, endMonth - 1, endDay);

            if (end < start) {
                throw new Invalid_argument('End date cannot be before start date');
            }
        }
    }

    static async create(row: any): Promise<any> {
        this.validate(row);

        // 检查guest是否已有重叠的placement
        const guestOverlap = await this._checkDateOverlap(
            this.tableName,
            'guest_id',
            row.guest_id,
            row.start_date,
            row.end_date
        );

        if (guestOverlap) {
            throw new Invalid_argument('Guest already has a placement during this period');
        }

        // 检查accommodation是否已被占用
        const accommodationOverlap = await this._checkDateOverlap(
            this.tableName,
            'accommodation_id',
            row.accommodation_id,
            row.start_date,
            row.end_date
        );

        if (accommodationOverlap) {
            throw new Invalid_argument('Accommodation is already occupied during this period');
        }

        return await this._withTx(async (conn) => {
            const result = await super.create.call(this, row, conn);

            // 更新guest状态为placed
            await this._updateStatus('guests', row.guest_id, 'status', 'placed');

            // 更新accommodation状态为unavailable
            await this._updateStatus('accommodations', row.accommodation_id, 'status', 'unavailable');

            return result;
        });
    }

    static async update(partial: any): Promise<any> {
        if (!partial.id) throw new Invalid_argument('ID is required');

        const before = await this.pick(partial.id);
        this.validate({ ...before, ...partial });

        // 检查guest是否已有其他重叠的placement（排除当前记录）
        if (partial.guest_id || partial.start_date || partial.end_date) {
            const guestId = partial.guest_id || before.guest_id;
            const startDate = partial.start_date || before.start_date;
            const endDate = partial.end_date || before.end_date;

            const guestOverlap = await this._checkDateOverlap(
                this.tableName,
                'guest_id',
                guestId,
                startDate,
                endDate,
                partial.id
            );

            if (guestOverlap) {
                throw new Invalid_argument('Guest already has another placement during this period');
            }
        }

        // 检查accommodation是否已被其他placement占用（排除当前记录）
        if (partial.accommodation_id || partial.start_date || partial.end_date) {
            const accommodationId = partial.accommodation_id || before.accommodation_id;
            const startDate = partial.start_date || before.start_date;
            const endDate = partial.end_date || before.end_date;

            const accommodationOverlap = await this._checkDateOverlap(
                this.tableName,
                'accommodation_id',
                accommodationId,
                startDate,
                endDate,
                partial.id
            );

            if (accommodationOverlap) {
                throw new Invalid_argument('Accommodation is already occupied by another placement during this period');
            }
        }

        return await this._withTx(async (conn) => {
            const result = await super.update.call(this, partial, conn);

            // 如果placement已结束，更新相关状态
            const today = new Date();
            const [endDay, endMonth, endYear] = result.end_date.split('-').map(Number);
            const endDate = new Date(endYear, endMonth - 1, endDay);

            if (result.end_date && endDate < today) {
                // 检查guest是否有其他活跃的placement
                const activePlacements = await this._getActivePlacementsForGuest(result.guest_id, conn);
                if (activePlacements.length === 0) {
                    await this._updateStatus('guests', result.guest_id, 'status', 'unplaced');
                }

                // 检查accommodation是否有其他活跃的placement
                const activeAccommodations = await this._getActivePlacementsForAccommodation(result.accommodation_id, conn);
                if (activeAccommodations.length === 0) {
                    await this._updateStatus('accommodations', result.accommodation_id, 'status', 'available');
                }
            }

            return result;
        });
    }

    static async delete(id: number): Promise<void> {
        const placement = await this.pick(id);

        return await this._withTx(async (conn) => {
            await super.delete.call(this, id, conn);

            // 检查guest是否有其他活跃的placement
            const activePlacements = await this._getActivePlacementsForGuest(placement.guest_id, conn);
            if (activePlacements.length === 0) {
                await this._updateStatus('guests', placement.guest_id, 'status', 'unplaced');
            }

            // 检查accommodation是否有其他活跃的placement
            const activeAccommodations = await this._getActivePlacementsForAccommodation(placement.accommodation_id, conn);
            if (activeAccommodations.length === 0) {
                await this._updateStatus('accommodations', placement.accommodation_id, 'status', 'available');
            }
        });
    }

    private static async _getActivePlacementsForGuest(guestId: number, conn?: Connection): Promise<any[]> {
        const today = new Date();
        const todayStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

        const query = `
      SELECT * FROM ${this.tableName}
      WHERE guest_id = ?
      AND start_date <= ?
      AND (end_date IS NULL OR end_date >= ?)
    `;

        if (conn) {
            const [rows] = await conn.query<RowDataPacket[]>(query, [guestId, todayStr, todayStr]);
            return rows;
        } else {
            const c = await get_connection();
            try {
                const [rows] = await c.query<RowDataPacket[]>(query, [guestId, todayStr, todayStr]);
                return rows;
            } finally {
                c.end();
            }
        }
    }

    private static async _getActivePlacementsForAccommodation(accommodationId: number, conn?: Connection): Promise<any[]> {
        const today = new Date();
        const todayStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

        const query = `
      SELECT * FROM ${this.tableName}
      WHERE accommodation_id = ?
      AND start_date <= ?
      AND (end_date IS NULL OR end_date >= ?)
    `;

        if (conn) {
            const [rows] = await conn.query<RowDataPacket[]>(query, [accommodationId, todayStr, todayStr]);
            return rows;
        } else {
            const c = await get_connection();
            try {
                const [rows] = await c.query<RowDataPacket[]>(query, [accommodationId, todayStr, todayStr]);
                return rows;
            } finally {
                c.end();
            }
        }
    }

    // 获取特定guest的所有placement
    static async listByGuest(guestId: number): Promise<any[]> {
        const conn = await get_connection();
        try {
            const [rows] = await conn.query<RowDataPacket[]>(`
        SELECT p.*, h.full_name as host_name, a.address as accommodation_address, a.postcode as accommodation_postcode
        FROM ${this.tableName} p
        LEFT JOIN hosts h ON p.host_id = h.id
        LEFT JOIN accommodations a ON p.accommodation_id = a.id
        WHERE p.guest_id = ?
        ORDER BY p.start_date DESC
      `, [guestId]);

            return rows;
        } finally {
            conn.end();
        }
    }

    // 获取特定host的所有placement
    static async listByHost(hostId: number): Promise<any[]> {
        const conn = await get_connection();
        try {
            const [rows] = await conn.query<RowDataPacket[]>(`
        SELECT p.*, g.full_name as guest_name, a.address as accommodation_address, a.postcode as accommodation_postcode
        FROM ${this.tableName} p
        LEFT JOIN guests g ON p.guest_id = g.id
        LEFT JOIN accommodations a ON p.accommodation_id = a.id
        WHERE p.host_id = ?
        ORDER BY p.start_date DESC
      `, [hostId]);

            return rows;
        } finally {
            conn.end();
        }
    }

    // 获取特定accommodation的所有placement
    // static async listByAccommodation(accommodationId: number): Promise<any[]> {
    //     const conn = await get_connection();
    //     try {
    //         const [rows] = await conn.query<RowDataPacket[]>(`
    //     SELECT p.*, g.full_name as guest_name, h.full_name as host_name
    //     FROM ${this.tableName} p
    //     LEFT JOIN guests g ON p.guest_id = g.id
    //     LEFT JOIN hosts h ON p.host_id = h.id
    //     WHERE p.accommodation_id = ?
    //     ORDER BY p.start_date DESC
    //   `, [accommodationId]);

    //         return rows;
    //     } finally {
    //         conn.end();
    //     }
    // }

    // placement.ts - 添加冲突检测方法
    static async checkConflicts(query: any): Promise<{ has_conflict: boolean; message?: string }> {
        const { guest_id, accommodation_id, start_date, end_date, exclude_id } = query;

        // 检查guest冲突
        const guestOverlap = await this._checkDateOverlap(
            this.tableName,
            'guest_id',
            guest_id,
            start_date,
            end_date,
            exclude_id ? parseInt(exclude_id) : undefined
        );

        if (guestOverlap) {
            return {
                has_conflict: true,
                message: 'Guest already has a placement during this period'
            };
        }

        // 检查accommodation冲突
        const accommodationOverlap = await this._checkDateOverlap(
            this.tableName,
            'accommodation_id',
            accommodation_id,
            start_date,
            end_date,
            exclude_id ? parseInt(exclude_id) : undefined
        );

        if (accommodationOverlap) {
            return {
                has_conflict: true,
                message: 'Accommodation is already occupied during this period'
            };
        }

        return { has_conflict: false };
    }

    // placement.ts - 添加按 accommodation 查询的方法
    static async listByAccommodation(accommodationId: number): Promise<any[]> {
        const conn = await get_connection();
        try {
            const [rows] = await conn.query<RowDataPacket[]>(`
      SELECT p.*, g.full_name as guest_name, h.full_name as host_name
      FROM ${this.tableName} p
      LEFT JOIN guests g ON p.guest_id = g.id
      LEFT JOIN hosts h ON p.host_id = h.id
      WHERE p.accommodation_id = ?
      ORDER BY p.start_date DESC
    `, [accommodationId]);

            return rows;
        } finally {
            conn.end();
        }
    }

}
