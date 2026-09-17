async function testBranchesEndpoints() {
  const tests = [
    'https://sapiou.silveroakuni.ac.in/v1/branches?course_id=50',
    'https://sapiou.silveroakuni.ac.in/v1/courses/50/branches',
    'https://sapiou.silveroakuni.ac.in/v1/course-branches?course_id=50',
    'https://sapiou.silveroakuni.ac.in/v1/branches-list?course_id=50',
    'https://sapiou.silveroakuni.ac.in/v1/branch?course_id=50',
    'https://silveroakuni.ac.in/api/branches',
    'https://silveroakuni.ac.in/api/courses',
    'https://silveroakuni.ac.in/api/colleges',
    'https://silveroakuni.ac.in/api/exams'
  ];

  for (const u of tests) {
    try {
      const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } });
      const json = await res.json().catch(() => null);
      console.log(u, res.status, json ? (json.message || json.status || JSON.stringify(json).slice(0, 80)) : 'not json');
    } catch (e) {
      console.log(u, 'ERR:', e.message);
    }
  }
}

testBranchesEndpoints().catch(console.error);
