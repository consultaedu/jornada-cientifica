document.addEventListener("DOMContentLoaded", () => {
  carregarInformacoesEvento();
  carregarProgramacao();
  carregarPalestrantes();
  carregarSalas();
  configurarMenu();
  configurarLinks();
  atualizarAnoRodape();
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
            ${item.data}
          </span>

          <div class="programacao-item">
            <span>${item.horarioPalestra}</span>

            <h3>${item.palestra}</h3>

            <p>Transmissão ao vivo pelo YouTube</p>
          </div>

          <div class="programacao-item">
            <span>${item.horarioSalas}</span>

            <h3>Apresentação de trabalhos</h3>

            <p>Salas divididas por áreas no Google Meet</p>
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
      const imagem = palestrante.foto
        ? `
          <img
            src="${palestrante.foto}"
            alt="Foto de ${palestrante.nome}"
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
            <span>${palestrante.data}</span>

            <h3>${palestrante.nome}</h3>

            <p>${palestrante.descricao}</p>
          </div>

        </article>
      `;
    })
    .join("");
}

function carregarSalas() {
  const lista = document.getElementById("listaSalas");

  if (!lista) {
    return;
  }

  lista.innerHTML = CONFIG_EVENTO.salas
    .map((sala) => {
      return `
        <article class="sala-card">

          <span class="sala-horario">
            A partir das ${sala.horario}
          </span>

          <h3>${sala.area}</h3>

          <p>${sala.nome}</p>

          <a
            href="${sala.link}"
            class="botao botao-principal"
            target="_blank"
            rel="noopener noreferrer"
          >
            Entrar na sala
          </a>

        </article>
      `;
    })
    .join("");
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