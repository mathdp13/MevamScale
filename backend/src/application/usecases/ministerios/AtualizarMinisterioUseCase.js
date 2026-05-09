class AtualizarMinisterioUseCase {
  constructor(ministerioRepository) {
    this.ministerioRepository = ministerioRepository;
  }

  async execute({ ministerioId, nome }) {
    if (!nome?.trim()) throw { status: 400, message: 'Nome nao pode ser vazio.' };
    return this.ministerioRepository.atualizarNome({ ministerioId, nome: nome.trim() });
  }
}

module.exports = AtualizarMinisterioUseCase;
