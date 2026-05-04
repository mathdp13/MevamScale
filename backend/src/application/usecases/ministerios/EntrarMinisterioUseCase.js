class EntrarMinisterioUseCase {
  constructor(ministerioRepository) {
    this.ministerioRepository = ministerioRepository;
  }

  async execute({ codigo, usuario_id }) {
    const ministerio = await this.ministerioRepository.buscarPorCodigo(codigo);
    if (!ministerio) throw { status: 404, message: 'Código inválido ou ministério não encontrado.' };

    await this.ministerioRepository.adicionarMembro(usuario_id, ministerio.id);
    return { message: 'Você entrou no ministério!', ministerioId: ministerio.id };
  }
}

module.exports = EntrarMinisterioUseCase;
