import * as cheerio from 'cheerio';

async function testCirculars() {
  for (const path of ['/circulars/academic', '/circulars/exam', '/exam-timetable', '/academic-council', '/admission-guideline']) {
    try {
      const res = await fetch('https://silveroakuni.ac.in' + path, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const $ = cheerio.load(html);
      const pdfs = [];
      $('a[href]').each((_, el) => {
        const h = $(el).attr('href');
        if (h && (h.includes('.pdf') || /circular|exam|timetable|syllabus|calendar/i.test(h))) {
          pdfs.push({ text: $(el).text().trim(), href: h });
        }
      });
      console.log('Path:', path, 'Count:', pdfs.length);
      console.log('Sample:', pdfs.slice(0, 6));
    } catch (e) {
      console.error(path, e.message);
    }
  }
}

testCirculars().catch(console.error);
