class DeletarEscalaUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute(escalaId) {
    await this.escalaRepository.deletarEscala(escalaId);
  }
}

module.exports = DeletarEscalaUseCase;
