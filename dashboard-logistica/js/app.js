let dados = [];

let transportadoraChart;
let regiaoChart;

async function carregarDados() {

    const response = await fetch("./data/entregas.json");
    dados = await response.json();

    preencherFiltros();

    atualizarDashboard();

    document
        .getElementById("transportadoraFiltro")
        .addEventListener("change", atualizarDashboard);

    document
        .getElementById("regiaoFiltro")
        .addEventListener("change", atualizarDashboard);

    document
        .getElementById("pesquisa")
        .addEventListener("input", atualizarDashboard);
}

function preencherFiltros() {

    const transportadoras = [
        ...new Set(dados.map(d => d.transportadora))
    ];

    const regioes = [
        ...new Set(dados.map(d => d.regiao))
    ];

    const transportadoraSelect =
        document.getElementById("transportadoraFiltro");

    const regiaoSelect =
        document.getElementById("regiaoFiltro");

    transportadoras.forEach(item => {

        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;

        transportadoraSelect.appendChild(option);
    });

    regioes.forEach(item => {

        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;

        regiaoSelect.appendChild(option);
    });
}

function atualizarDashboard() {

    const transportadora =
        document.getElementById("transportadoraFiltro").value;

    const regiao =
        document.getElementById("regiaoFiltro").value;

    const pesquisa =
        document.getElementById("pesquisa").value.toLowerCase();

    let filtrados = dados.filter(item => {

        const filtroTransportadora =
            transportadora === "Todos" ||
            item.transportadora === transportadora;

        const filtroRegiao =
            regiao === "Todos" ||
            item.regiao === regiao;

        const filtroPesquisa =
            item.id.toString().includes(pesquisa) ||
            item.transportadora.toLowerCase().includes(pesquisa) ||
            item.regiao.toLowerCase().includes(pesquisa);

        return (
            filtroTransportadora &&
            filtroRegiao &&
            filtroPesquisa
        );
    });

    atualizarKPIs(filtrados);

    atualizarGraficos(filtrados);

    atualizarTabela(filtrados);

    atualizarRanking(filtrados);
}

function atualizarKPIs(lista) {

    const total = lista.length;

    const atrasadas = lista.filter(
        e => e.real > e.prazo
    ).length;

    const prazo = total - atrasadas;

    const taxa =
        total > 0
            ? ((atrasadas / total) * 100).toFixed(1)
            : 0;

    document.getElementById("total").textContent = total;

    document.getElementById("atrasadas").textContent =
        atrasadas;

    document.getElementById("prazo").textContent =
        prazo;

    document.getElementById("taxa").textContent =
        taxa + "%";
}

function atualizarGraficos(lista) {

    const atrasadas = lista.filter(
        e => e.real > e.prazo
    );

    const transportadoras = {};

    atrasadas.forEach(item => {

        transportadoras[item.transportadora] =
            (transportadoras[item.transportadora] || 0) + 1;
    });

    const regioes = {};

    atrasadas.forEach(item => {

        regioes[item.regiao] =
            (regioes[item.regiao] || 0) + 1;
    });

    if (transportadoraChart) {
        transportadoraChart.destroy();
    }

    if (regiaoChart) {
        regiaoChart.destroy();
    }

    transportadoraChart = new Chart(
        document.getElementById("transportadorasChart"),
        {
            type: "bar",
            data: {
                labels: Object.keys(transportadoras),
                datasets: [{
                    label: "Entregas Atrasadas",
                    data: Object.values(transportadoras),
                    backgroundColor: "#a855f7"
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        }
    );

    regiaoChart = new Chart(
        document.getElementById("regioesChart"),
        {
            type: "doughnut",
            data: {
                labels: Object.keys(regioes),
                datasets: [{
                    data: Object.values(regioes),
                    backgroundColor: [
                        "#a855f7",
                        "#dc2626",
                        "#16a34a",
                        "#f59e0b",
                        "#3b82f6"
                    ]
                }]
            },
            options: {
                responsive: true
            }
        }
    );
}

function atualizarTabela(lista) {

    const tbody =
        document.getElementById("tbody");

    tbody.innerHTML = "";

    lista.forEach(item => {

        const atrasada =
            item.real > item.prazo;

        const tr =
            document.createElement("tr");

        tr.className =
            atrasada
                ? "atrasada"
                : "prazo";

        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.transportadora}</td>
            <td>${item.regiao}</td>
            <td>${item.prazo}</td>
            <td>${item.real}</td>
            <td>
                ${
                    atrasada
                    ? "⚠️ Atrasada"
                    : "✅ No Prazo"
                }
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function atualizarRanking(lista) {

    const container =
        document.getElementById("rankingContainer");

    container.innerHTML = "";

    const atrasadas = lista
        .filter(item => item.real > item.prazo)
        .map(item => ({
            ...item,
            atraso: item.real - item.prazo
        }))
        .sort((a,b) => b.atraso - a.atraso);

    atrasadas.forEach(item => {

        const div =
            document.createElement("div");

        let classe = "baixo";

        if(item.atraso >= 5){
            classe = "critico";
        }
        else if(item.atraso >= 2){
            classe = "medio";
        }

        div.className =
            `rank-item ${classe}`;

        div.innerHTML = `
            Entrega ${item.id}
            •
            ${item.atraso} dia(s) de atraso
            •
            ${item.transportadora}
        `;

        container.appendChild(div);
    });

    if(atrasadas.length === 0){

        container.innerHTML = `
            <div class="rank-item baixo">
                Nenhuma entrega atrasada.
            </div>
        `;
    }
}

carregarDados();