const STORAGE_KEY = "controleMarmitasData";

// Salvar e carregar dados do localStorage
function saveData(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function loadData() {
  const s = localStorage.getItem(STORAGE_KEY);
  return s ? JSON.parse(s) : { marmitas: [], historico: [] };
}

let data = loadData();

// Gera ID único para cada marmita
function gerarId() { return Date.now().toString(); }

// Mostrar uma seção específica
function mostrarSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  if(id === "estoque-section") atualizarListaMarmitas();
}

// --- BOTÕES TOPO ---
document.getElementById("btn-cadastrar").onclick = () => mostrarSection("cadastrar-section");
document.getElementById("btn-historico").onclick = () => { atualizarHistorico(); mostrarSection("historico-section"); }
document.getElementById("btn-relatorio").onclick = () => { atualizarRelatorio(); mostrarSection("relatorio-section"); }

// --- VOLTAR ---
document.getElementById("btn-voltar-cadastrar").onclick = () => mostrarSection("estoque-section");
document.getElementById("btn-voltar-historico").onclick = () => mostrarSection("estoque-section");
document.getElementById("btn-voltar-relatorio").onclick = () => mostrarSection("estoque-section");

// --- SALVAR NOVA MARMITA ---
document.getElementById("btn-salvar").onclick = () => {
  const nome = document.getElementById("input-nome").value.trim();
  const valor = parseFloat(document.getElementById("input-valor").value);
  const quantidade = parseInt(document.getElementById("input-quantidade").value, 10);

  if (!nome || isNaN(valor) || isNaN(quantidade)) {
    alert("Preencha todos os campos corretamente!");
    return;
  }

  const nova = { id: gerarId(), nome, valor, estoqueAtual: quantidade };
  data.marmitas.push(nova);
  data.historico.push({ timestamp: Date.now(), idMarmita: nova.id, delta: quantidade, tipo: "adição" });

  saveData(data);
  alert("Marmita cadastrada!");
  mostrarSection("estoque-section");

  atualizarListaMarmitas();
  atualizarHistorico();
  atualizarRelatorio();

  // Limpar campos
  document.getElementById("input-nome").value = '';
  document.getElementById("input-valor").value = '';
  document.getElementById("input-quantidade").value = '';
}

// --- ATUALIZAR LISTA DE MARMITAS ---
function atualizarListaMarmitas() {
  const cont = document.getElementById("estoque-section");
  cont.innerHTML = "";

  if(data.marmitas.length === 0){
    cont.innerHTML = "<p>Nenhuma marmita cadastrada.</p>";
    return;
  }

  data.marmitas.forEach(m => {
    const div = document.createElement("div");
    div.className = "marmita-item";

    const info = document.createElement("div");
    info.innerHTML = `<strong>${m.nome}</strong> — R$ ${m.valor.toFixed(2)}<br>Estoque: ${m.estoqueAtual}`;

    const ctr = document.createElement("div");
    ctr.className = "controls";

    [[+10,"btn-primary"],[+1,"btn-primary"],[-1,"btn-danger"],[-5,"btn-danger"]].forEach(([delta,cls])=>{
      const btn = document.createElement("button");
      btn.className = "btn "+cls;
      btn.innerText = delta>0?`+${delta}`:`${delta}`;
      btn.onclick = () => alterarEstoque(m.id, delta);
      ctr.appendChild(btn);
    });

    // Botão excluir
    const btnExcluir = document.createElement("button");
    btnExcluir.className = "btn btn-danger";
    btnExcluir.innerText = "❌ Excluir";
    btnExcluir.onclick = () => {
      if(confirm(`Deseja excluir a marmita "${m.nome}"?`)){
        data.marmitas = data.marmitas.filter(x => x.id !== m.id);
        data.historico = data.historico.filter(h => h.idMarmita !== m.id);
        saveData(data);
        atualizarListaMarmitas();
        atualizarHistorico();
        atualizarRelatorio();
      }
    };
    ctr.appendChild(btnExcluir);

    div.appendChild(info);
    div.appendChild(ctr);
    cont.appendChild(div);
  });
}

// --- ALTERAR ESTOQUE ---
function alterarEstoque(id, delta) {
  const m = data.marmitas.find(x=>x.id===id);
  if(!m) return;

  m.estoqueAtual += delta;
  if(m.estoqueAtual < 0) m.estoqueAtual = 0;

  data.historico.push({ timestamp: Date.now(), idMarmita: id, delta, tipo: delta>0?"adição":"remoção" });
  saveData(data);

  atualizarListaMarmitas();
  atualizarHistorico();
  atualizarRelatorio();
}

// --- HISTÓRICO ---
function atualizarHistorico() {
  const cont = document.getElementById("lista-historico");
  cont.innerHTML = "";
  [...data.historico].sort((a,b)=>b.timestamp-a.timestamp).forEach(h=>{
    const marmita = data.marmitas.find(m=>m.id===h.idMarmita);
    const dt = new Date(h.timestamp).toLocaleString("pt-BR");
    const nome = marmita?marmita.nome:"–";
    cont.innerHTML += `<div>${dt}: ${h.tipo==="adição"?"Adicionado":"Removido"} ${h.delta} → ${nome}</div>`;
  });
}

// --- RELATÓRIO ---
function atualizarRelatorio() {
  const div = document.getElementById("relatorio-conteudo");
  div.innerHTML = "";

  let totalProd=0, totalRem=0;
  data.historico.forEach(h=>{ if(h.delta>0) totalProd+=h.delta; else totalRem+=-h.delta; });

  div.innerHTML += `<p><b>Total produzido:</b> ${totalProd}</p>`;
  div.innerHTML += `<p><b>Total vendido/removido:</b> ${totalRem}</p>`;
  div.innerHTML += `<p><b>Estoque atual geral:</b> ${data.marmitas.reduce((s,m)=>s+m.estoqueAtual,0)}</p>`;

  data.marmitas.forEach(m => div.innerHTML += `<p>${m.nome}: ${m.estoqueAtual}</p>`);
}

// --- RESETAR HISTÓRICO ---
document.getElementById("btn-reset").onclick = () => {
  if(confirm("Tem certeza que deseja resetar TODO o histórico e relatório? Esta ação não pode ser desfeita.")){
    data.historico = [];
    saveData(data);
    atualizarHistorico();
    atualizarRelatorio();
    alert("Histórico e relatório resetados!");
  }
}

// --- INICIALIZAÇÃO ---
mostrarSection("estoque-section");
atualizarListaMarmitas();
atualizarHistorico();
atualizarRelatorio();
