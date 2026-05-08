class AtualizarFuncaoUseCase {
  constructor(ministerioRepository) {
    this.ministerioRepository = ministerioRepository;
  }

  async execute({ funcaoId, ministerioId, nome }) {
    if (!nome?.trim()) throw { status: 400, message: 'Nome nao pode ser vazio.' };
    return this.ministerioRepository.atualizarFuncao({ funcaoId, ministerioId, nome: nome.trim() });
  }
}

module.exports = AtualizarFuncaoUseCase;
