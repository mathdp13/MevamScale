class AdicionarMembroEscalaUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ escalaId, usuarioId, funcaoId }) {
    return this.escalaRepository.adicionarMembro({ escalaId, usuarioId, funcaoId });
  }
}

module.exports = AdicionarMembroEscalaUseCase;
