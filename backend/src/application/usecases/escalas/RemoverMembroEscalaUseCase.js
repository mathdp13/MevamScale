class RemoverMembroEscalaUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ escalaId, usuarioId }) {
    await this.escalaRepository.removerMembro({ escalaId, usuarioId });
  }
}

module.exports = RemoverMembroEscalaUseCase;
