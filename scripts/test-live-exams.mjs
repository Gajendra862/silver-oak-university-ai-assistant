async function testLiveExams() {
  const coursesRes = await fetch('https://sapiou.silveroakuni.ac.in/v1/courses?pageSize=100', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const coursesJson = await coursesRes.json();
  const socca = coursesJson.data.filter(c => c.college_id === 1);
  console.log('SOCCA courses:');
  socca.forEach(c => console.log(` - ID: ${c.id}, Name: ${c.name}, Key: ${c.key}`));

  if (socca.length > 0) {
    const cid = socca[0].id;
    console.log(`Querying exams for college_id=1, course_id=${cid} (${socca[0].name})...`);
    const examRes = await fetch(`https://sapiou.silveroakuni.ac.in/v1/exams?college_id=1&course_id=${cid}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const examJson = await examRes.json();
    console.log('Exam API Result:', examJson);
  }
}

testLiveExams().catch(console.error);
