class CriarMinisterioUseCase {
  constructor(ministerioRepository) {
    this.ministerioRepository = ministerioRepository;
  }

  async execute({ nome, icone, lider_id }) {
    return this.ministerioRepository.criar({ nome, icone, lider_id });
  }
}

module.exports = CriarMinisterioUseCase;
