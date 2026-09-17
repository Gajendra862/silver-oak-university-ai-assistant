import * as cheerio from 'cheerio';
import fs from 'fs';

async function crawlUniversityInfo() {
  console.log('Crawling colleges, general info, and circulars...');

  // 1. Colleges from API
  let colleges = [];
  try {
    const res = await fetch('https://sapiou.silveroakuni.ac.in/v1/colleges?pageSize=50', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const json = await res.json();
    if (json.data) colleges = json.data;
  } catch (e) {
    console.error('Error fetching colleges:', e.message);
  }
  console.log(`Fetched ${colleges.length} colleges`);

  // 2. Exam dropdown hierarchy
  let examDropdowns = [];
  try {
    const res = await fetch('https://sapiou.silveroakuni.ac.in/v1/exams/dropdowns', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const json = await res.json();
    if (json.data) examDropdowns = json.data;
  } catch (e) {
    console.error('Error fetching exam dropdowns:', e.message);
  }
  console.log(`Fetched exam dropdowns for ${examDropdowns.length} colleges`);

  // 3. Admission & Contact info from homepage and contact page
  let contactInfo = {
    address: 'Opp. Bhagwat Vidyapith, S.G. Highway, Gota, Ahmedabad, Gujarat - 382481',
    admissionHelpline: '+91 7966046300 / +91 9099063464',
    email: 'info@silveroakuni.ac.in',
    admissionEmail: 'admission@silveroakuni.ac.in',
    website: 'https://silveroakuni.ac.in',
    campusFacilities: [
      'Central Library & E-Resource Center',
      'High-Tech Computer Labs & Apple iOS Lab',
      'Ignite Incubation Centre & Startup Cell',
      'Boys & Girls Hostels with Mess Facility',
      'Transportation (Bus facility across Ahmedabad & Gandhinagar)',
      'Sports Complex, Cricket Ground, Gymnasium',
      'Auditoriums & Seminar Halls',
      'Cafeteria & Food Courts'
    ],
    approvals: [
      'University Grants Commission (UGC) Recognized State Private University',
      'NAAC Accredited "A" Grade',
      'All India Council for Technical Education (AICTE) Approved',
      'Pharmacy Council of India (PCI) Approved',
      'Bar Council of India (BCI) Approved',
      'Gujarat Nursing Council (GNC) Approved'
    ]
  };

  // 4. Circulars & Exam timetables
  const circulars = [];
  const circularUrls = [
    { title: 'Timetable of Intermediate Examination - Summer 2026', path: '/circulars/exam/TT-Intermediate-Exam-Summer-2026' },
    { title: 'Timetable of Mid Semester Examination (MSE) - Winter 2025', path: '/circulars/exam/TT-MSE-Winter-2025' },
    { title: 'Timetable of End Semester Examination (ESE Sem 3, 5, 7) - Winter 2025', path: '/circulars/exam/TT-ESE-Sem357-Winter-2025' },
    { title: 'Timetable of End Semester Examination (ESE Sem 2, 4, 6, 8) - Winter 2025', path: '/circulars/exam/TT-ESE-Sem2468-Winter-2025' },
    { title: 'Timetable of End Semester Examination (ESE) - Summer 2025', path: '/circulars/exam/TT-ESE-Summer-2025' },
    { title: 'Academic Calendar 2026-27', path: '/circulars/academic/academic-calendar-2026-27' },
    { title: 'Academic Calendar 2024-25', path: '/circulars/academic/academic-calendar-2024-25' }
  ];

  for (const c of circularUrls) {
    try {
      const res = await fetch('https://silveroakuni.ac.in' + c.path, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const $ = cheerio.load(html);
      const pdfs = [];
      $('a[href]').each((_, el) => {
        const h = $(el).attr('href');
        const t = $(el).text().trim();
        if (h && h.includes('.pdf')) {
          pdfs.push({
            name: t || h.split('/').pop() || 'PDF Document',
            url: h.startsWith('http') ? h : 'https://silveroakuni.ac.in' + h
          });
        }
      });
      circulars.push({
        title: c.title,
        path: c.path,
        url: 'https://silveroakuni.ac.in' + c.path,
        pdfCount: pdfs.length,
        pdfs: pdfs
      });
    } catch (e) {
      console.error('Error fetching circular:', c.path, e.message);
    }
  }

  const universityData = {
    colleges,
    examDropdowns,
    contactInfo,
    circulars,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync('./server/data/university.json', JSON.stringify(universityData, null, 2));
  console.log('Saved university structure to ./server/data/university.json');
}

crawlUniversityInfo().catch(console.error);
