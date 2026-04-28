export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || req.headers['x-admin-key'] !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const content = req.body;
  if (!content || typeof content !== 'object') {
    return res.status(400).json({ error: 'Invalid body' });
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.REPO_OWNER || 'pdrrr3';
  const repo  = process.env.REPO_NAME  || 'dc-article';
  const path  = 'content.json';
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'dc-article-cms',
  };

  const getRes = await fetch(apiBase, { headers });
  if (!getRes.ok) {
    return res.status(500).json({ error: 'Could not fetch current file from GitHub' });
  }
  const { sha } = await getRes.json();

  const newContent = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
  const putRes = await fetch(apiBase, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ message: 'cms: update content', content: newContent, sha }),
  });

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    return res.status(500).json({ error: 'GitHub commit failed', details: err.message });
  }

  return res.json({ success: true });
}
