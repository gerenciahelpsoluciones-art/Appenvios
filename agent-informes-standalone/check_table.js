const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env manually since dotenv might not be there
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { error } = await supabase.from('contratos_obligaciones').select('id').limit(1);
    if (error && error.code === '42P01') {
        console.log('TABLE_MISSING');
    } else if (error) {
        console.log('ERROR: ' + error.message);
    } else {
        console.log('TABLE_EXISTS');
    }
}
check();
