// ==============================
// CONFIGURAÇÃO DA API
// Endereço base do servidor Flask
// ==============================
const API = "http://localhost:5000";


// ==============================
// FUNÇÃO: CARREGAR TABELA DE PREÇOS
// Busca os preços na API e monta a tabela na página
// ==============================
async function carregarPrecos() {
  const resposta = await fetch(`${API}/precos`);
  const dados = await resposta.json();

  const precos = dados.precos;
  const container = document.getElementById("tabela-precos");

  // Monta uma tabela para cada serviço disponível
  let html = "";
  for (const servico in precos) {
    html += `<table>
      <tr>
        <th colspan="2">${capitalizar(servico)}</th>
      </tr>`;

    for (const porte in precos[servico]) {
      html += `<tr>
        <td>${capitalizar(porte)}</td>
        <td>R$ ${precos[servico][porte].toFixed(2)}</td>
      </tr>`;
    }

    html += `</table>`;
  }

  container.innerHTML = html;
}


// ==============================
// FUNÇÃO: CADASTRAR PET
// Lê os campos do formulário e envia para a API
// ==============================
async function cadastrarPet() {
  const nome    = document.getElementById("nome").value.trim();
  const tutor   = document.getElementById("tutor").value.trim();
  const especie = document.getElementById("especie").value;
  const porte   = document.getElementById("porte").value;
  const msg     = document.getElementById("msg-cadastro");

  // Validação básica no front: não envia se campos obrigatórios estiverem vazios
  if (!nome || !tutor) {
    msg.style.color = "#c0392b";
    msg.textContent = "Preencha o nome do pet e do tutor.";
    return;
  }

  // Envia os dados para a API via POST
  const resposta = await fetch(`${API}/pets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, tutor, especie, porte })
  });

  const dados = await resposta.json();

  if (resposta.ok) {
    msg.style.color = "#2d7a2d";
    msg.textContent = `✅ ${dados.nome} cadastrado com sucesso!`;

    // Limpa os campos após o cadastro
    document.getElementById("nome").value  = "";
    document.getElementById("tutor").value = "";

    // Atualiza a lista de pets na tela
    carregarPets();
  } else {
    msg.style.color = "#c0392b";
    msg.textContent = `❌ ${dados.erro}`;
  }
}


// ==============================
// FUNÇÃO: CARREGAR LISTA DE PETS
// Busca todos os pets cadastrados e exibe como cards
// ==============================
async function carregarPets() {
  const resposta = await fetch(`${API}/pets`);
  const pets     = await resposta.json();
  const container = document.getElementById("lista-pets-conteudo");

  if (pets.length === 0) {
    container.innerHTML = `<p class="vazio">Nenhum pet cadastrado ainda.</p>`;
    return;
  }

  let html = "";
  for (const pet of pets) {
    const faltam = 10 - pet.banhos_pagos;

    html += `
      <div class="pet-card">
        <div>
          <strong>${pet.nome}</strong><br>
          <span>${capitalizar(pet.especie)} · ${capitalizar(pet.porte)} · Tutor: ${pet.tutor}</span>
        </div>
        <span class="badge-fidelidade">🐾 ${faltam} banho(s) p/ grátis</span>
      </div>`;
  }

  container.innerHTML = html;
}


// ==============================
// FUNÇÃO: SIMULAR ATENDIMENTO
// Calcula o valor sem registrar e exibe o resultado
// ==============================
async function simularAtendimento() {
  const pet      = document.getElementById("pet-atend").value.trim();
  const servicos = getServicosSelecionados();
  const msg      = document.getElementById("msg-atendimento");
  const box      = document.getElementById("resultado-simulacao");
  const btnConf  = document.getElementById("btn-confirmar");

  // Oculta botão de confirmar e limpa resultado anterior
  btnConf.style.display = "none";
  box.style.display     = "none";
  msg.textContent        = "";

  if (!pet) {
    msg.style.color = "#c0392b";
    msg.textContent = "Informe o nome do pet.";
    return;
  }

  if (servicos.length === 0) {
    msg.style.color = "#c0392b";
    msg.textContent = "Selecione pelo menos um serviço.";
    return;
  }

  // Envia a simulação para a API
  const resposta = await fetch(`${API}/atendimentos/simular`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pet, servicos })
  });

  const dados = await resposta.json();

  if (resposta.ok) {
    // Monta o resumo da simulação
    let resumo = `<strong>Pet:</strong> ${dados.pet}<br>`;
    resumo += `<strong>Serviços:</strong> ${dados.servicos.map(capitalizar).join(", ")}<br>`;

    if (dados.banho_gratis) {
      resumo += `🎉 <strong>Banho grátis</strong> (fidelidade)<br>`;
    }

    if (dados.desconto_combo > 0) {
      resumo += `🏷️ Desconto combo: -R$ ${dados.desconto_combo.toFixed(2)}<br>`;
    }

    resumo += `<strong>Total: R$ ${dados.total.toFixed(2)}</strong>`;

    box.innerHTML    = resumo;
    box.style.display = "block";

    // Exibe o botão de confirmar
    btnConf.style.display = "block";
  } else {
    msg.style.color = "#c0392b";
    msg.textContent = `❌ ${dados.erro}`;
  }
}


// ==============================
// FUNÇÃO: CONFIRMAR ATENDIMENTO
// Registra o atendimento na API (atualiza fidelidade)
// ==============================
async function confirmarAtendimento() {
  const pet      = document.getElementById("pet-atend").value.trim();
  const servicos = getServicosSelecionados();
  const msg      = document.getElementById("msg-atendimento");
  const btnConf  = document.getElementById("btn-confirmar");
  const box      = document.getElementById("resultado-simulacao");

  // Envia o registro definitivo para a API
  const resposta = await fetch(`${API}/atendimentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pet, servicos })
  });

  const dados = await resposta.json();

  if (resposta.ok) {
    msg.style.color = "#2d7a2d";
    msg.textContent = `✅ Atendimento registrado! Total: R$ ${dados.total.toFixed(2)}`;

    // Limpa o formulário de atendimento
    document.getElementById("pet-atend").value = "";
    document.getElementById("serv-banho").checked      = false;
    document.getElementById("serv-tosa").checked       = false;
    document.getElementById("serv-hidratacao").checked = false;

    box.style.display      = "none";
    btnConf.style.display  = "none";

    // Atualiza a lista de pets (atualiza o contador de banhos)
    carregarPets();
  } else {
    msg.style.color = "#c0392b";
    msg.textContent = `❌ ${dados.erro}`;
  }
}


// ==============================
// FUNÇÃO: CARREGAR HISTÓRICO
// Busca todos os atendimentos registrados
// ==============================
async function carregarHistorico() {
  const resposta = await fetch(`${API}/historico`);
  const dados    = await resposta.json();
  const container = document.getElementById("historico-conteudo");

  if (dados.atendimentos.length === 0) {
    container.innerHTML = `<p class="vazio">Nenhum atendimento registrado.</p>`;
    return;
  }

  let html = "";
  for (const item of dados.atendimentos) {
    html += `
      <div class="historico-card">
        <strong>${item.pet}</strong> (tutor: ${item.tutor})<br>
        Serviços: ${item.servicos.map(capitalizar).join(", ")}<br>`;

    if (item.banho_gratis) {
      html += `🎉 Banho grátis (fidelidade)<br>`;
    }

    if (item.desconto_combo > 0) {
      html += `Desconto combo: -R$ ${item.desconto_combo.toFixed(2)}<br>`;
    }

    html += `Total: <strong>R$ ${item.total.toFixed(2)}</strong>
      </div>`;
  }

  // Exibe faturamento total
  html += `<p class="faturamento-total">💰 Faturamento total: R$ ${dados.faturamento_total.toFixed(2)}</p>`;

  container.innerHTML = html;
}


// ==============================
// FUNÇÃO AUXILIAR: SERVIÇOS SELECIONADOS
// Retorna uma lista com os serviços marcados nos checkboxes
// ==============================
function getServicosSelecionados() {
  const servicos = [];
  if (document.getElementById("serv-banho").checked)      servicos.push("banho");
  if (document.getElementById("serv-tosa").checked)       servicos.push("tosa");
  if (document.getElementById("serv-hidratacao").checked) servicos.push("hidratacao");
  return servicos;
}


// ==============================
// FUNÇÃO AUXILIAR: CAPITALIZAR
// Deixa a primeira letra maiúscula
// ==============================
function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}


// ==============================
// INICIALIZAÇÃO
// Carrega os dados ao abrir a página
// ==============================
carregarPrecos();
carregarPets();
