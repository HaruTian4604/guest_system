// backend/data/model/accommodation.ts
import type { RowDataPacket } from 'mysql2/promise';
import { Base } from './base';
import { get_connection } from '../../boot/database';
import { Invalid_argument } from '../../error/invalid_argument';

export class Accommodation extends Base {
  static tableName = 'accommodations';
  static viewName  = 'view_accommodations';

  // 关键词搜索字段
  static searchable = ['address', 'postcode','host'];

  // 可写字段（注意：不包含 status）
  // 若你的表里确实有 note 字段，可把 'note' 加进来
  static fillable   = ['address', 'postcode', 'host_id', 'archived'/*, 'note'*/];

  // 读取字段（前端表格/详情需要 host_name 与 status）
  static columns: string | string[] =
    'id, address, postcode, host_id, archived, status, host_name';

  static validate(row: any) {
    if ('address' in row) {
      const v = String(row.address || '').trim();
      if (!v) throw new Invalid_argument('address is required');
    }
    if ('postcode' in row) {
      const v = String(row.postcode || '').trim();
      if (!v) throw new Invalid_argument('postcode is required');
    }
    if ('host_id' in row) {
      const n = Number(row.host_id);
      if (!Number.isInteger(n) || n <= 0) throw new Invalid_argument('host_id is required');
    }
  }

  // 详情：沿用 Base.pick() 即可（已读视图）
  // 列表：沿用 Base.list() 即可（已读视图）

  // 若详情页“备注”功能使用 accommodation.update({note})
  // 且你表里有 note 字段，则无需额外处理；否则请在 DB 增加 note 列
}
