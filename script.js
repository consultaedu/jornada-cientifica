document.addEventListener("DOMContentLoaded", () => {
  carregarInformacoesEvento();
  carregarProgramacao();
  carregarPalestrantes();
  carregarSalasPorDia();
  configurarMenu();
  configurarLinks();
  atualizarAnoRodape();
  iniciarContagemRegressiva();
  iniciarModoEvento();
});

function carregarInformacoesEvento() {
  definirTexto("eventoEdicao", CONFIG_EVENTO.edicao);
  definirTexto("eventoTema", CONFIG_EVENTO.tema);
  definirTexto("eventoSubtitulo", CONFIG_EVENTO.subtitulo);
  definirTexto("eventoData", CONFIG_EVENTO.periodo);
}

function carregarProgramacao() {
  const lista = document.getElementById("listaProgramacao");

  if (!lista) {
    return;
  }

  lista.innerHTML = CONFIG_EVENTO.programacao
    .map((item) => {
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
    })
    .join("");
}

function carregarPalestrantes() {
  const lista = document.getElementById("listaPalestrantes");

  if (!lista) {
    return;
  }

  lista.innerHTML = CONFIG_EVENTO.palestrantes
    .map((palestrante) => {
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
    })
    .join("");
}

function carregarSalasPorDia() {
  const seletor = document.getElementById("seletorDiasSalas");
  const lista = document.getElementById("listaSalas");

  if (!seletor || !lista) {
    return;
  }

  const dias = CONFIG_EVENTO.diasSalas;

  if (!Array.isArray(dias) || dias.length === 0) {
    lista.innerHTML = `
      <div class="salas-vazio">
        Nenhuma sala foi cadastrada.
      </div>
    `;

    return;
  }

  seletor.innerHTML = dias
    .map((dia, indice) => {
      return `
        <button
          type="button"
          class="botao-dia-sala ${indice === 0 ? "ativo" : ""}"
          data-dia="${escaparAtributo(dia.id)}"
          role="tab"
          aria-selected="${indice === 0 ? "true" : "false"}"
        >
          <strong>
            ${escaparHTML(dia.dataCurta)}
          </strong>

          <span>
            ${escaparHTML(dia.descricao)}
          </span>
        </button>
      `;
    })
    .join("");

  seletor
    .querySelectorAll(".botao-dia-sala")
    .forEach((botao) => {
      botao.addEventListener("click", () => {
        selecionarDiaSalas(botao.dataset.dia);
      });
    });

  const diaInicial = encontrarDiaAtual(dias) || dias[0];

  selecionarDiaSalas(diaInicial.id);
}

function selecionarDiaSalas(idDia) {
  const dias = CONFIG_EVENTO.diasSalas;

  const diaSelecionado = dias.find((dia) => dia.id === idDia);

  if (!diaSelecionado) {
    return;
  }

  document
    .querySelectorAll(".botao-dia-sala")
    .forEach((botao) => {
      const ativo = botao.dataset.dia === idDia;

      botao.classList.toggle("ativo", ativo);

      botao.setAttribute(
        "aria-selected",
        String(ativo)
      );
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
  const lista = document.getElementById("listaSalas");

  if (!lista) {
    return;
  }

  if (!Array.isArray(dia.areas) || dia.areas.length === 0) {
    lista.innerHTML = `
      <div class="salas-vazio">
        Nenhuma sala cadastrada para este dia.
      </div>
    `;

    return;
  }

  lista.innerHTML = dia.areas
    .map((area) => {
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
    })
    .join("");
}

function criarCardSala(sala) {
  const linkValido =
    sala.link &&
    sala.link !== "#" &&
    sala.link.trim() !== "";

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
  const hoje = new Date();

  const diaHoje = hoje.getDate();
  const mesHoje = hoje.getMonth();

  if (mesHoje !== 10) {
    return null;
  }

  return dias.find((dia) => {
    const numeroData = Number.parseInt(dia.data, 10);

    return numeroData === diaHoje;
  });
}

function configurarLinks() {
  configurarLink(
    "botaoYoutube",
    CONFIG_EVENTO.links.youtube
  );

  configurarLink(
    "botaoOjs",
    CONFIG_EVENTO.links.ojs
  );

  configurarLink(
    "botaoNormas",
    CONFIG_EVENTO.links.normas
  );
}

function configurarMenu() {
  const botaoMenu = document.getElementById("botaoMenu");
  const menu = document.getElementById("menuPrincipal");

  if (!botaoMenu || !menu) {
    return;
  }

  botaoMenu.addEventListener("click", () => {
    const menuAberto = menu.classList.toggle("menu-aberto");

    botaoMenu.setAttribute(
      "aria-expanded",
      String(menuAberto)
    );
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("menu-aberto");

      botaoMenu.setAttribute(
        "aria-expanded",
        "false"
      );
    });
  });
}

function atualizarAnoRodape() {
  const elementoAno = document.getElementById("anoAtual");

  if (elementoAno) {
    elementoAno.textContent = new Date().getFullYear();
  }
}

function configurarLink(id, endereco) {
  const elemento = document.getElementById(id);

  if (!elemento) {
    return;
  }

  elemento.href = endereco || "#";
}

function definirTexto(id, texto) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = texto;
  }
}

function obterIniciais(nome) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("")
    .toUpperCase();
}

function iniciarContagemRegressiva() {
  const configuracaoDatas = CONFIG_EVENTO.datasEvento;

  if (!configuracaoDatas) {
    ocultarContagemEvento();
    return;
  }

  const inicio = new Date(configuracaoDatas.inicio);
  const fim = new Date(configuracaoDatas.fim);

  if (
    Number.isNaN(inicio.getTime()) ||
    Number.isNaN(fim.getTime())
  ) {
    console.error(
      "As datas do evento no config.js são inválidas."
    );

    ocultarContagemEvento();
    return;
  }

  function atualizarContagem() {
    const agora = new Date();

    if (agora < inicio) {
      mostrarContagemAntesDoEvento(inicio, agora);
      return;
    }

    if (agora <= fim) {
      mostrarStatusEvento(
        "Evento em andamento",
        "ao-vivo"
      );
      return;
    }

    mostrarStatusEvento(
      "Evento encerrado",
      "encerrado"
    );
  }

  atualizarContagem();

  window.setInterval(atualizarContagem, 1000);
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

  definirTexto(
    "contadorDias",
    formatarNumeroContagem(dias)
  );

  definirTexto(
    "contadorHoras",
    formatarNumeroContagem(horas)
  );

  definirTexto(
    "contadorMinutos",
    formatarNumeroContagem(minutos)
  );

  definirTexto(
    "contadorSegundos",
    formatarNumeroContagem(segundos)
  );

  const grade = document.getElementById("contagemGrid");
  const status = document.getElementById("statusEvento");
  const etiqueta = document.getElementById("contagemEtiqueta");
  const container = document.getElementById("contagemEvento");

  if (grade) {
    grade.hidden = false;
  }

  if (status) {
    status.hidden = true;
  }

  if (etiqueta) {
    etiqueta.hidden = false;
    etiqueta.textContent = "Faltam";
  }

  if (container) {
    container.classList.remove(
      "evento-ao-vivo",
      "evento-encerrado"
    );
  }
}

function mostrarStatusEvento(texto, tipo) {
  const grade = document.getElementById("contagemGrid");
  const status = document.getElementById("statusEvento");
  const etiqueta = document.getElementById("contagemEtiqueta");
  const statusTexto = document.getElementById(
    "statusEventoTexto"
  );
  const container = document.getElementById("contagemEvento");

  if (grade) {
    grade.hidden = true;
  }

  if (etiqueta) {
    etiqueta.hidden = true;
  }

  if (status) {
    status.hidden = false;
  }

  if (statusTexto) {
    statusTexto.textContent = texto;
  }

  if (container) {
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

function formatarNumeroContagem(numero) {
  return String(Math.max(0, numero)).padStart(2, "0");
}

function ocultarContagemEvento() {
  const contagem = document.getElementById("contagemEvento");

  if (contagem) {
    contagem.hidden = true;
  }
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

function iniciarContagemRegressiva() {
  const datas = CONFIG_EVENTO.datasEvento;

  if (!datas?.inicio || !datas?.fim) {
    console.error("datasEvento não foi configurado no config.js.");
    return;
  }

  const inicio = new Date(datas.inicio);
  const fim = new Date(datas.fim);

  if (
    Number.isNaN(inicio.getTime()) ||
    Number.isNaN(fim.getTime())
  ) {
    console.error("As datas da Jornada são inválidas.");
    return;
  }

  const atualizar = () => {
    const agora = new Date();

    if (agora < inicio) {
      const diferenca = inicio.getTime() - agora.getTime();

      const dias = Math.floor(
        diferenca / (1000 * 60 * 60 * 24)
      );

      const horas = Math.floor(
        (diferenca / (1000 * 60 * 60)) % 24
      );

      const minutos = Math.floor(
        (diferenca / (1000 * 60)) % 60
      );

      const segundos = Math.floor(
        (diferenca / 1000) % 60
      );

      atualizarContador("contadorDias", dias);
      atualizarContador("contadorHoras", horas);
      atualizarContador("contadorMinutos", minutos);
      atualizarContador("contadorSegundos", segundos);

      alternarExibicaoContagem(true);
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
  };

  atualizar();
  window.setInterval(atualizar, 1000);
}

function atualizarContador(id, valor) {
  const elemento = document.getElementById(id);

  if (elemento) {
    elemento.textContent = String(valor).padStart(2, "0");
  }
}

function alternarExibicaoContagem(mostrarContagem) {
  const grade = document.getElementById("contagemGrid");
  const status = document.getElementById("statusEvento");
  const etiqueta = document.getElementById("contagemEtiqueta");
  const container = document.getElementById("contagemEvento");

  if (grade) {
    grade.hidden = !mostrarContagem;
  }

  if (status) {
    status.hidden = mostrarContagem;
  }

  if (etiqueta) {
    etiqueta.textContent = "Contagem regressiva";
  }

  if (container) {
    container.classList.remove(
      "evento-ao-vivo",
      "evento-encerrado"
    );
  }
}

function mostrarStatusDaJornada(texto, tipo) {
  const grade = document.getElementById("contagemGrid");
  const status = document.getElementById("statusEvento");
  const textoStatus = document.getElementById(
    "statusEventoTexto"
  );
  const etiqueta = document.getElementById("contagemEtiqueta");
  const container = document.getElementById("contagemEvento");

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
    etiqueta.textContent =
      tipo === "ao-vivo"
        ? "Acompanhe a programação"
        : "Jornada Científica";
  }

  if (container) {
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

function iniciarModoEvento() {
  const programacao = CONFIG_EVENTO.programacao;

  if (!Array.isArray(programacao)) {
    return;
  }

  function atualizarModoEvento() {
    const agora = new Date();

    const dataHoje = obterDataLocalISO(agora);

    const eventoHoje = programacao.find(
      (item) => item.dataISO === dataHoje
    );

    if (!eventoHoje) {
      ocultarPainelEventoAgora();
      return;
    }

    const horarios = eventoHoje.horarios;

    if (!horarios) {
      ocultarPainelEventoAgora();
      return;
    }

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
      mostrarPainelEvento({
        tipo: "aguardando",
        etiqueta: "Programação de hoje",
        titulo: `Hoje: ${eventoHoje.palestra}`,
        descricao:
          `A transmissão começa às ${horarios.inicioPalestra}.`,
        botaoTexto: "Ver programação",
        botaoLink: "#programacao"
      });

      return;
    }

    if (agora >= inicioPalestra && agora < fimPalestra) {
      mostrarPainelEvento({
        tipo: "ao-vivo",
        etiqueta: "Ao vivo agora",
        titulo: eventoHoje.palestra,
        descricao:
          "Acompanhe a palestra principal pelo YouTube.",
        botaoTexto: "Assistir no YouTube",
        botaoLink: eventoHoje.youtube,
        novaAba: true
      });

      return;
    }

    if (agora >= fimPalestra && agora < inicioSalas) {
      mostrarPainelEvento({
        tipo: "intervalo",
        etiqueta: "Intervalo",
        titulo: "As apresentações começam em breve",
        descricao:
          `As salas serão abertas às ${horarios.inicioSalas}.`,
        botaoTexto: "Ver salas",
        botaoLink: "#salas"
      });

      return;
    }

    if (agora >= inicioSalas && agora <= fimDia) {
      mostrarPainelEvento({
        tipo: "salas",
        etiqueta: "Salas abertas",
        titulo: "Apresentação dos trabalhos",
        descricao:
          "Escolha a área do conhecimento e entre na sala correta.",
        botaoTexto: "Acessar salas",
        botaoLink: "#salas"
      });

      return;
    }

    mostrarPainelEvento({
      tipo: "encerrado",
      etiqueta: "Atividades encerradas",
      titulo: "Obrigado pela participação",
      descricao:
        dataHoje === "2026-11-13"
          ? "A 6ª Jornada Científica chegou ao fim."
          : "Confira a programação do próximo dia.",
      botaoTexto: "Ver programação",
      botaoLink: "#programacao"
    });
  }

  atualizarModoEvento();

  window.setInterval(
    atualizarModoEvento,
    30000
  );
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
  const painel = document.getElementById(
    "painelEventoAgora"
  );

  const elementoEtiqueta = document.getElementById(
    "painelEventoEtiqueta"
  );

  const elementoTitulo = document.getElementById(
    "painelEventoTitulo"
  );

  const elementoDescricao = document.getElementById(
    "painelEventoDescricao"
  );

  const botao = document.getElementById(
    "painelEventoBotao"
  );

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

  if (botao) {
    botao.textContent = botaoTexto;
    botao.href = botaoLink || "#";

    if (novaAba) {
      botao.target = "_blank";
      botao.rel = "noopener noreferrer";
    } else {
      botao.removeAttribute("target");
      botao.removeAttribute("rel");
    }
  }
}

function ocultarPainelEventoAgora() {
  const painel = document.getElementById(
    "painelEventoAgora"
  );

  if (painel) {
    painel.hidden = true;
  }
}

function criarDataHorario(dataISO, horario) {
  return new Date(`${dataISO}T${horario}:00-03:00`);
}

function obterDataLocalISO(data) {
  const ano = data.getFullYear();

  const mes = String(
    data.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    data.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}