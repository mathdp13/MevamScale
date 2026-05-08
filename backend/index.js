if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
}

const app = require('./app');
const { run: runMigrations } = require('./src/infrastructure/database/migrations');

const migrationReady = runMigrations().catch((err) => {
  console.error('Erro nas migrations:', err.message);
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  migrationReady.then(() => {
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  });
}

module.exports = async (req, res) => {
  await migrationReady;
  return app(req, res);
};
