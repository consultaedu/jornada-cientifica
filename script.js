"use strict";

/* ==================================================
   CONFIGURAÇÕES INTERNAS
================================================== */

const FUSO_EVENTO = "America/Sao_Paulo";
const INTERVALO_RELOGIO = 1000;

let intervaloRelogioSite = null;

/* ==================================================
   INICIALIZAÇÃO
================================================== */

document.addEventListener("DOMContentLoaded", () => {
  carregarInformacoesEvento();
  carregarProgramacao();
  carregarPalestrantes();
  carregarSalasPorDia();

  configurarMenu();
  configurarLinks();
  atualizarAnoRodape();

  iniciarRelogioSite();
});

/* ==================================================
   INFORMAÇÕES PRINCIPAIS
================================================== */

function carregarInformacoesEvento() {
  definirTexto("eventoEdicao", CONFIG_EVENTO.edicao);
  definirTexto("eventoTema", CONFIG_EVENTO.tema);
  definirTexto("eventoSubtitulo", CONFIG_EVENTO.subtitulo);
  definirTexto("eventoData", CONFIG_EVENTO.periodo);
}

/* ==================================================
   PROGRAMAÇÃO
================================================== */

function carregarProgramacao() {
  const lista = obterElemento("listaProgramacao");
  const programacao = CONFIG_EVENTO.programacao;

  if (!lista) {
    return;
  }

  if (
    !Array.isArray(programacao) ||
    programacao.length === 0
  ) {
    lista.innerHTML = `
      <div class="salas-vazio">
        A programação será divulgada em breve.
      </div>
    `;

    return;
  }

  lista.innerHTML = programacao
    .map((item) => criarCardProgramacao(item))
    .join("");
}

function criarCardProgramacao(item) {
  return `
    <article class="programacao-card">
      <span class="programacao-data">
        ${escaparHTML(item.data)}
      </span>

      <div class="programacao-item">
        <span>
          ${escaparHTML(item.horarioPalestra)}
        </span>

        <h3>
          ${escaparHTML(item.palestra)}
        </h3>

        <p>
          Transmissão ao vivo pelo YouTube
        </p>
      </div>

      <div class="programacao-item">
        <span>
          ${escaparHTML(item.horarioSalas)}
        </span>

        <h3>
          Apresentação de trabalhos
        </h3>

        <p>
          Salas divididas por áreas no Google Meet
        </p>
      </div>
    </article>
  `;
}

/* ==================================================
   PALESTRANTES
================================================== */

function carregarPalestrantes() {
  const lista = obterElemento("listaPalestrantes");
  const palestrantes = CONFIG_EVENTO.palestrantes;

  if (!lista) {
    return;
  }

  if (
    !Array.isArray(palestrantes) ||
    palestrantes.length === 0
  ) {
    lista.innerHTML = `
      <div class="salas-vazio">
        Os palestrantes serão divulgados em breve.
      </div>
    `;

    return;
  }

  lista.innerHTML = palestrantes
    .map((palestrante) => criarCardPalestrante(palestrante))
    .join("");
}

function criarCardPalestrante(palestrante) {
  const nome = escaparHTML(palestrante.nome);
  const descricao = escaparHTML(palestrante.descricao);
  const data = escaparHTML(palestrante.data);

  const imagem = palestrante.foto
    ? `
      <img
        src="${escaparAtributo(palestrante.foto)}"
        alt="Foto de ${nome}"
        loading="lazy"
      >
    `
    : `
      <div class="palestrante-sem-foto">
        ${obterIniciais(palestrante.nome)}
      </div>
    `;

  return `
    <article class="palestrante-card">
      <div class="palestrante-foto">
        ${imagem}
      </div>

      <div class="palestrante-informacoes">
        <span>${data}</span>

        <h3>${nome}</h3>

        <p>${descricao}</p>
      </div>
    </article>
  `;
}

/* ==================================================
   SALAS POR DIA
================================================== */

function carregarSalasPorDia() {
  const seletor = obterElemento("seletorDiasSalas");
  const lista = obterElemento("listaSalas");
  const dias = CONFIG_EVENTO.diasSalas;

  if (!seletor || !lista) {
    return;
  }

  if (!Array.isArray(dias) || dias.length === 0) {
    lista.innerHTML = `
      <div class="salas-vazio">
        Nenhuma sala foi cadastrada.
      </div>
    `;

    return;
  }

  seletor.innerHTML = dias
    .map((dia, indice) => criarBotaoDia(dia, indice))
    .join("");

  seletor
    .querySelectorAll(".botao-dia-sala")
    .forEach((botao) => {
      botao.addEventListener("click", () => {
        selecionarDiaSalas(botao.dataset.dia);
      });
    });

  const diaAtual = encontrarDiaAtual(dias);
  const diaInicial = diaAtual || dias[0];

  selecionarDiaSalas(diaInicial.id);
}

function criarBotaoDia(dia, indice) {
  const ativo = indice === 0;

  return `
    <button
      type="button"
      class="botao-dia-sala ${ativo ? "ativo" : ""}"
      data-dia="${escaparAtributo(dia.id)}"
      role="tab"
      aria-selected="${ativo}"
    >
      <strong>
        ${escaparHTML(dia.dataCurta)}
      </strong>

      <span>
        ${escaparHTML(dia.descricao)}
      </span>
    </button>
  `;
}

function selecionarDiaSalas(idDia) {
  const dias = CONFIG_EVENTO.diasSalas;

  if (!Array.isArray(dias)) {
    return;
  }

  const diaSelecionado = dias.find(
    (dia) => dia.id === idDia
  );

  if (!diaSelecionado) {
    return;
  }

  document
    .querySelectorAll(".botao-dia-sala")
    .forEach((botao) => {
      const ativo = botao.dataset.dia === idDia;

      botao.classList.toggle("ativo", ativo);
      botao.setAttribute("aria-selected", String(ativo));
    });

  definirTexto(
    "tituloDiaSalas",
    `${diaSelecionado.data} — ${diaSelecionado.descricao}`
  );

  definirTexto(
    "horarioDiaSalas",
    diaSelecionado.horario
  );

  renderizarAreasSalas(diaSelecionado);
}

function renderizarAreasSalas(dia) {
  const lista = obterElemento("listaSalas");

  if (!lista) {
    return;
  }

  if (
    !Array.isArray(dia.areas) ||
    dia.areas.length === 0
  ) {
    lista.innerHTML = `
      <div class="salas-vazio">
        Nenhuma sala cadastrada para este dia.
      </div>
    `;

    return;
  }

  lista.innerHTML = dia.areas
    .map((area) => criarGrupoArea(area))
    .join("");
}

function criarGrupoArea(area) {
  const salas = Array.isArray(area.salas)
    ? area.salas
    : [];

  const quantidade = salas.length;

  const textoQuantidade =
    quantidade === 1
      ? "1 sala disponível"
      : `${quantidade} salas disponíveis`;

  const cardsSalas = salas
    .map((sala) => criarCardSala(sala))
    .join("");

  return `
    <section class="grupo-area">
      <div class="grupo-area-cabecalho">
        <div>
          <span>Área do conhecimento</span>

          <h4>
            ${escaparHTML(area.nome)}
          </h4>
        </div>

        <span class="quantidade-salas">
          ${textoQuantidade}
        </span>
      </div>

      <div class="salas-area-grid">
        ${cardsSalas}
      </div>
    </section>
  `;
}

function criarCardSala(sala) {
  const linkValido = verificarLinkValido(sala.link);

  const complemento = sala.complemento
    ? `
      <span class="sala-complemento">
        ${escaparHTML(sala.complemento)}
      </span>
    `
    : "";

  const botaoSala = linkValido
    ? `
      <a
        href="${escaparAtributo(sala.link)}"
        class="botao botao-principal botao-entrar-sala"
        target="_blank"
        rel="noopener noreferrer"
      >
        Entrar no Google Meet
      </a>
    `
    : `
      <span class="botao botao-sala-indisponivel">
        Link disponível em breve
      </span>
    `;

  return `
    <article class="sala-card-novo">
      <div class="sala-card-topo">
        <span class="icone-meet" aria-hidden="true">
          M
        </span>

        <span class="sala-status">
          Google Meet
        </span>
      </div>

      <div class="sala-card-conteudo">
        <span class="sala-numero">
          ${escaparHTML(sala.numero)}
        </span>

        ${complemento}

        <div class="sala-mediador">
          <span>Mediador</span>

          <strong>
            ${escaparHTML(sala.mediador)}
          </strong>
        </div>
      </div>

      ${botaoSala}
    </article>
  `;
}

function encontrarDiaAtual(dias) {
  const programacao = CONFIG_EVENTO.programacao;

  if (
    !Array.isArray(programacao) ||
    !Array.isArray(dias)
  ) {
    return null;
  }

  const dataHoje = obterDataEventoISO(new Date());

  const indiceDia = programacao.findIndex(
    (item) => item.dataISO === dataHoje
  );

  if (indiceDia < 0) {
    return null;
  }

  return dias[indiceDia] || null;
}

/* ==================================================
   MENU
================================================== */

function configurarMenu() {
  const botaoMenu = obterElemento("botaoMenu");
  const menu = obterElemento("menuPrincipal");

  if (!botaoMenu || !menu) {
    return;
  }

  botaoMenu.addEventListener("click", () => {
    const menuAberto = menu.classList.toggle("menu-aberto");

    botaoMenu.setAttribute(
      "aria-expanded",
      String(menuAberto)
    );

    botaoMenu.setAttribute(
      "aria-label",
      menuAberto ? "Fechar menu" : "Abrir menu"
    );
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      fecharMenu(menu, botaoMenu);
    });
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
      fecharMenu(menu, botaoMenu);
    }
  });
}

function fecharMenu(menu, botaoMenu) {
  menu.classList.remove("menu-aberto");

  botaoMenu.setAttribute(
    "aria-expanded",
    "false"
  );

  botaoMenu.setAttribute(
    "aria-label",
    "Abrir menu"
  );
}

/* ==================================================
   LINKS
================================================== */

function configurarLinks() {
  const links = CONFIG_EVENTO.links || {};

  configurarLink("botaoYoutube", links.youtube);
  configurarLink("botaoOjs", links.ojs);
  configurarLink("botaoNormas", links.normas);

  configurarLink(
    "botaoModeloResumoWord",
    links.modeloResumoWord
  );

  configurarLink(
    "botaoModeloSlide",
    links.modeloSlide
  );

  configurarLink(
    "botaoModeloEPoster",
    links.modeloEPoster
  );
}

function configurarLink(id, endereco) {
  const elemento = obterElemento(id);

  if (!elemento) {
    return;
  }

  if (!verificarLinkValido(endereco)) {
    elemento.href = "#";
    elemento.setAttribute("aria-disabled", "true");
    return;
  }

  elemento.href = endereco;
  elemento.removeAttribute("aria-disabled");
}

function verificarLinkValido(endereco) {
  return Boolean(
    typeof endereco === "string" &&
    endereco.trim() !== "" &&
    endereco.trim() !== "#" &&
    !endereco.includes("SEU-LINK")
  );
}

/* ==================================================
   RELÓGIO CENTRAL DO SITE
================================================== */

function iniciarRelogioSite() {
  pararRelogioSite();
  atualizarRecursosTemporais();

  intervaloRelogioSite = window.setInterval(
    atualizarRecursosTemporais,
    INTERVALO_RELOGIO
  );
}

function pararRelogioSite() {
  if (intervaloRelogioSite !== null) {
    window.clearInterval(intervaloRelogioSite);
    intervaloRelogioSite = null;
  }
}

function atualizarRecursosTemporais() {
  const agora = new Date();

  atualizarContagemRegressiva(agora);
  atualizarModoEvento(agora);
}

/* ==================================================
   CONTAGEM REGRESSIVA
================================================== */

function atualizarContagemRegressiva(agora) {
  const datas = CONFIG_EVENTO.datasEvento;

  if (!datas?.inicio || !datas?.fim) {
    ocultarContagemEvento();
    return;
  }

  const inicio = new Date(datas.inicio);
  const fim = new Date(datas.fim);

  if (
    Number.isNaN(inicio.getTime()) ||
    Number.isNaN(fim.getTime())
  ) {
    console.error(
      "As datas do evento configuradas no config.js são inválidas."
    );

    ocultarContagemEvento();
    return;
  }

  if (agora < inicio) {
    mostrarContagemAntesDoEvento(inicio, agora);
    return;
  }

  if (agora <= fim) {
    mostrarStatusDaJornada(
      "Jornada acontecendo agora",
      "ao-vivo"
    );

    return;
  }

  mostrarStatusDaJornada(
    "Esta edição foi encerrada",
    "encerrado"
  );
}

function mostrarContagemAntesDoEvento(inicio, agora) {
  const diferenca = inicio.getTime() - agora.getTime();

  const segundo = 1000;
  const minuto = segundo * 60;
  const hora = minuto * 60;
  const dia = hora * 24;

  const dias = Math.floor(diferenca / dia);

  const horas = Math.floor(
    (diferenca % dia) / hora
  );

  const minutos = Math.floor(
    (diferenca % hora) / minuto
  );

  const segundos = Math.floor(
    (diferenca % minuto) / segundo
  );

  atualizarContador("contadorDias", dias);
  atualizarContador("contadorHoras", horas);
  atualizarContador("contadorMinutos", minutos);
  atualizarContador("contadorSegundos", segundos);

  alternarExibicaoContagem(true);
}

function atualizarContador(id, valor) {
  definirTexto(
    id,
    formatarNumeroContagem(valor)
  );
}

function alternarExibicaoContagem(mostrarContagem) {
  const grade = obterElemento("contagemGrid");
  const status = obterElemento("statusEvento");
  const etiqueta = obterElemento("contagemEtiqueta");
  const container = obterElemento("contagemEvento");

  if (grade) {
    grade.hidden = !mostrarContagem;
  }

  if (status) {
    status.hidden = mostrarContagem;
  }

  if (etiqueta) {
    etiqueta.hidden = false;
    etiqueta.textContent = "Contagem regressiva";
  }

  if (container) {
    container.hidden = false;

    container.classList.remove(
      "evento-ao-vivo",
      "evento-encerrado"
    );
  }
}

function mostrarStatusDaJornada(texto, tipo) {
  const grade = obterElemento("contagemGrid");
  const status = obterElemento("statusEvento");
  const textoStatus = obterElemento("statusEventoTexto");
  const etiqueta = obterElemento("contagemEtiqueta");
  const container = obterElemento("contagemEvento");

  if (grade) {
    grade.hidden = true;
  }

  if (status) {
    status.hidden = false;
  }

  if (textoStatus) {
    textoStatus.textContent = texto;
  }

  if (etiqueta) {
    etiqueta.hidden = false;

    etiqueta.textContent =
      tipo === "ao-vivo"
        ? "Acompanhe a programação"
        : "Jornada Científica";
  }

  if (container) {
    container.hidden = false;

    container.classList.toggle(
      "evento-ao-vivo",
      tipo === "ao-vivo"
    );

    container.classList.toggle(
      "evento-encerrado",
      tipo === "encerrado"
    );
  }
}

function ocultarContagemEvento() {
  const contagem = obterElemento("contagemEvento");

  if (contagem) {
    contagem.hidden = true;
  }
}

function formatarNumeroContagem(numero) {
  const valorSeguro = Math.max(0, Number(numero) || 0);

  return String(valorSeguro).padStart(2, "0");
}

/* ==================================================
   MODO EVENTO INTELIGENTE
================================================== */

function atualizarModoEvento(agora) {
  const programacao = CONFIG_EVENTO.programacao;

  if (
    !Array.isArray(programacao) ||
    programacao.length === 0
  ) {
    ocultarPainelEventoAgora();
    return;
  }

  const dataHoje = obterDataEventoISO(agora);

  const eventoHoje = programacao.find(
    (item) => item.dataISO === dataHoje
  );

  if (!eventoHoje?.horarios) {
    ocultarPainelEventoAgora();
    return;
  }

  const fase = calcularFaseEvento(
    agora,
    eventoHoje
  );

  renderizarFaseEvento(
    fase,
    eventoHoje,
    dataHoje
  );
}

function calcularFaseEvento(agora, eventoHoje) {
  const horarios = eventoHoje.horarios;

  const inicioPalestra = criarDataHorario(
    eventoHoje.dataISO,
    horarios.inicioPalestra
  );

  const fimPalestra = criarDataHorario(
    eventoHoje.dataISO,
    horarios.fimPalestra
  );

  const inicioSalas = criarDataHorario(
    eventoHoje.dataISO,
    horarios.inicioSalas
  );

  const fimDia = criarDataHorario(
    eventoHoje.dataISO,
    horarios.fimDia
  );

  if (agora < inicioPalestra) {
    return "aguardando";
  }

  if (agora < fimPalestra) {
    return "ao-vivo";
  }

  if (agora < inicioSalas) {
    return "intervalo";
  }

  if (agora <= fimDia) {
    return "salas";
  }

  return "encerrado";
}

function renderizarFaseEvento(
  fase,
  eventoHoje,
  dataHoje
) {
  const horarios = eventoHoje.horarios;

  const estados = {
    aguardando: {
      tipo: "aguardando",
      etiqueta: "Programação de hoje",
      titulo: `Hoje: ${eventoHoje.palestra}`,
      descricao:
        `A transmissão começa às ${horarios.inicioPalestra}.`,
      botaoTexto: "Ver programação",
      botaoLink: "#programacao"
    },

    "ao-vivo": {
      tipo: "ao-vivo",
      etiqueta: "Ao vivo agora",
      titulo: eventoHoje.palestra,
      descricao:
        "Acompanhe a palestra principal pelo YouTube.",
      botaoTexto: "Assistir no YouTube",
      botaoLink: eventoHoje.youtube,
      novaAba: true
    },

    intervalo: {
      tipo: "intervalo",
      etiqueta: "Intervalo",
      titulo: "As apresentações começam em breve",
      descricao:
        `As salas serão abertas às ${horarios.inicioSalas}.`,
      botaoTexto: "Ver salas",
      botaoLink: "#salas"
    },

    salas: {
      tipo: "salas",
      etiqueta: "Salas abertas",
      titulo: "Apresentação dos trabalhos",
      descricao:
        "Escolha a área do conhecimento e entre na sala correta.",
      botaoTexto: "Acessar salas",
      botaoLink: "#salas"
    },

    encerrado: {
      tipo: "encerrado",
      etiqueta: "Atividades encerradas",
      titulo: "Obrigado pela participação",
      descricao: verificarUltimoDia(dataHoje)
        ? `${CONFIG_EVENTO.edicao} chegou ao fim.`
        : "Confira a programação do próximo dia.",
      botaoTexto: "Ver programação",
      botaoLink: "#programacao"
    }
  };

  const estado = estados[fase];

  if (!estado) {
    ocultarPainelEventoAgora();
    return;
  }

  mostrarPainelEvento(estado);
}

function mostrarPainelEvento({
  tipo,
  etiqueta,
  titulo,
  descricao,
  botaoTexto,
  botaoLink,
  novaAba = false
}) {
  const painel = obterElemento("painelEventoAgora");
  const elementoEtiqueta = obterElemento(
    "painelEventoEtiqueta"
  );
  const elementoTitulo = obterElemento(
    "painelEventoTitulo"
  );
  const elementoDescricao = obterElemento(
    "painelEventoDescricao"
  );
  const botao = obterElemento("painelEventoBotao");

  if (!painel) {
    return;
  }

  painel.hidden = false;

  painel.classList.remove(
    "modo-aguardando",
    "modo-ao-vivo",
    "modo-intervalo",
    "modo-salas",
    "modo-encerrado"
  );

  painel.classList.add(`modo-${tipo}`);

  if (elementoEtiqueta) {
    elementoEtiqueta.textContent = etiqueta;
  }

  if (elementoTitulo) {
    elementoTitulo.textContent = titulo;
  }

  if (elementoDescricao) {
    elementoDescricao.textContent = descricao;
  }

  configurarBotaoPainel(
    botao,
    botaoTexto,
    botaoLink,
    novaAba
  );
}

function configurarBotaoPainel(
  botao,
  texto,
  endereco,
  novaAba
) {
  if (!botao) {
    return;
  }

  botao.textContent = texto;

  if (!verificarLinkValido(endereco)) {
    botao.href = "#";
    botao.setAttribute("aria-disabled", "true");
  } else {
    botao.href = endereco;
    botao.removeAttribute("aria-disabled");
  }

  if (novaAba && verificarLinkValido(endereco)) {
    botao.target = "_blank";
    botao.rel = "noopener noreferrer";
  } else {
    botao.removeAttribute("target");
    botao.removeAttribute("rel");
  }
}

function ocultarPainelEventoAgora() {
  const painel = obterElemento("painelEventoAgora");

  if (painel) {
    painel.hidden = true;
  }
}

function verificarUltimoDia(dataHoje) {
  const programacao = CONFIG_EVENTO.programacao;

  if (
    !Array.isArray(programacao) ||
    programacao.length === 0
  ) {
    return false;
  }

  const ultimoDia = programacao.at(-1);

  return ultimoDia?.dataISO === dataHoje;
}

/* ==================================================
   DATA E HORÁRIO
================================================== */

function criarDataHorario(dataISO, horario) {
  if (!dataISO || !horario) {
    return new Date(Number.NaN);
  }

  return new Date(
    `${dataISO}T${horario}:00-03:00`
  );
}

function obterDataEventoISO(data) {
  try {
    const partes = new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: FUSO_EVENTO,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).formatToParts(data);

    const valores = {};

    partes.forEach((parte) => {
      valores[parte.type] = parte.value;
    });

    return (
      `${valores.year}-` +
      `${valores.month}-` +
      `${valores.day}`
    );
  } catch (erro) {
    console.warn(
      "Não foi possível aplicar o fuso horário do evento.",
      erro
    );

    const ano = data.getFullYear();
    const mes = String(
      data.getMonth() + 1
    ).padStart(2, "0");
    const dia = String(
      data.getDate()
    ).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }
}

/* ==================================================
   RODAPÉ
================================================== */

function atualizarAnoRodape() {
  definirTexto(
    "anoAtual",
    new Date().getFullYear()
  );
}

/* ==================================================
   UTILITÁRIOS
================================================== */

function obterElemento(id) {
  return document.getElementById(id);
}

function definirTexto(id, texto) {
  const elemento = obterElemento(id);

  if (elemento) {
    elemento.textContent = texto ?? "";
  }
}

function obterIniciais(nome) {
  if (typeof nome !== "string") {
    return "";
  }

  return nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("")
    .toUpperCase();
}

function escaparHTML(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escaparAtributo(valor) {
  return escaparHTML(valor);
}