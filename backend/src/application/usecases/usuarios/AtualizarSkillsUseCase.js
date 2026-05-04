class AtualizarSkillsUseCase {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async execute({ usuario_id, funcoes }) {
    await this.usuarioRepository.atualizarSkills(usuario_id, funcoes);
    return { message: 'Perfil e habilidades atualizados!' };
  }
}

module.exports = AtualizarSkillsUseCase;
