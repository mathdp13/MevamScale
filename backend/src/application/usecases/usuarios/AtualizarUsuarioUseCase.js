class AtualizarUsuarioUseCase {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute(id, dados) {
    await this.usuarioRepository.atualizar(id, dados);
    return { message: 'Perfil atualizado!' };
  }
}

module.exports = AtualizarUsuarioUseCase;
