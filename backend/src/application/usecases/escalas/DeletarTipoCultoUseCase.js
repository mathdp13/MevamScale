class DeletarTipoCultoUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute(id) {
    await this.escalaRepository.deletarTipoCulto(id);
  }
}

module.exports = DeletarTipoCultoUseCase;
