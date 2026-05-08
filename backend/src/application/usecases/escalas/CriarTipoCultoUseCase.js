class CriarTipoCultoUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ ministerioId, nome, diaSemana }) {
    if (!nome?.trim()) throw { status: 400, message: 'Nome obrigatorio.' };
    return this.escalaRepository.criarTipoCulto({ ministerioId, nome: nome.trim(), diaSemana });
  }
}

module.exports = CriarTipoCultoUseCase;
