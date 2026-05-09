class ListarSubstituicoesUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ ministerioId, status }) {
    return this.escalaRepository.listarSubstituicoes({ ministerioId, status });
  }
}

module.exports = ListarSubstituicoesUseCase;
