export default async function handler(req, res) {
  try {
    const tenant = process.env.TENANT_ID;
    const client = process.env.CLIENT_ID;
    const secret = process.env.CLIENT_SECRET;

    if (!tenant || !client || !secret) {
      return res.status(500).json({ error: 'Missing env vars' });
    }

    const body = new URLSearchParams({
      client_id: client,
      client_secret: secret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    const r = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ access_token: data.access_token, expires_in: data.expires_in });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
