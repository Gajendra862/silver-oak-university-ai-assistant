import * as cheerio from 'cheerio';

async function analyze() {
  const url = 'https://silveroakuni.ac.in/branches/bca';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);

  console.log('=== JSON-LD Scripts ===');
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}');
      console.log(`JSON-LD #${i}:`, JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('JSON-LD parse error:', e.message);
    }
  });

  console.log('=== Headings & Paragraphs ===');
  $('h1, h2, h3, h4').each((_, el) => {
    const heading = $(el).text().trim();
    const nextText = $(el).next().text().replace(/\s+/g, ' ').trim();
    if (heading && nextText) {
      console.log(`[${heading}] -> ${nextText.slice(0, 200)}`);
    }
  });

  console.log('=== All links containing pdf or syllabus ===');
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    if (href && (href.includes('.pdf') || /syllabus|curriculum|scheme|teaching/i.test(href) || /syllabus|curriculum|scheme|teaching/i.test(text))) {
      console.log(`Link: text="${text}", href="${href}"`);
    }
  });
}

async function checkBranches() {
  const branches = [
    'computer-science-engineering',
    'btech-electronics-communication',
    'mechanical',
    'physiotherapy',
    'diploma-general-nursing-midwifery',
    'bachelor-of-management-studies',
    'integrated-master-of-business-administration',
    'chemistry-master'
  ];

  for (const b of branches) {
    const url = 'https://silveroakuni.ac.in/branches/' + b;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const $ = cheerio.load(html);
      let teachingScheme = '';
      $('a').each((_, el) => {
        const t = $(el).text().trim();
        if (/teaching scheme|syllabus|curriculum/i.test(t)) {
          teachingScheme = $(el).attr('href') || '';
        }
      });
      let feesDur = '';
      $('h1, h2, h3, h4').each((_, el) => {
        const text = $(el).text().trim();
        if (/duration|fees|eligibility/i.test(text)) {
          feesDur += text + ': ' + $(el).next().text().replace(/\s+/g, ' ').trim().slice(0, 100) + ' | ';
        }
      });
      console.log('COURSE:', b);
      console.log(' Title:', $('title').text().trim());
      console.log(' Info:', feesDur);
      console.log(' Scheme:', teachingScheme);
      console.log('-----------------------------------------');
    } catch (e) {
      console.error(b, e.message);
    }
  }
}

checkBranches().catch(console.error);
