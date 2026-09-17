import * as cheerio from 'cheerio';

async function inspectCircular() {
  const url = 'https://silveroakuni.ac.in/circulars/exam/TT-Intermediate-Exam-Summer-2026';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  $('script, style, nav, footer').remove();
  console.log('Title:', $('title').text().trim());
  console.log('Text:', $('body').text().replace(/\s+/g, ' ').slice(0, 1500));
  const links = [];
  $('a[href]').each((_, el) => {
    const h = $(el).attr('href');
    if (h && (h.includes('.pdf') || h.includes('drive') || h.includes('timetable') || h.includes('exam'))) {
      links.push({ text: $(el).text().trim(), href: h });
    }
  });
  console.log('Links:', links);
}

inspectCircular().catch(console.error);
