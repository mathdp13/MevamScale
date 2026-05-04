class BuscarUsuarioUseCase {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute(id) {
    const usuario = await this.usuarioRepository.buscarPorId(id);
    if (!usuario) throw { status: 404, message: 'Usuário não encontrado' };
    return usuario.toPublic();
  }
}

module.exports = BuscarUsuarioUseCase;
