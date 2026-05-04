class ListarFuncoesUseCase {
  constructor(ministerioRepository) {
    this.ministerioRepository = ministerioRepository;
  }

  async execute(ministerioId) {
    return this.ministerioRepository.listarFuncoes(ministerioId);
  }
}

module.exports = ListarFuncoesUseCase;
