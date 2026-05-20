const { Pool } = require('pg');

const pool = new Pool({
  host: '2406:da18:167b:f901:e4a8:e9aa:e646:a68b',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'oFfiIrrwGgVOpRV0',
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  try {
    const productsRes = await pool.query('SELECT * FROM products ORDER BY id');
    const storesRes = await pool.query('SELECT * FROM stores ORDER BY product_id, price');
    const products = productsRes.rows.map(p => ({
      ...p,
      stores: storesRes.rows.filter(s => s.product_id === p.id)
    }));
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
