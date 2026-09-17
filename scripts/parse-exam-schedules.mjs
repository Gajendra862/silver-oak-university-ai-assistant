import fs from 'fs';
import { PDFParse } from 'pdf-parse';

async function parseSummer2026Timetables() {
  console.log('Parsing Summer 2026 exam PDFs...');
  const uni = JSON.parse(fs.readFileSync('./server/data/university.json', 'utf8'));
  const summerCircular = uni.circulars.find(c => c.path.includes('TT-Intermediate-Exam-Summer-2026'));
  if (!summerCircular) {
    console.error('Summer circular not found');
    return;
  }

  const parsedExams = [];

  for (const pdfItem of summerCircular.pdfs) {
    if (!pdfItem.url.endsWith('.pdf')) continue;
    try {
      console.log(`Fetching PDF: ${pdfItem.name} (${pdfItem.url})...`);
      const res = await fetch(pdfItem.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) {
        console.warn(`Failed to fetch ${pdfItem.url}: ${res.status}`);
        continue;
      }
      const buffer = new Uint8Array(await res.arrayBuffer());
      const parser = new PDFParse(buffer);
      await parser.load();
      const textResult = await parser.getText();
      const text = textResult.text || '';
      await parser.destroy();

      parsedExams.push({
        title: pdfItem.name,
        url: pdfItem.url,
        session: 'Summer-2026',
        examType: 'Intermediate Assessment Examination',
        content: text.replace(/\t+/g, ' ').replace(/[ ]{2,}/g, ' ').trim()
      });
      console.log(`Parsed ${pdfItem.name}: ${text.length} characters`);
    } catch (e) {
      console.error(`Error parsing ${pdfItem.name}:`, e.message);
    }
  }

  fs.writeFileSync('./server/data/exam-schedules.json', JSON.stringify(parsedExams, null, 2));
  console.log(`Successfully parsed and saved ${parsedExams.length} exam schedules!`);
}

parseSummer2026Timetables().catch(console.error);
