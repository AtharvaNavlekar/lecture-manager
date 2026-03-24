const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'server/.env' });
const token = jwt.sign({ id: 0 }, process.env.JWT_SECRET || 'secret_key_123');

async function test() {
  try {
    console.log('Fetching from 4051...');
    const res = await fetch('http://localhost:4051/api/v1/analytics/summary', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const text = await res.text();
    console.log('Summary API Result:', res.status, text);

    const res2 = await fetch('http://localhost:4051/api/v1/analytics/attendance-trends', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const text2 = await res2.text();
    console.log('Trends API Result:', res2.status, text2);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
test();
