class LoginUseCase {
  constructor(usuarioRepository, hashService, tokenService) {
    this.usuarioRepository = usuarioRepository;
    this.hashService = hashService;
    this.tokenService = tokenService;
  }

  async execute({ email, senha }) {
    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario) throw { status: 401, message: 'Usuário não encontrado!' };

    const senhaValida = await this.hashService.comparar(senha, usuario.senha);
    if (!senhaValida) throw { status: 401, message: 'Senha incorreta!' };

    const token = this.tokenService.gerar({ id: usuario.id, permissao: usuario.permissao });
    return { token, user: usuario.toAuthResponse() };
  }
}

module.exports = LoginUseCase;
