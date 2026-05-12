require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('./src/infrastructure/database/pool');

pool.query(
  "UPDATE usuarios SET pode_slides = TRUE WHERE email = 'matheus@teste.com' RETURNING id, nome, email, pode_slides"
).then(r => {
  if (r.rows[0]) console.log('OK:', r.rows[0]);
  else console.log('Usuario nao encontrado');
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
