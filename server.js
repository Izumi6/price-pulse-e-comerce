const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const pool = new Pool({
  host: 'db.rzeotdpiajdwhnapwfii.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'oFfiIrrwGgVOpRV0',
  ssl: { rejectUnauthorized: false }
});

const app = express();
app.use(express.static(path.join(__dirname)));

app.get('/api/products', async (req, res) => {
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
});

app.get('/api/search', async (req, res) => {
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
});

app.listen(3000, () => console.log('PriceRadar running at http://localhost:3000'));
