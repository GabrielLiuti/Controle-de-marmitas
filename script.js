const STORAGE_KEY = "controleMarmitasData";

function saveData(data) { 
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); 
}

function loadData() {
  const s = localStorage.getItem(STORAGE_KEY);
  return s ? JSON.parse(s) : { marmitas: [], historico: [] };
}

let data = loadData();

function gerarId() { return Date.now().toString(); }

function mostrarSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  if(id === "estoque-section") atualizarListaMarmitas();
}

// Botões topo
document.getElementById("btn-cadastrar").onclick = () => mostrarSection("cadastrar-section");
document.getElementById("btn-historico").onclick = () => { atualizarHistorico(); mostrarSection("historico-section"); }
document.getElementById("btn-relatorio").onclick = () => { atualizarRelatorio(); mostrarSection("relatorio-section"); }

// Voltar
document.getElementById("btn-voltar-cadastrar").onclick = () => mostrarSection("estoque-section");
document.getElementById("btn-voltar-historico").onclick = () => mostrarSection("estoque-section");
document.getElementById("btn-voltar-relatorio").onclick = () => mostrarSection("estoque-section");

// Salvar Marmita
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
}

// Estoque
function atualizarListaMarmitas() {
  const cont = document.getElementById("estoque-section");
  cont.innerHTML = "";

  if(data.marmitas.length === 0){
    cont.innerHTML = "<p>Nenhuma marmita cadastrada.</p>";
    atualizarTotais();
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
      const confirma = confirm(`Deseja excluir a marmita "${m.nome}"?`);
      if(confirma){
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

  atualizarTotais();
}

function alterarEstoque(id, delta) {
  const m = data.marmitas.find(x=>x.id===id); 
  if(!m) return;
  m.estoqueAtual += delta; 
  if(m.estoqueAtual<0) m.estoqueAtual=0;
  data.historico.push({ timestamp: Date.now(), idMarmita: id, delta, tipo: delta>0?"adição":"remoção" });
  saveData(data); 
  atualizarListaMarmitas();
}

// Totais na tela principal
function atualizarTotais() {
  const div = document.getElementById("totais-principais");
  if(!div) return;

  let valorEstoque = 0;
  let valorVendas = 0;

  data.marmitas.forEach(m => {
    valorEstoque += m.valor * m.estoqueAtual;
  });

  data.historico.forEach(h => {
    if(h.delta < 0){ 
      const m = data.marmitas.find(x=>x.id===h.idMarmita);
      if(m) valorVendas += Math.abs(h.delta) * m.valor;
    }
  });

  div.innerHTML = `
    <div style="float:left;"><b>Total em estoque:</b> R$ ${valorEstoque.toFixed(2)}</div>
    <div style="float:right;"><b>Total vendido:</b> R$ ${valorVendas.toFixed(2)}</div>
    <div style="clear:both;"></div>
  `;
}

// Histórico
function atualizarHistorico() {
  const cont = document.getElementById("lista-historico");
  cont.innerHTML = "";
  [...data.historico].sort((a,b)=>b.timestamp-a.timestamp).forEach(h=>{
    const marmita=data.marmitas.find(m=>m.id===h.idMarmita);
    const dt=new Date(h.timestamp).toLocaleString("pt-BR");
    const nome=marmita?marmita.nome:"–";
    cont.innerHTML += `<div>${dt}: ${h.tipo==="adição"?"Adicionado":"Removido"} ${h.delta} → ${nome}</div>`;
  });
}

// Relatório
function atualizarRelatorio() {
  const div = document.getElementById("relatorio-conteudo");
  div.innerHTML = "";

  let totalProduzido = 0, totalRemovido = 0;
  let valorEstoque = 0, valorVendas = 0;

  data.marmitas.forEach(m => {
    valorEstoque += m.valor * m.estoqueAtual;
  });

  data.historico.forEach(h => {
    if(h.delta>0) totalProduzido += h.delta;
    else totalRemovido += -h.delta;

    if(h.delta < 0){ 
      const m = data.marmitas.find(x=>x.id===h.idMarmita);
      if(m) valorVendas += Math.abs(h.delta) * m.valor;
    }
  });

  div.innerHTML += `<p><b>Total produzido:</b> ${totalProduzido}</p>`;
  div.innerHTML += `<p><b>Total removido/vendido:</b> ${totalRemovido}</p>`;
  div.innerHTML += `<p><b>Estoque atual geral:</b> ${data.marmitas.reduce((s,m)=>s+m.estoqueAtual,0)}</p>`;
  div.innerHTML += `<p><b>Valor total em estoque:</b> R$ ${valorEstoque.toFixed(2)}</p>`;
  div.innerHTML += `<p><b>Valor total de vendas/removidos:</b> R$ ${valorVendas.toFixed(2)}</p>`;

  data.marmitas.forEach(m => div.innerHTML += `<p>${m.nome}: ${m.estoqueAtual}</p>`);
}

// Resetar histórico
document.getElementById("btn-reset").onclick = () => {
  const confirma = confirm("Tem certeza que deseja resetar TODO o histórico e relatório? Esta ação não pode ser desfeita.");
  if(confirma){
    data.historico = [];
    saveData(data);
    atualizarHistorico();
    atualizarRelatorio();
    atualizarTotais();
    alert("Histórico e relatório resetados!");
  }
}

// Inicial
mostrarSection("estoque-section");
