class ListarAgendaGeralUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ mes, ano }) {
    return this.escalaRepository.listarAgendaGeral({ mes, ano });
  }
}

module.exports = ListarAgendaGeralUseCase;
