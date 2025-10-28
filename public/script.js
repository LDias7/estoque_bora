// ======== CONTROLE DE TELAS ======== //
document.addEventListener("DOMContentLoaded", () => {
  const telas = document.querySelectorAll(".screen");
  const botoes = {
    cadastro: document.getElementById("btn-cadastro"),
    entrada: document.getElementById("btn-entrada"),
    saida: document.getElementById("btn-saida"),
    saldo: document.getElementById("btn-saldo"),
  };

  const botoesVoltar = document.querySelectorAll("[id^='btn-voltar']");
  
  // Função para trocar telas
  function mostrarTela(id) {
    telas.forEach(tela => tela.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    window.scrollTo(0, 0);
  }

  // Eventos principais
  botoes.cadastro.addEventListener("click", () => mostrarTela("tela-cadastro"));
  botoes.entrada.addEventListener("click", () => mostrarTela("tela-entrada"));
  botoes.saida.addEventListener("click", () => mostrarTela("tela-saida"));
  botoes.saldo.addEventListener("click", () => mostrarTela("tela-saldo"));

  // Botões de voltar
  botoesVoltar.forEach(btn => {
    btn.addEventListener("click", () => mostrarTela("tela-principal"));
  });
});


// ======== CADASTRO DE PRODUTO ======== //
document.addEventListener("DOMContentLoaded", () => {
  const formCadastro = document.getElementById("form-cadastro");

  formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();

    const codigoFabrica = document.getElementById("codigoFabrica").value.trim();
    const codigoFornecedor = document.getElementById("codigoFornecedor").value.trim();
    const descricaoProduto = document.getElementById("descricaoProduto").value.trim();
    const nomeFornecedor = document.getElementById("nomeFornecedor").value.trim();
    const unidadeMedida = document.getElementById("unidadeMedida").value.trim();

    if (!codigoFabrica || !codigoFornecedor || !descricaoProduto || !nomeFornecedor || !unidadeMedida) {
      alert("⚠️ Preencha todos os campos antes de salvar!");
      return;
    }

    // Corpo que será enviado para o Power Automate ou API
    const dadosProduto = {
      CodigoFabrica: codigoFabrica,
      CodigoFornecedor: codigoFornecedor,
      DescricaoProduto: descricaoProduto,
      NomeFornecedor: nomeFornecedor,
      UnidadeMedida: unidadeMedida
    };

    try {
      const resposta = await fetch("https://prod-00.brazilsouth.logic.azure.com:443/workflows/SEU_FLUXO_AQUI/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=SUA_ASSINATURA_AQUI", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dadosProduto)
      });

      if (resposta.ok) {
        alert("✅ Produto cadastrado com sucesso!");
        formCadastro.reset();
      } else {
        const erro = await resposta.text();
        alert(`❌ Falha ao enviar o produto: ${erro}`);
      }

    } catch (erro) {
      alert("❌ Falha ao conectar com o servidor. Verifique a internet ou o fluxo.");
      console.error("Erro no envio:", erro);
    }
  });
});
