const fs = require('fs');
try {
  JSON.parse(fs.readFileSync('src/data/scientific_miracles.json', 'utf8'));
  console.log('JSON valid');
} catch (e) {
  console.log('JSON ERROR:', e.message);
}
