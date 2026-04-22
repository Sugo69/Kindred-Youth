module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { url } = req.body ?? {};
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Missing or invalid URL' });

    let parsedUrl;
    try { parsedUrl = new URL(url); } catch { return res.status(400).json({ error: 'URL is not valid' }); }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: 'Only HTTP/HTTPS URLs are allowed' });
    }

    let response;
    try {
        response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (FamilyFeudApp/1.0)' },
            signal: AbortSignal.timeout(10000),
        });
    } catch (err) {
        return res.status(502).json({ error: `Could not reach URL: ${err.message}` });
    }

    if (!response.ok) return res.status(502).json({ error: `Remote server returned ${response.status}` });

    const html = await response.text();
    const title = extractPageTitle(html);
    const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .slice(0, 8000);

    return res.status(200).json({ text, title, sourceUrl: url });
};

function extractPageTitle(html) {
    const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    const tw = html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i);
    const tt = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const raw = (og?.[1] || tw?.[1] || tt?.[1] || '').trim();
    return cleanTitle(decodeEntities(raw));
}

function decodeEntities(s) {
    const map = { amp:'&', quot:'"', apos:"'", lsquo:'\u2018', rsquo:'\u2019', ldquo:'\u201C', rdquo:'\u201D', mdash:'\u2014', ndash:'\u2013', hellip:'\u2026', nbsp:' ', lt:'<', gt:'>' };
    return s.replace(/&(#?\w+);/g, (_, e) => {
        if (map[e]) return map[e];
        if (e.startsWith('#x')) return String.fromCharCode(parseInt(e.slice(2), 16));
        if (e.startsWith('#')) return String.fromCharCode(parseInt(e.slice(1), 10));
        return '';
    });
}

function cleanTitle(s) {
    return s
        .replace(/\s*\|\s*The Church of Jesus Christ of Latter-day Saints\s*$/i, '')
        .replace(/\s*\|\s*ChurchofJesusChrist\.org\s*$/i, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}
