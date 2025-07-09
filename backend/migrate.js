// migrate.js
const mysql = require('mysql2/promise');
const fs = require('fs').promises;

async function main() {
  // 读取JSON数据
  const data = await fs.readFile('./data/data.json', 'utf8');
  const jsonData = JSON.parse(data);

  // 创建数据库连接
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12341234',
    database: 'guest_management',
    port: 3306
  });

  // 迁移guests数据
  const guests = Object.values(jsonData.guests);
  for (const guest of guests) {
    await connection.execute(
      `INSERT INTO guests (id, full_name, date_of_birth, status)
       VALUES (?, ?, ?, ?)`,
      [guest.id, guest.full_name, guest.date_of_birth, guest.status]
    );
  }
  console.log(`插入 ${guests.length} 条guests数据`);

  // 迁移primary_hosts数据
  const primaryHosts = Object.values(jsonData.primary_hosts);
  for (const host of primaryHosts) {
    await connection.execute(
      `INSERT INTO primary_hosts (id, full_name)
       VALUES (?, ?)`,
      [host.id, host.full_name]
    );
  }
  console.log(`插入 ${primaryHosts.length} 条primary_hosts数据`);

  // 迁移accommodations数据
  const accommodations = Object.values(jsonData.accommodations);
  for (const acc of accommodations) {
    await connection.execute(
      `INSERT INTO accommodations (id, address, postcode, host_id, status)
       VALUES (?, ?, ?, ?, ?)`,
      [acc.id, acc.address, acc.postcode, acc.host_id, acc.status]
    );
  }
  console.log(`插入 ${accommodations.length} 条accommodations数据`);

  // 迁移placements数据
  const placements = Object.values(jsonData.placements);
  for (const placement of placements) {
    await connection.execute(
      `INSERT INTO placements (id, guest_id, host_id, accommodation_id, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        placement.id,
        placement.guest_id,
        placement.host_id,
        placement.accommodation_id,
        placement.start_date,
        placement.end_date === "" ? null : placement.end_date
      ]
    );
  }
  console.log(`插入 ${placements.length} 条placements数据`);

  await connection.end();
  console.log('数据迁移完成！');
}

main().catch(console.error);
