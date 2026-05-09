class DeletarAusenciaUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ id, usuarioId }) {
    return this.escalaRepository.deletarAusencia({ id, usuarioId });
  }
}

module.exports = DeletarAusenciaUseCase;
