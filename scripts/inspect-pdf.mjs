import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

async function checkPdf() {
  const url = 'https://sapiou.silveroakuni.ac.in/syllabus/SOCCA/bca/BCA_T.S..pdf';
  console.log('Fetching PDF from:', url);
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const buf = Buffer.from(await res.arrayBuffer());
  console.log('PDF buffer size:', buf.length);
  const data = await pdf(buf);
  console.log('Pages:', data.numpages);
  console.log('Info:', data.info);
  console.log('Text preview (first 1500 chars):\n', data.text.slice(0, 1500));
}

checkPdf().catch(console.error);
