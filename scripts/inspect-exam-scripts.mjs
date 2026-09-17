import * as cheerio from 'cheerio';

async function inspectExamScripts() {
  const res = await fetch('https://silveroakuni.ac.in/exam-timetable', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  $('script').each((i, el) => {
    const src = $(el).attr('src');
    const content = $(el).html();
    if (src) console.log('Script src:', src);
    if (content && (content.includes('fetch') || content.includes('ajax') || content.includes('api') || content.includes('timetable') || content.includes('exam'))) {
      console.log('Script inline snippet:', content.slice(0, 500));
    }
  });
}

inspectExamScripts().catch(console.error);
