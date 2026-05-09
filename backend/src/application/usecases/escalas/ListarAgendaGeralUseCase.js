class ListarAgendaGeralUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ mes, ano, ministerioId }) {
    return this.escalaRepository.listarAgendaGeral({ mes, ano, ministerioId });
  }
}

module.exports = ListarAgendaGeralUseCase;
