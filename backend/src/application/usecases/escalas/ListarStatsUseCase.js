class ListarStatsUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ ministerioId }) {
    return this.escalaRepository.listarStats({ ministerioId });
  }
}

module.exports = ListarStatsUseCase;
