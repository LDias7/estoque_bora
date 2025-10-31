async function getToken() {
  const r = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : ''}/api/token`);
  if (!r.ok) throw new Error('token fail');
  const { access_token } = await r.json();
  return access_token;
}

async function graphGetAll(url, token) {
  const out = [];
  let next = `https://graph.microsoft.com/v1.0${url}`;
  while (next) {
    const r = await fetch(next, { headers: { Authorization: `Bearer ${token}` } });
    const data = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(data));
    out.push(...(data.value || []));
    next = data['@odata.nextLink'] || null;
  }
  return out;
}

export default async function handler(req, res) {
  try {
    const SITE_ID = process.env.SITE_ID;
    const LIST_PRODUTOS = process.env.LIST_PRODUTOS || 'Produtos';
    const LIST_ENTRADAS = process.env.LIST_ENTRADAS || 'Entrada';
    const LIST_SAIDAS = process.env.LIST_SAIDAS || 'Saídas';

    if (!SITE_ID) return res.status(500).json({ error: 'SITE_ID missing' });

    const token = await getToken();

    // Lê listas (campos via fields.*)
    const [prod, ent, sai] = await Promise.all([
      graphGetAll(`/sites/${encodeURIComponent(SITE_ID)}/lists/${encodeURIComponent(LIST_PRODUTOS)}/items?expand=fields&$top=5000`, token),
      graphGetAll(`/sites/${encodeURIComponent(SITE_ID)}/lists/${encodeURIComponent(LIST_ENTRADAS)}/items?expand=fields&$top=5000`, token),
      graphGetAll(`/sites/${encodeURIComponent(SITE_ID)}/lists/${encodeURIComponent(LIST_SAIDAS)}/items?expand=fields&$top=5000`, token),
    ]);

    // Normaliza números (aceita vírgula ou ponto)
    const toNum = (v) => {
      if (v === null || v === undefined) return 0;
      const s = String(v).replace(/\./g, '').replace(',', '.');
      const n = Number(s);
      return Number.isFinite(n) ? n : 0;
    };

    // Soma entradas/saídas por Title
    const sumByTitle = (rows, fieldQty = 'Quantidade') => {
      const map = new Map();
      for (const it of rows) {
        const f = it.fields || {};
        const key = (f.Title || '').trim();
        if (!key) continue;
        const q = toNum(f[fieldQty]);
        map.set(key, (map.get(key) || 0) + q);
      }
      return map;
    };

    const entMap = sumByTitle(ent);
    const saiMap = sumByTitle(sai);

    // Junta com Produtos e calcula saldo (Entradas - Saídas)
    const rows = (prod || []).map((it) => {
      const f = it.fields || {};
      const title = (f.Title || '').trim();
      const entradas = entMap.get(title) || 0;
      const saidas = saiMap.get(title) || 0;
      const saldo = entradas - saidas;

      return {
        Title: title,
        CodigoFornecedor: f.CodigoFornecedor || '',
        DescricaoProduto: f.DescricaoProduto || '',
        NomeFornecedor: f.NomeFornecedor || '',
        UnidadeMedida: f.UnidadeMedida || '',
        Entradas: entradas,
        Saidas: saidas,
        SaldoAtual: saldo,
        DataAtualizacao: f.DataAtualizacao || it.lastModifiedDateTime || '',
      };
    });

    // Caso existam entradas/saídas de itens não cadastrados em Produtos, inclui também
    const ensureKey = new Set(rows.map(r => r.Title));
    for (const [title, entradas] of entMap.entries()) {
      if (!ensureKey.has(title)) {
        const saidas = saiMap.get(title) || 0;
        rows.push({
          Title: title,
          CodigoFornecedor: '',
          DescricaoProduto: '',
          NomeFornecedor: '',
          UnidadeMedida: '',
          Entradas: entradas,
          Saidas: saidas,
          SaldoAtual: entradas - saidas,
          DataAtualizacao: '',
        });
      }
    }

    // Ordena por título
    rows.sort((a, b) => a.Title.localeCompare(b.Title, 'pt-BR'));

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ rows });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
