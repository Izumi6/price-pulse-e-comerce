const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:oFfiIrrwGgVOpRV0@db.rzeotdpiajdwhnapwfii.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  try {
    const productsRes = await pool.query(
      `SELECT * FROM products WHERE LOWER(name) LIKE $1 OR LOWER(category) LIKE $1 OR EXISTS (SELECT 1 FROM unnest(keywords) k WHERE k LIKE $1 OR $2 LIKE '%' || k || '%') ORDER BY id`,
      [`%${q}%`, q]
    );
    const ids = productsRes.rows.map(p => p.id);
    if (ids.length === 0) return res.json([]);
    const storesRes = await pool.query('SELECT * FROM stores WHERE product_id = ANY($1) ORDER BY price', [ids]);
    const products = productsRes.rows.map(p => ({
      ...p,
      stores: storesRes.rows.filter(s => s.product_id === p.id)
    }));
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
