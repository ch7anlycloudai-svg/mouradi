/**
 * Seed script: creates initial admin user and default store settings.
 *
 * Usage:
 *   node src/utils/seed.js
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function seed() {
  console.log('--- WWenatou Seed Script ---\n');

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    process.exit(1);
  }

  // 1. Create admin user (if not exists)
  console.log(`Checking for existing admin user (${ADMIN_EMAIL})...`);

  const { data: existingAdmin } = await supabase
    .from('admin_users')
    .select('id, email')
    .eq('email', ADMIN_EMAIL.toLowerCase().trim())
    .single();

  if (existingAdmin) {
    console.log(`Admin user already exists (id: ${existingAdmin.id}). Skipping.\n`);
  } else {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const { data: newAdmin, error: adminErr } = await supabase
      .from('admin_users')
      .insert({
        email: ADMIN_EMAIL.toLowerCase().trim(),
        password_hash: passwordHash,
      })
      .select('id, email')
      .single();

    if (adminErr) {
      console.error('Failed to create admin user:', adminErr.message);
      process.exit(1);
    }

    console.log(`Admin user created: ${newAdmin.email} (id: ${newAdmin.id})\n`);
  }

  // 2. Insert default store settings (if not exists)
  console.log('Checking for existing store settings...');

  const { data: existingSettings } = await supabase
    .from('store_settings')
    .select('id')
    .limit(1)
    .single();

  if (existingSettings) {
    console.log(`Store settings already exist (id: ${existingSettings.id}). Skipping.\n`);
  } else {
    const { data: settings, error: settingsErr } = await supabase
      .from('store_settings')
      .insert({
        store_name: 'WWenatou Shopping',
        whatsapp_number: '+22247305955',
        phone_number: '+22247305955',
        email: 'contact@wwenatou.com',
        address_ar: 'نواكشوط، موريتانيا',
        address_fr: 'Nouakchott, Mauritanie',
      })
      .select('id')
      .single();

    if (settingsErr) {
      console.error('Failed to create store settings:', settingsErr.message);
      process.exit(1);
    }

    console.log(`Default store settings created (id: ${settings.id})\n`);
  }

  console.log('--- Seed complete ---');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
