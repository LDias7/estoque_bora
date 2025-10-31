export default async function handler(req, res) {
  try {
    const {
      TENANT_ID,
      CLIENT_ID,
      CLIENT_SECRET,
      SITE_ID,
      LIST_PRODUTOS = 'Produtos',
      LIST_ENTRADAS = 'Entrada',
      LIST_SAIDAS   = 'Saídas',
    } = process.env;

    if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET || !SITE_ID) {
      return res.status(500).json({ error: 'Missing env vars (TENANT_ID, CLIENT_ID, CLIENT_SECRET, SITE_ID)' });
    }

    // 1) Token
    const tokenResp = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    });
    const tokenData = await tokenResp.json();
    if (!tokenResp.ok || !tokenData.access_token) {
      return res.status(tokenResp.status || 500).json({ error: 'token_error', details: tokenData });
    }
    const token = tokenData.access_token;

    // 2) Utilitário: paginação Graph
    async function graphGetAll(urlPath) {
      const out = [];
      let next = `https://graph.microsoft.com/v1.0${urlPath}`;
      while (next) {
        const r = await fetch(next, { headers: { Authorization: `Bearer ${token}` } });
        const data = await r.json();
        if (!r.ok) throw new Error(JSON.stringify(data));
        out.push(...(data.value || []));
        next = data['@odata.nextLink'] || null;
      }
      return out;
    }

    // 3) Busca listas
    const encSite = encodeURIComponent(SITE_ID);
    const [prod, ent, sai] = await Promise.all([
      graphGetAll(`/sites/${encSite}/lists/${encodeURIComponent(LIST_PRODUTOS)}/items?expand=fields&$top=5000`),
      graphGetAll(`/sites/${encSite}/lists/${encodeURIComponent(LIST_ENTRADAS)}/items?expand=fields&$top=5000`),
      graphGetAll(`/sites/${encSite}/lists/${encodeURIComponent(LIST_SAIDAS)}/items?expand=fields&$top=5000`),
    ]);

    // 4) Normaliza números
    const toNum = (v) => {
      if (v === null || v === undefined) return 0;
      const s = String(v).replace(/\./g, '').replace(',', '.');
      const n = Number(s);
      return Number.isFinite(n) ? n : 0;
    };

    // 5) Soma entradas/saídas por Title
    const sumByTitle = (rows, qtyField = 'Quantidade') => {
      const map = new Map();
      for (const it of rows) {
        const f = it.fields || {};
        const key = (f.Title || '').trim();
        if (!key) continue;
        const q = toNum(f[qtyField]);
        map.set(key, (map.get(key) || 0) + q);
      }
      return map;
    };
    const entMap = sumByTitle(ent);
    const saiMap = sumByTitle(sai);

    // 6) Consolida com Produtos
    const rows = (prod || []).map((it) => {
      const f = it.fields || {};
      const title = (f.Title || '').trim();
      const entradas = entMap.get(title) || 0;
      const saidas   = saiMap.get(title) || 0;
      const saldo    = entradas - saidas;
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

    // Itens sem cadastro em Produtos mas presentes em entradas/saídas
    const have = new Set(rows.map(r => r.Title));
    for (const [title, entradas] of entMap.entries()) {
      if (!have.has(title)) {
        const saidas = saiMap.get(title) || 0;
        rows.push({
          Title: title, CodigoFornecedor:'', DescricaoProduto:'', NomeFornecedor:'', UnidadeMedida:'',
          Entradas: entradas, Saidas: saidas, SaldoAtual: entradas - saidas, DataAtualizacao: ''
        });
      }
    }

    rows.sort((a,b)=>a.Title.localeCompare(b.Title,'pt-BR'));

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ rows });
  } catch (e) {
    // Sempre devolva JSON (nunca HTML)
    return res.status(500).json({ error: 'server_error', details: String(e) });
  }
}
