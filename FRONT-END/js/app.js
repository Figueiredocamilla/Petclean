/* ============================================
   PETCLEAN · lógica da interface
   Regras de negócio portadas do back end em Python
   ============================================ */

"use strict";

// ---------- DADOS (iguais ao back end) ----------

const NOME_PETSHOP = "PetClean";

// Tabela de preços: objeto aninhado -> PRECOS[servico][porte]
const PRECOS = {
  banho:      { pequeno: 40.0, medio: 60.0, grande: 80.0 },
  tosa:       { pequeno: 50.0, medio: 70.0, grande: 90.0 },
  hidratacao: { pequeno: 30.0, medio: 45.0, grande: 60.0 },
};

const DESCONTO_COMBO = 0.15;     // 15% no combo banho + tosa
const BANHOS_PARA_GRATIS = 10;   // a cada 10 banhos pagos, o próximo é grátis

const NOMES_SERVICO = { banho: "Banho", tosa: "Tosa", hidratacao: "Hidratação" };
const NOMES_PORTE = { pequeno: "Pequeno", medio: "Médio", grande: "Grande" };
const EMOJI_ESPECIE = { cachorro: "🐶", gato: "🐱" };

const CHAVE_STORAGE = "petclean:dados";

let pets = [];        // lista de objetos (um por pet)
let historico = [];   // lista de atendimentos realizados

// ---------- ARMAZENAMENTO (localStorage) ----------

function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) return;
    const dados = JSON.parse(bruto);
    pets = Array.isArray(dados.pets) ? dados.pets : [];
    historico = Array.isArray(dados.historico) ? dados.historico : [];
  } catch (erro) {
    pets = [];
    historico = [];
  }
}

function salvar() {
  try {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify({ pets, historico }));
  } catch (erro) {
    avisar("Não foi possível salvar os dados neste navegador.");
  }
}

// ---------- FUNÇÕES AUXILIARES ----------

const formatoReal = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dinheiro = (valor) => formatoReal.format(valor);

const $ = (seletor) => document.querySelector(seletor);

/** Cria um elemento com texto seguro (sem interpretar HTML). */
function criar(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function buscarPet(nome) {
  const alvo = nome.trim().toLowerCase();
  return pets.find((pet) => pet.nome.toLowerCase() === alvo) || null;
}

let temporizadorAviso;
function avisar(mensagem) {
  const aviso = $("#aviso");
  aviso.textContent = mensagem;
  aviso.classList.add("visivel");
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => aviso.classList.remove("visivel"), 3000);
}

function mostrarErro(elemento, mensagem) {
  elemento.textContent = mensagem;
  elemento.hidden = false;
}

function limparErro(elemento) {
  elemento.textContent = "";
  elemento.hidden = true;
}

// ---------- REGRAS DE NEGÓCIO ----------

/**
 * Recebe o pet e a lista de serviços (ex: ["banho", "tosa"]).
 * Retorna: { total, desconto, banhoGratis }
 */
function calcularAtendimento(pet, servicos) {
  const porte = pet.porte;
  let total = 0;
  for (const servico of servicos) {
    total += PRECOS[servico][porte];
  }

  // Regra 1: banho grátis (fidelidade)
  let banhoGratis = false;
  if (servicos.includes("banho") && pet.banhos_pagos >= BANHOS_PARA_GRATIS) {
    banhoGratis = true;
    total -= PRECOS.banho[porte];
  }

  // Regra 2: combo banho + tosa tem 15% de desconto
  // (só se o banho não for grátis, para não descontar duas vezes)
  let desconto = 0;
  if (servicos.includes("banho") && servicos.includes("tosa") && !banhoGratis) {
    const valorCombo = PRECOS.banho[porte] + PRECOS.tosa[porte];
    desconto = valorCombo * DESCONTO_COMBO;
    total -= desconto;
  }

  return { total, desconto, banhoGratis };
}

// ---------- NAVEGAÇÃO ----------

function irPara(nomeView) {
  document.querySelectorAll(".view").forEach((secao) => {
    secao.hidden = secao.id !== `view-${nomeView}`;
  });
  document.querySelectorAll(".aba").forEach((aba) => {
    if (aba.dataset.view === nomeView) aba.setAttribute("aria-current", "page");
    else aba.removeAttribute("aria-current");
  });
  if (nomeView === "atendimento") renderAtendimento();
  if (nomeView === "historico") renderHistorico();
  window.scrollTo({ top: 0 });
}

// ---------- PETS ----------

function cadastrarPet(evento) {
  evento.preventDefault();
  const form = evento.target;
  const erro = $("#erro-pet");
  limparErro(erro);

  const nome = form.nome.value.trim();
  const tutor = form.tutor.value.trim();
  const especie = form.especie.value;
  const porte = form.porte.value;

  if (!nome) return mostrarErro(erro, "Digite o nome do pet.");
  if (!tutor) return mostrarErro(erro, "Digite o nome do tutor.");
  if (buscarPet(nome)) return mostrarErro(erro, "Já existe um pet com esse nome.");

  pets.push({ nome, especie, porte, tutor, banhos_pagos: 0 });
  salvar();
  form.reset();
  form.nome.focus();
  renderPets();
  avisar(`${nome} foi cadastrado.`);
}

function criarBolhas(pet) {
  const premio = pet.banhos_pagos >= BANHOS_PARA_GRATIS;
  const lista = criar("ul", "bolhas" + (premio ? " bolhas--premio" : ""));
  lista.setAttribute("aria-hidden", "true");
  for (let i = 0; i < BANHOS_PARA_GRATIS; i++) {
    lista.appendChild(criar("li", "bolha" + (i < pet.banhos_pagos ? " bolha--cheia" : "")));
  }
  return lista;
}

function textoFidelidade(pet) {
  const faltam = BANHOS_PARA_GRATIS - pet.banhos_pagos;
  const p = criar("p", "pet__fidelidade");
  if (faltam <= 0) {
    p.classList.add("pet__fidelidade--premio");
    p.appendChild(criar("strong", "", "Próximo banho grátis!"));
  } else {
    p.append("Faltam ");
    p.appendChild(criar("strong", "", String(faltam)));
    p.append(faltam === 1 ? " banho para o grátis" : " banhos para o grátis");
  }
  return p;
}

function renderPets() {
  const lista = $("#lista-pets");
  lista.replaceChildren();

  if (pets.length === 0) {
    const item = criar("li", "vazio");
    item.appendChild(criar("p", "", "Nenhum pet cadastrado. Preencha o formulário para adicionar o primeiro."));
    lista.appendChild(item);
    return;
  }

  for (const pet of pets) {
    const item = criar("li", "pet");

    const linha = criar("div", "pet__linha");
    linha.appendChild(criar("span", "pet__nome", `${EMOJI_ESPECIE[pet.especie] || ""} ${pet.nome}`.trim()));
    linha.appendChild(criar("span", "pet__info", `${NOMES_PORTE[pet.porte]} · tutor: ${pet.tutor}`));
    item.appendChild(linha);

    item.appendChild(criarBolhas(pet));
    item.appendChild(textoFidelidade(pet));
    lista.appendChild(item);
  }
}

// ---------- ATENDIMENTO ----------

function petSelecionado() {
  const nome = $("#atend-pet").value;
  return nome ? buscarPet(nome) : null;
}

function servicosMarcados() {
  return Array.from(document.querySelectorAll('input[name="servico"]:checked')).map((c) => c.value);
}

function renderAtendimento() {
  const vazio = pets.length === 0;
  $("#atend-vazio").hidden = !vazio;
  $("#atend-conteudo").hidden = vazio;
  if (vazio) return;

  // Mantém o pet escolhido, se ainda existir
  const select = $("#atend-pet");
  const anterior = select.value;
  select.replaceChildren();
  for (const pet of pets) {
    const opcao = criar("option", "", `${pet.nome} (${NOMES_PORTE[pet.porte].toLowerCase()}) · ${pet.tutor}`);
    opcao.value = pet.nome;
    select.appendChild(opcao);
  }
  if (anterior && buscarPet(anterior)) select.value = anterior;

  atualizarResumo();
}

function atualizarResumo() {
  const pet = petSelecionado();
  if (!pet) return;

  // Preços do porte do pet ao lado de cada serviço
  document.querySelectorAll("[data-preco]").forEach((el) => {
    el.textContent = dinheiro(PRECOS[el.dataset.preco][pet.porte]);
  });

  // Fidelidade do pet
  const caixa = $("#resumo-fidelidade");
  caixa.replaceChildren(criarBolhas(pet), textoFidelidade(pet));

  // Linhas do resumo
  const linhas = $("#resumo-linhas");
  linhas.replaceChildren();
  const servicos = servicosMarcados();

  if (servicos.length === 0) {
    const p = criar("p", "resumo__vazio", "Marque os serviços para ver o valor.");
    linhas.replaceChildren(p);
    $("#resumo-total").textContent = dinheiro(0);
    return;
  }

  const adicionarLinha = (rotulo, valor, classe) => {
    const div = criar("div", classe);
    div.appendChild(criar("dt", "", rotulo));
    div.appendChild(criar("dd", "", valor));
    linhas.appendChild(div);
  };

  for (const servico of servicos) {
    adicionarLinha(NOMES_SERVICO[servico], dinheiro(PRECOS[servico][pet.porte]));
  }

  const { total, desconto, banhoGratis } = calcularAtendimento(pet, servicos);
  if (banhoGratis) {
    adicionarLinha("Banho grátis (fidelidade)", "-" + dinheiro(PRECOS.banho[pet.porte]), "desconto");
  }
  if (desconto > 0) {
    adicionarLinha("Desconto combo (15%)", "-" + dinheiro(desconto), "desconto");
  }
  $("#resumo-total").textContent = dinheiro(total);
}

function registrarAtendimento(evento) {
  evento.preventDefault();
  const erro = $("#erro-atend");
  limparErro(erro);

  const pet = petSelecionado();
  if (!pet) return mostrarErro(erro, "Cadastre um pet primeiro.");

  const servicos = servicosMarcados();
  if (servicos.length === 0) return mostrarErro(erro, "Selecione pelo menos um serviço.");

  const { total, desconto, banhoGratis } = calcularAtendimento(pet, servicos);

  // Atualiza o contador de fidelidade
  if (servicos.includes("banho")) {
    if (banhoGratis) pet.banhos_pagos = 0;   // zera depois do grátis
    else pet.banhos_pagos += 1;              // conta mais um banho pago
  }

  historico.push({
    pet: pet.nome,
    servicos,
    total,
    desconto,
    banho_gratis: banhoGratis,
    data: new Date().toISOString(),
  });
  salvar();

  mostrarRecibo(pet, servicos, total, desconto, banhoGratis);

  document.querySelectorAll('input[name="servico"]').forEach((c) => (c.checked = false));
  renderPets();
  atualizarResumo();
}

function mostrarRecibo(pet, servicos, total, desconto, banhoGratis) {
  const corpo = $("#recibo-corpo");
  corpo.replaceChildren();

  corpo.appendChild(criar("p", "", `${pet.nome} (${NOMES_PORTE[pet.porte].toLowerCase()})`));
  corpo.appendChild(criar("p", "", `Tutor: ${pet.tutor}`));

  const adicionar = (rotulo, valor, classe) => {
    const linha = criar("div", "recibo__linha" + (classe ? " " + classe : ""));
    linha.appendChild(criar("span", "", rotulo));
    linha.appendChild(criar("span", "", valor));
    corpo.appendChild(linha);
  };

  for (const servico of servicos) {
    adicionar(NOMES_SERVICO[servico], dinheiro(PRECOS[servico][pet.porte]));
  }
  if (banhoGratis) {
    adicionar("Banho grátis (fidelidade)", "-" + dinheiro(PRECOS.banho[pet.porte]));
  }
  if (desconto > 0) {
    adicionar("Desconto combo (15%)", "-" + dinheiro(desconto));
  }
  adicionar("Total", dinheiro(total), "recibo__linha--total");

  const dialogo = $("#recibo");
  if (typeof dialogo.showModal === "function") dialogo.showModal();
  else avisar(`Atendimento registrado: ${dinheiro(total)}`);
}

// ---------- PREÇOS ----------

function renderPrecos() {
  const corpo = $("#tabela-precos");
  corpo.replaceChildren();
  for (const servico of Object.keys(PRECOS)) {
    const linha = criar("tr");
    const cabecalho = criar("th", "", NOMES_SERVICO[servico]);
    cabecalho.scope = "row";
    linha.appendChild(cabecalho);
    for (const porte of Object.keys(PRECOS[servico])) {
      linha.appendChild(criar("td", "", dinheiro(PRECOS[servico][porte])));
    }
    corpo.appendChild(linha);
  }
}

// ---------- HISTÓRICO ----------

function renderHistorico() {
  const vazio = historico.length === 0;
  $("#hist-vazio").hidden = !vazio;
  $("#hist-conteudo").hidden = vazio;
  if (vazio) return;

  const corpo = $("#tabela-historico");
  corpo.replaceChildren();
  let faturamento = 0;

  // Mais recentes primeiro
  for (const item of [...historico].reverse()) {
    const linha = criar("tr");
    const data = item.data ? new Date(item.data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "-";
    linha.appendChild(criar("td", "", data));
    linha.appendChild(criar("td", "", item.pet));
    linha.appendChild(criar("td", "", item.servicos.map((s) => NOMES_SERVICO[s]).join(", ")));
    linha.appendChild(criar("td", "num", dinheiro(item.total)));
    corpo.appendChild(linha);
  }
  for (const item of historico) faturamento += item.total;

  $("#faturamento").textContent = dinheiro(faturamento);
}

function apagarTudo() {
  if (!confirm("Isso apaga todos os pets e atendimentos deste navegador. Continuar?")) return;
  pets = [];
  historico = [];
  salvar();
  renderPets();
  renderHistorico();
  avisar("Dados apagados.");
}

// ---------- INICIALIZAÇÃO ----------

function iniciar() {
  carregar();
  renderPrecos();
  renderPets();
  renderHistorico();

  document.querySelectorAll(".aba").forEach((aba) => {
    aba.addEventListener("click", () => irPara(aba.dataset.view));
  });
  document.querySelectorAll("[data-ir]").forEach((botao) => {
    botao.addEventListener("click", () => irPara(botao.dataset.ir));
  });

  $("#form-pet").addEventListener("submit", cadastrarPet);
  $("#form-atendimento").addEventListener("submit", registrarAtendimento);
  $("#atend-pet").addEventListener("change", atualizarResumo);
  document.querySelectorAll('input[name="servico"]').forEach((c) => {
    c.addEventListener("change", atualizarResumo);
  });
  $("#btn-limpar").addEventListener("click", apagarTudo);
}

document.addEventListener("DOMContentLoaded", iniciar);
