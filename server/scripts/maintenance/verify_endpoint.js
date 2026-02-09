const http = require('http');
const jwt = require('jsonwebtoken');

// 1. Generate Valid Token
const SECRET_KEY = process.env.JWT_SECRET || 'lecture_manager_secret_key_2024'; // Check .env for real key if this fails
const adminPayload = { id: 1, email: 'admin@college.edu', role: 'admin', department: 'Admin' };
const token = jwt.sign(adminPayload, SECRET_KEY, { expiresIn: '1h' });

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/users-credentials',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
};

console.log('🔍 Testing API Endpoint (Native HTTP)...');
console.log(`   URL: http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
    console.log(`✅ Response Received. Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const json = JSON.parse(data);
                console.log(`   Success: true`);
                console.log(`   Users Found: ${json.users ? json.users.length : 'N/A'}`);
            } catch (e) {
                console.log('   Response is not JSON:', data.substring(0, 100));
            }
        } else {
            console.log(`   <strong>FAILED STATUS</strong>: ${res.statusCode}`);
            console.log(`   Body: ${data}`);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Connection Error: ${e.message}`);
});

req.end();
