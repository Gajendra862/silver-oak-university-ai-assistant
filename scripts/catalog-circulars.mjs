import * as cheerio from 'cheerio';

async function catalogCirculars() {
  const circularPaths = [
    '/circulars/academic',
    '/circulars/exam',
    '/circulars/exam/TT-Intermediate-Exam-Summer-2026',
    '/circulars/exam/TT-MSE-Winter-2025',
    '/circulars/exam/TT-ESE-Sem357-Winter-2025',
    '/circulars/exam/TT-ESE-Sem2468-Winter-2025',
    '/circulars/exam/TT-Intermediate-Exam-Winter-2025',
    '/circulars/exam/TT-ESE-Summer-2025',
    '/circulars/exam/TT-MSE-Summer-2025',
    '/circulars/academic/academic-calendar-2024-25',
    '/circulars/academic/academic-calendar-2026-27'
  ];

  const results = [];

  for (const p of circularPaths) {
    try {
      const res = await fetch('https://silveroakuni.ac.in' + p, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const $ = cheerio.load(html);
      const title = $('title').text().trim() || $('h1, h2').first().text().trim();
      const pdfs = [];
      $('a[href]').each((_, el) => {
        const h = $(el).attr('href');
        const t = $(el).text().trim();
        if (h && (h.includes('.pdf') || /circular|exam|academic|calendar/i.test(h))) {
          pdfs.push({ title: t || h.split('/').pop(), url: h.startsWith('http') ? h : 'https://silveroakuni.ac.in' + h });
        }
      });
      console.log(`Path: ${p} | PDFs: ${pdfs.length}`);
      results.push({ path: p, title, pdfs });
    } catch (e) {
      console.error(p, e.message);
    }
  }
}

catalogCirculars().catch(console.error);
