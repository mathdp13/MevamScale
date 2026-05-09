class Usuario {
  constructor({ id, nome, email, senha, permissao, onboarding_done, google_id, foto_url, telefone, data_nascimento, superadmin, pode_slides }) {
    this.id = id;
    this.nome = nome;
    this.email = email;
    this.senha = senha;
    this.permissao = permissao;
    this.onboardingDone = onboarding_done;
    this.googleId = google_id;
    this.fotoUrl = foto_url;
    this.telefone = telefone;
    this.dataNascimento = data_nascimento;
    this.superadmin = superadmin || false;
    this.podeSlides = pode_slides || false;
  }

  toPublic() {
    return {
      id: this.id,
      nome: this.nome,
      email: this.email,
      permissao: this.permissao,
      onboarding_done: this.onboardingDone,
      foto_url: this.fotoUrl,
      telefone: this.telefone,
      data_nascimento: this.dataNascimento,
    };
  }

  toAuthResponse() {
    return {
      id: this.id,
      nome: this.nome,
      permissao: this.permissao,
      onboardingDone: this.onboardingDone,
      superadmin: this.superadmin,
      pode_slides: this.podeSlides,
    };
  }
}

module.exports = Usuario;
