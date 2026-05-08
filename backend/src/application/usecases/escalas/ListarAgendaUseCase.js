class ListarAgendaUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ usuarioId, mes, ano }) {
    return this.escalaRepository.listarAgenda({ usuarioId, mes, ano });
  }
}

module.exports = ListarAgendaUseCase;
