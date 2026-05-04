class BuscarMinisterioUseCase {
  constructor(ministerioRepository) {
    this.ministerioRepository = ministerioRepository;
  }

  async execute(id) {
    const ministerio = await this.ministerioRepository.buscarPorId(id);
    if (!ministerio) throw { status: 404, message: 'Ministerio nao encontrado.' };
    return ministerio;
  }
}

module.exports = BuscarMinisterioUseCase;
