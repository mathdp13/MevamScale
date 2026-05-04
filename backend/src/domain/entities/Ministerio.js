class Ministerio {
  constructor({ id, nome, icone, categoria, codigo_acesso, lider_id, created_at }) {
    this.id = id;
    this.nome = nome;
    this.icone = icone;
    this.categoria = categoria;
    this.codigoAcesso = codigo_acesso;
    this.liderId = lider_id;
    this.createdAt = created_at;
  }
}

module.exports = Ministerio;
