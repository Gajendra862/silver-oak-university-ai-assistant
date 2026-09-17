async function checkDropdowns() {
  const res = await fetch('https://sapiou.silveroakuni.ac.in/v1/exams/dropdowns', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const d = await res.json();
  console.log('DROPDOWNS STATUS:', d.status, d.code, d.message);
  console.log('DROPDOWNS KEYS:', Object.keys(d.data || {}));
  if (d.data) {
    for (const k of Object.keys(d.data)) {
      console.log(` - ${k}: count=${Array.isArray(d.data[k]) ? d.data[k].length : typeof d.data[k]}`);
      if (Array.isArray(d.data[k])) {
        console.log(`   Sample ${k}:`, JSON.stringify(d.data[k].slice(0, 2)));
      }
    }
  }
}

checkDropdowns().catch(console.error);
