class BuscarMinisteriosUseCase {
  constructor(ministerioRepository) {
    this.ministerioRepository = ministerioRepository;
  }

  async execute(usuarioId) {
    return this.ministerioRepository.buscarPorUsuario(usuarioId);
  }
}

module.exports = BuscarMinisteriosUseCase;
