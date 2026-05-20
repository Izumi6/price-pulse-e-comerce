const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: 'db.rzeotdpiajdwhnapwfii.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'oFfiIrrwGgVOpRV0',
  ssl: { rejectUnauthorized: false }
});

async function setup() {
  const client = await pool.connect();
  try {
    console.log('Connected to Supabase!');

    // Create tables
    await client.query(`
      DROP TABLE IF EXISTS stores CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        image TEXT,
        tags TEXT[],
        keywords TEXT[]
      );
      CREATE TABLE stores (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(id),
        name TEXT,
        icon TEXT,
        price INT,
        orig INT,
        delivery TEXT,
        url TEXT
      );
    `);
    console.log('Tables created!');

    // Extract products from INDEX.HTML
    const html = fs.readFileSync('./INDEX.HTML', 'utf8');
    const match = html.match(/const products = \[([\s\S]*?)\n\];/);
    if (!match) { console.log('Could not find products array'); return; }

    // Use eval to parse the JS array (safe here since it's our own file)
    const products = eval('[' + match[1] + ']');
    console.log(`Found ${products.length} products`);

    for (const p of products) {
      const res = await client.query(
        'INSERT INTO products (name, category, image, tags, keywords) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [p.name, p.category, p.image, p.tags, p.keywords]
      );
      const pid = res.rows[0].id;
      for (const s of p.stores) {
        await client.query(
          'INSERT INTO stores (product_id, name, icon, price, orig, delivery, url) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [pid, s.name, s.icon, s.price, s.orig, s.delivery, s.url]
        );
      }
      console.log(`Inserted: ${p.name}`);
    }
    console.log('All data inserted!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    client.release();
    pool.end();
  }
}

setup();
