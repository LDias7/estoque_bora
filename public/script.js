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

  function mostrarTela(id) {
    telas.forEach((tela) => tela.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    window.scrollTo(0, 0);
  }

  botoes.cadastro.addEventListener("click", () => mostrarTela("tela-cadastro"));
  botoes.entrada.addEventListener("click", () => mostrarTela("tela-entrada"));
  botoes.saida.addEventListener("click", () => mostrarTela("tela-saida"));
  botoes.saldo.addEventListener("click", () => mostrarTela("tela-saldo"));
  botoesVoltar.forEach((btn) =>
    btn.addEventListener("click", () => mostrarTela("tela-principal"))
  );
});

// ======== ENVIO DO CADASTRO VIA MICROSOFT FORMS ======== //
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

    // Seu Forms URL
    const formsUrl = "https://forms.office.com/r/cYKFvRQbRV";

    // Abre o Microsoft Forms em uma nova aba com os dados preenchidos (simulação de integração)
    const queryString = new URLSearchParams({
      "Código de Fábrica": codigoFabrica,
      "Código do Fornecedor": codigoFornecedor,
      "Descrição do Produto": descricaoProduto,
      "Nome do Fornecedor": nomeFornecedor,
      "Unidade de Medida": unidadeMedida,
    }).toString();

    // O Forms não aceita pré-preenchimento de forma nativa, então apenas abre para envio manual
    alert("✅ Dados preparados. Envie pelo Forms que o Power Automate cuidará do SharePoint.");
    window.open(formsUrl, "_blank");

    formCadastro.reset();
  });
});
