class SalvarFuncoesMembroUseCase {
  constructor(ministerioRepository) {
    this.ministerioRepository = ministerioRepository;
  }

  async execute({ usuarioId, ministerioId, funcaoIds }) {
    if (!Array.isArray(funcaoIds)) throw { status: 400, message: 'funcaoIds deve ser um array.' };
    await this.ministerioRepository.salvarFuncoesMembro({ usuarioId, ministerioId, funcaoIds });
    return { message: 'Funcoes salvas com sucesso.' };
  }
}

module.exports = SalvarFuncoesMembroUseCase;
