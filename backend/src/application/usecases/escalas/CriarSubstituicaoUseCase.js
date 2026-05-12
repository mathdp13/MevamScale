class CriarSubstituicaoUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ escalaId, solicitanteId, motivo }) {
    if (!escalaId || !solicitanteId) throw { status: 400, message: 'Campos obrigatorios.' };
    const existente = await this.escalaRepository.buscarSubstituicaoPendente({ escalaId, solicitanteId });
    if (existente) throw { status: 409, message: 'Voce ja tem um pedido pendente para esta escala.' };
    return this.escalaRepository.criarSubstituicao({ escalaId, solicitanteId, motivo });
  }
}

module.exports = CriarSubstituicaoUseCase;
