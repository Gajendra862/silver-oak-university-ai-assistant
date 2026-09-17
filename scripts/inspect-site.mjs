import * as cheerio from 'cheerio';

async function checkBCA() {
  const res = await fetch('https://silveroakuni.ac.in/branches/bca', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  console.log('BCA page status:', res.status, 'len:', html.length);
  
  const $ = cheerio.load(html);
  console.log('Title:', $('title').text().trim());
  
  const pdfs = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && href.includes('.pdf')) pdfs.push(href);
  });
  console.log('PDFs:', pdfs);
  
  const headings = [];
  $('h1, h2, h3, h4, h5').each((_, el) => {
    const t = $(el).text().trim();
    if (t) headings.push(t);
  });
  console.log('Headings:', headings);

  // Search for keywords like eligibility, duration, syllabus, fees, subjects
  const bodyText = $('body').text().replace(/\s+/g, ' ');
  console.log('Body snippet (1500 chars):', bodyText.slice(0, 1500));
}

checkBCA().catch(console.error);
