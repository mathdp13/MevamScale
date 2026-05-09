class CriarAusenciaUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ usuarioId, ministerioId, data, motivo }) {
    if (!usuarioId || !ministerioId || !data) throw { status: 400, message: 'Campos obrigatorios.' };
    return this.escalaRepository.criarAusencia({ usuarioId, ministerioId, data, motivo });
  }
}

module.exports = CriarAusenciaUseCase;
