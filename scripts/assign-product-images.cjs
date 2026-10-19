// Runs the photo-only SQL migration using existing .env.local credentials.
// No credentials are printed or stored in Git.
const { loadEnvConfig } = require('@next/env');
const { Pool } = require('pg');
const fs = require('node:fs');
const path = require('node:path');
const projectRoot = path.resolve(__dirname, '..');
loadEnvConfig(projectRoot, true);

const pgConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, max: 1 }
  : {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      max: 1,
    };

async function main() {
  if (!process.env.DATABASE_URL &&
      (!pgConfig.host || !pgConfig.database || !pgConfig.user || !pgConfig.password)) {
    throw new Error('Database connection is missing. Run this inside your original project folder containing .env.local.');
  }
  for (const name of ['vine-tomatoes','orange-carrots','baby-spinach','blueberries',
     'cherry-tomatoes','curry-leaves','potatoes','fresh-green-beans']) {
    const asset=path.join(projectRoot,'public','produce', name+'.webp');
    if (!fs.existsSync(asset)) throw new Error('Missing product photo: '+asset);
  }
  const pool = new Pool(pgConfig);
  try {
    const result = await pool.query(fs.readFileSync(
      path.join(projectRoot,'db','assign-product-images.sql'),'utf8'));
    console.log('Product images assigned:', result.rowCount);
    for (const row of result.rows) {
      console.log(`${row.product_id}: ${row.name} -> ${row.image_url}`);
    }
    console.log('Done. Refresh /marketplace and check product cards.');
  } finally {
    await pool.end();
  }
}
main().catch(err => { console.error('Unable to assign photos:', err.message); process.exitCode = 1; });
