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

    const tipoMap = new Map(tipos.map((t) => [t.id, t]));

    const criadas = [];
    for (const tipo of comRecorrencia) {
      const datas = datasDoMes(m, a, tipo.dia_semana);
      for (const data of datas) {
        const existe = await this.escalaRepository.escalaExiste({ ministerioId, dataEvento: data, tipoCultoId: tipo.id });
        if (existe) continue;

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

    const lineupCompleto = await this.escalaRepository.buscarLineupCompleto(ministerioId);
    let populadas = 0;

    if (lineupCompleto.length > 0) {
      const ausencias = await this.escalaRepository.listarAusencias({ ministerioId, mes: m, ano: a });
      const todas = await this.escalaRepository.listarEscalas({ ministerioId, mes: m, ano: a });
      const semMembros = todas.filter((e) => e.total_membros === 0);

      for (const escala of semMembros) {
        const dataEscala = new Date(escala.data_evento).toISOString().split('T')[0];
        const ausentes = new Set(
          ausencias
            .filter((au) => new Date(au.data).toISOString().split('T')[0] === dataEscala)
            .map((au) => au.usuario_id)
        );

        const tipo = tipoMap.get(escala.tipo_culto_id);
        const formacao = (tipo?.formacao || []).filter((f) => f.funcao_id);
        let adicionados = 0;

        if (formacao.length > 0) {
          const jaAdicionados = new Set();
          for (const item of formacao) {
            const candidatos = lineupCompleto.filter(
              (lm) => lm.funcao_id === item.funcao_id && !ausentes.has(lm.usuario_id) && !jaAdicionados.has(lm.usuario_id)
            );
            const selecionados = candidatos.slice(0, item.quantidade);
            await Promise.all(
              selecionados.map((lm) => {
                jaAdicionados.add(lm.usuario_id);
                return this.escalaRepository.adicionarMembro({ escalaId: escala.id, usuarioId: lm.usuario_id, funcaoId: lm.funcao_id }).catch(() => {});
              })
            );
            adicionados += selecionados.length;
          }
        } // sem formacao: escala fica vazia para o admin preencher manualmente

        if (adicionados > 0) populadas++;
      }
    }

    return { criadas: criadas.length, populadas };
  }
}

module.exports = GerarEscalasMesUseCase;
