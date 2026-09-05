/**
 * Seed script: creates default admin user and store settings if not present.
 *
 * Default admin: admin@wwenatou.com / admin123
 *
 * Usage:
 *   node src/utils/seed.js
 *
 * Required env vars:
 *   DATABASE_URL or PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const bcrypt = require('bcryptjs');
const { query, shutdown } = require('../config/database');

async function seed() {
  console.log('--- WWenatou Seed Script ---\n');

  // 1. Create default admin user if not exists
  console.log('Checking for existing admin user...');
  const adminResult = await query(
    "SELECT id FROM admin_users WHERE email = 'admin@wwenatou.com'"
  );

  if (adminResult.rows.length > 0) {
    console.log(`Admin user already exists (id: ${adminResult.rows[0].id}). Skipping.\n`);
  } else {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const insertResult = await query(
      'INSERT INTO admin_users (email, password_hash) VALUES ($1, $2) RETURNING id',
      ['admin@wwenatou.com', passwordHash]
    );
    console.log(`Default admin user created (id: ${insertResult.rows[0].id})\n`);
  }

  // 2. Create default store settings if not exists
  console.log('Checking for existing store settings...');
  const settingsResult = await query('SELECT id FROM store_settings LIMIT 1');

  if (settingsResult.rows.length > 0) {
    console.log(`Store settings already exist (id: ${settingsResult.rows[0].id}). Skipping.\n`);
  } else {
    const insertResult = await query(
      `INSERT INTO store_settings (store_name, whatsapp_number, phone_number, email, address_ar, address_fr)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['WWenatou Shopping', '+22247305955', '+22247305955', 'contact@wwenatou.com', 'نواكشوط، موريتانيا', 'Nouakchott, Mauritanie']
    );
    console.log(`Default store settings created (id: ${insertResult.rows[0].id})\n`);
  }

  console.log('--- Seed complete ---');
  await shutdown();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('Seed script failed:', err);
  await shutdown();
  process.exit(1);
});
