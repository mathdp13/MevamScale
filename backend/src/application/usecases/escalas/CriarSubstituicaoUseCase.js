class CriarSubstituicaoUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ escalaId, solicitanteId, motivo }) {
    if (!escalaId || !solicitanteId) throw { status: 400, message: 'Campos obrigatorios.' };
    return this.escalaRepository.criarSubstituicao({ escalaId, solicitanteId, motivo });
  }
}

module.exports = CriarSubstituicaoUseCase;
