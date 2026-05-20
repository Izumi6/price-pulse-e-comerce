const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:oFfiIrrwGgVOpRV0@db.rzeotdpiajdwhnapwfii.supabase.co:5432/postgres',
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
