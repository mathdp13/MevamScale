class ListarEscalasUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ ministerioId, mes, ano }) {
    const agora = new Date();
    return this.escalaRepository.listarEscalas({
      ministerioId,
      mes: mes || agora.getMonth() + 1,
      ano: ano || agora.getFullYear(),
    });
  }
}

module.exports = ListarEscalasUseCase;
