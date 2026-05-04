if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
}

const app = require('./app');
const { run: runMigrations } = require('./src/infrastructure/database/migrations');

runMigrations().catch((err) => console.error('Erro nas migrations:', err.message));

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
}

module.exports = app;
