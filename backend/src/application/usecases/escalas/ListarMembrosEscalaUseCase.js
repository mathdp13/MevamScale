class ListarMembrosEscalaUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute(escalaId) {
    return this.escalaRepository.listarMembros(escalaId);
  }
}

module.exports = ListarMembrosEscalaUseCase;
