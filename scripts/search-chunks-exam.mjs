import * as cheerio from 'cheerio';

async function searchInAllChunks() {
  const res = await fetch('https://silveroakuni.ac.in/exam-timetable', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  const scripts = $('script[src]').map((_, el) => $(el).attr('src')).get();

  for (const src of scripts) {
    if (!src.includes('_next')) continue;
    const url = 'https://silveroakuni.ac.in' + src;
    const js = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text());
    if (js.includes('college_id') || js.includes('course_id') || js.includes('exams?')) {
      console.log(`Found in ${src}:`);
      const idx = js.indexOf('college_id');
      if (idx !== -1) {
        console.log('Context around college_id:\n', js.slice(Math.max(0, idx - 100), idx + 200));
      }
    }
  }
}

searchInAllChunks().catch(console.error);
