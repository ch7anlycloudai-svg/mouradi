/**
 * Seed script: creates default store settings if not present.
 *
 * The admin user is created by database.sql (run in Supabase SQL Editor).
 * Default admin: admin@wwenatou.com / admin123
 *
 * Usage:
 *   node src/utils/seed.js
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_SECRET_KEY
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const supabase = require('../config/supabase');

async function seed() {
  console.log('--- WWenatou Seed Script ---\n');

  // Insert default store settings (if not exists)
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
