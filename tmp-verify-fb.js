const fs = require('fs');
const path = require('path');

// Mock process.env for testing
const SERVICE_ACCOUNT_PATH = 'firebase-service-account.json';
let serviceAccountData = '';

if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    serviceAccountData = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8');
    process.env.FIREBASE_SERVICE_ACCOUNT = serviceAccountData;
    console.log('Found local service account file. Set process.env.FIREBASE_SERVICE_ACCOUNT for testing.');
} else {
    console.error('Local firebase-service-account.json not found. Please ensure it exists to run this test.');
    process.exit(1);
}

// Now try to "initialize" by parsing the env var (simulating our logic)
try {
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (parsed.project_id && parsed.private_key) {
        console.log('✅ Success: FIREBASE_SERVICE_ACCOUNT parsed correctly and contains necessary keys.');
        console.log('Project ID:', parsed.project_id);
    } else {
        console.error('❌ Error: Parsed JSON is missing project_id or private_key.');
    }
} catch (e) {
    console.error('❌ Error: Failed to parse FIREBASE_SERVICE_ACCOUNT:', e.message);
}
