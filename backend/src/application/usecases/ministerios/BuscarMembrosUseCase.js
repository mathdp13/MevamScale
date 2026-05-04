class BuscarMembrosUseCase {
  constructor(ministerioRepository) {
    this.ministerioRepository = ministerioRepository;
  }

  async execute(ministerioId) {
    return this.ministerioRepository.buscarMembros(ministerioId);
  }
}

module.exports = BuscarMembrosUseCase;
