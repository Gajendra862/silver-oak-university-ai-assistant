async function findApisInChunks() {
  const chunks = ['4206', '7970', '8173', '2469', '5060', '1409', '8441', '1517', '7358'];
  const res = await fetch('https://silveroakuni.ac.in/exam-timetable', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  
  // Find full script paths
  for (const c of chunks) {
    const regex = new RegExp(`static/chunks/[^"]*${c}[^"]*\\.js`, 'g');
    const matches = html.match(regex) || [];
    for (const m of matches) {
      const u = 'https://silveroakuni.ac.in/_next/' + m;
      const js = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text());
      const sapiouIdx = js.indexOf('sapiou');
      if (sapiouIdx !== -1) {
        console.log(`In ${m} sapiou at ${sapiouIdx}:`, js.slice(Math.max(0, sapiouIdx - 50), sapiouIdx + 200));
      }
      // search for /exam or /timetable or /college
      const apiMatches = js.match(/\/v1\/[a-zA-Z0-9_\-\/]+/g) || [];
      if (apiMatches.length > 0) {
        console.log(`In ${m} API matches:`, [...new Set(apiMatches)]);
      }
    }
  }
}

findApisInChunks().catch(console.error);
