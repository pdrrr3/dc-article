export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body || {};
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey || password !== adminKey) {
    return res.status(401).json({ error: 'Wrong password' });
  }

  return res.json({ key: adminKey });
}
