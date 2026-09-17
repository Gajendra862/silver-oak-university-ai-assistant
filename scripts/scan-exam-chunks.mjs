import * as cheerio from 'cheerio';

async function scanChunks() {
  const res = await fetch('https://silveroakuni.ac.in/exam-timetable', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  const scripts = $('script[src]').map((_, el) => $(el).attr('src')).get();

  for (const src of scripts) {
    if (!src.includes('_next')) continue;
    const url = 'https://silveroakuni.ac.in' + src;
    const js = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text());
    const v1Matches = js.match(/\/v1\/[a-zA-Z0-9_\-\/]+/g);
    if (v1Matches) {
      console.log(`In ${src}:`, [...new Set(v1Matches)]);
    }
  }
}

scanChunks().catch(console.error);
