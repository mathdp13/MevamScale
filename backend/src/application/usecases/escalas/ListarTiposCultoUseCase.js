class ListarTiposCultoUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute(ministerioId) {
    return this.escalaRepository.listarTiposCulto(ministerioId);
  }
}

module.exports = ListarTiposCultoUseCase;
