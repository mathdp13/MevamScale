class AtualizarSubstituicaoUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ id, status }) {
    if (!['aprovado', 'rejeitado'].includes(status)) throw { status: 400, message: 'Status invalido.' };
    return this.escalaRepository.atualizarSubstituicao({ id, status });
  }
}

module.exports = AtualizarSubstituicaoUseCase;
