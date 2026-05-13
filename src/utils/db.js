const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'surat_desa',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true, connectionLimit: 10, timezone: '+07:00'
});
pool.getConnection().then(c=>{console.log('DB terhubung');c.release();}).catch(e=>console.error('DB Error:',e.message));
module.exports = pool;
