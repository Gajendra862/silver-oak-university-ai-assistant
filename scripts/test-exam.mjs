import * as cheerio from 'cheerio';

async function testExam() {
  const res = await fetch('https://silveroakuni.ac.in/exam-timetable', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  $('script, style, nav, footer').remove();
  console.log('Exam timetable text snippet:');
  console.log($('body').text().replace(/\s+/g, ' ').slice(0, 1500));
  console.log('Select elements:');
  $('select').each((_, el) => {
    console.log('Select name/id:', $(el).attr('name') || $(el).attr('id'), 'Options count:', $(el).find('option').length);
    const opts = $(el).find('option').map((_, opt) => $(opt).text().trim()).get();
    console.log('Options sample:', opts.slice(0, 5));
  });
}

testExam().catch(console.error);
