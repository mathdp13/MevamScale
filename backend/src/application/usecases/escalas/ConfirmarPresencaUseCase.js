class ConfirmarPresencaUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ escalaId, usuarioId, confirmado }) {
    await this.escalaRepository.confirmarPresenca({ escalaId, usuarioId, confirmado });
  }
}

module.exports = ConfirmarPresencaUseCase;
