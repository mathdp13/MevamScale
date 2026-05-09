class ListarAusenciasUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ ministerioId, mes, ano }) {
    return this.escalaRepository.listarAusencias({ ministerioId, mes, ano });
  }
}

module.exports = ListarAusenciasUseCase;
