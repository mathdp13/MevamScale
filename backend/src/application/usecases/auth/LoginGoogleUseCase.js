class LoginGoogleUseCase {
  constructor(usuarioRepository, googleAuthProvider, tokenService) {
    this.usuarioRepository = usuarioRepository;
    this.googleAuthProvider = googleAuthProvider;
    this.tokenService = tokenService;
  }

  async execute({ token }) {
    const { email, name, sub } = await this.googleAuthProvider.verificar(token);

    let usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario) {
      usuario = await this.usuarioRepository.criar({ nome: name, email, google_id: sub });
    }

    const tokenSistema = this.tokenService.gerar({ id: usuario.id, permissao: usuario.permissao });
    return { token: tokenSistema, user: usuario.toAuthResponse() };
  }
}

module.exports = LoginGoogleUseCase;
