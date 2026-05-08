class DeletarMinisterioUseCase {
  constructor(ministerioRepository) {
    this.ministerioRepository = ministerioRepository;
  }

  async execute({ ministerioId, usuarioId }) {
    const ministerio = await this.ministerioRepository.buscarPorId(ministerioId);
    if (!ministerio) throw { status: 404, message: 'Ministerio nao encontrado.' };
    if (ministerio.lider_id !== usuarioId) throw { status: 403, message: 'Apenas o lider pode excluir o ministerio.' };
    await this.ministerioRepository.deletar(ministerioId);
  }
}

module.exports = DeletarMinisterioUseCase;
