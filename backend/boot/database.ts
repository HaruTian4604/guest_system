import mysql from 'mysql2/promise';

export async function get_connection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '12341234',
    database: process.env.DB_NAME || 'guest_management',
    port: parseInt(process.env.DB_PORT || '3306')
  });
}
