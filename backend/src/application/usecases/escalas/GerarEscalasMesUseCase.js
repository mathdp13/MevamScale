const DIAS = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

function datasDoMes(mes, ano, diaSemana) {
  const datas = [];
  const ultimo = new Date(ano, mes, 0).getDate();
  for (let d = 1; d <= ultimo; d++) {
    const data = new Date(ano, mes - 1, d);
    if (data.getDay() === diaSemana) {
      datas.push(data.toISOString().split('T')[0]);
    }
  }
  return datas;
}

class GerarEscalasMesUseCase {
  constructor(escalaRepository) {
    this.escalaRepository = escalaRepository;
  }

  async execute({ ministerioId, mes, ano }) {
    const agora = new Date();
    const m = Number(mes) || agora.getMonth() + 1;
    const a = Number(ano) || agora.getFullYear();

    const tipos = await this.escalaRepository.listarTiposCulto(ministerioId);
    const comRecorrencia = tipos.filter((t) => t.dia_semana !== null && t.dia_semana !== undefined);

    if (comRecorrencia.length === 0) throw { status: 400, message: 'Nenhum tipo de culto com recorrencia configurada.' };

    const criadas = [];
    for (const tipo of comRecorrencia) {
      const datas = datasDoMes(m, a, tipo.dia_semana);
      for (const data of datas) {
        const existe = await this.escalaRepository.escalaExiste({ ministerioId, dataEvento: data, tipoCultoId: tipo.id });
        if (existe) continue;

        const mesStr = String(m).padStart(2, '0');
        const [anoD, mesD, diaD] = data.split('-');
        const nome = `${tipo.nome} - ${diaD}/${mesD}/${anoD}`;
        const escala = await this.escalaRepository.criarEscala({
          ministerioId,
          tipoCultoId: tipo.id,
          nome,
          dataEvento: data,
          dataEnsaio: null,
        });
        criadas.push(escala);
      }
    }
    return criadas;
  }
}

module.exports = GerarEscalasMesUseCase;
