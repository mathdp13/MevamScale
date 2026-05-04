class CriarFuncaoUseCase {
  constructor(ministerioRepository) {
    this.ministerioRepository = ministerioRepository;
  }

  async execute({ ministerioId, nome }) {
    if (!nome || !nome.trim()) throw { status: 400, message: 'Nome da funcao e obrigatorio.' };
    return this.ministerioRepository.criarFuncao({ ministerioId, nome: nome.trim() });
  }
}

module.exports = CriarFuncaoUseCase;
