class DeletarFuncaoUseCase {
  constructor(ministerioRepository) {
    this.ministerioRepository = ministerioRepository;
  }

  async execute({ funcaoId, ministerioId }) {
    await this.ministerioRepository.deletarFuncao(funcaoId, ministerioId);
    return { message: 'Funcao removida.' };
  }
}

module.exports = DeletarFuncaoUseCase;
