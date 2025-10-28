import fetch from "node-fetch";

export default async function handler(req, res) {
  const { codigo } = req.query;

  if (!codigo) {
    return res.status(400).json({ error: "Código do produto não informado" });
  }

  try {
    const siteUrl = "https://SEU_DOMINIO.sharepoint.com/sites/NOME_DO_SITE";
    const token = process.env.SHAREPOINT_TOKEN; // adicione no painel da Vercel

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json;odata=verbose",
    };

    // Puxa Entradas
    const entradasRes = await fetch(
      `${siteUrl}/_api/web/lists/getbytitle('Entrada')/items?$filter=Title eq '${codigo}'`,
      { headers }
    );
    const entradas = await entradasRes.json();
    const totalEntradas = entradas.d.results.reduce(
      (s, e) => s + (e.Quantidade || 0),
      0
    );

    // Puxa Saídas
    const saidasRes = await fetch(
      `${siteUrl}/_api/web/lists/getbytitle('Saída')/items?$filter=Title eq '${codigo}'`,
      { headers }
    );
    const saidas = await saidasRes.json();
    const totalSaidas = saidas.d.results.reduce(
      (s, e) => s + (e.Quantidade || 0),
      0
    );

    const saldo = totalEntradas - totalSaidas;

    res.status(200).json({
      codigo,
      entradas: totalEntradas,
      saidas: totalSaidas,
      saldo,
    });
  } catch (error) {
    console.error("Erro ao consultar SharePoint:", error);
    res.status(500).json({ error: "Erro ao consultar SharePoint" });
  }
}
