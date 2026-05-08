class CriarEscalaUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ ministerioId, tipoCultoId, nome, dataEvento, dataEnsaio }) {
    if (!nome?.trim()) throw { status: 400, message: 'Nome obrigatorio.' };
    if (!dataEvento) throw { status: 400, message: 'Data do evento obrigatoria.' };
    return this.escalaRepository.criarEscala({ ministerioId, tipoCultoId, nome: nome.trim(), dataEvento, dataEnsaio });
  }
}

module.exports = CriarEscalaUseCase;
