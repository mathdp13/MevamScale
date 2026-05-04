class CriarUsuarioUseCase {
  constructor(usuarioRepository, hashService) {
    this.usuarioRepository = usuarioRepository;
    this.hashService = hashService;
  }

  async execute({ nome, email, senha }) {
    const senhaCriptografada = await this.hashService.hash(senha);
    const usuario = await this.usuarioRepository.criar({ nome, email, senha: senhaCriptografada });
    return { id: usuario.id, nome: usuario.nome, email: usuario.email };
  }
}

module.exports = CriarUsuarioUseCase;
