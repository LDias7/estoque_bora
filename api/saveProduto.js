export default async function handler(req, res) {
  // Bloquear métodos que não sejam POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    // 1️⃣ Obter digest (token de segurança do SharePoint)
    const digestResp = await fetch(
      "https://borexpress.sharepoint.com/sites/EstoqueJC/_api/contextinfo",
      {
        method: "POST",
        headers: { "Accept": "application/json;odata=nometadata" },
        credentials: "include",
      }
    );
    const digestData = await digestResp.json();
    const digest = digestData.FormDigestValue;

    // 2️⃣ Montar o POST para criar o item na lista "Produtos"
    const response = await fetch(
      "https://borexpress.sharepoint.com/sites/EstoqueJC/_api/web/lists/GetByTitle('Produtos')/items",
      {
        method: "POST",
        headers: {
          "Accept": "application/json;odata=nometadata",
          "Content-Type": "application/json;odata=nometadata",
          "X-RequestDigest": digest,
        },
        body: JSON.stringify(req.body),
      }
    );

    // 3️⃣ Retornar resultado
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
