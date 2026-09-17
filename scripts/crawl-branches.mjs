import * as cheerio from 'cheerio';
import fs from 'fs';

async function crawlAllBranches() {
  console.log('Fetching sitemap.xml...');
  const xml = await fetch('https://silveroakuni.ac.in/sitemap.xml', { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text());
  const urls = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g)).map(m => m[1]);
  const branchUrls = urls.filter(u => u.includes('/branches/'));
  console.log(`Found ${branchUrls.length} branch URLs in sitemap`);

  const branches = [];
  const concurrency = 8;
  for (let i = 0; i < branchUrls.length; i += concurrency) {
    const batch = branchUrls.slice(i, i + concurrency);
    const promises = batch.map(async url => {
      try {
        const slug = url.split('/branches/').pop();
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) return null;
        const html = await res.text();
        const $ = cheerio.load(html);

        // JSON-LD
        let jsonLd = null;
        $('script[type="application/ld+json"]').each((_, el) => {
          try {
            const parsed = JSON.parse($(el).html() || '{}');
            if (parsed['@type'] === 'Course' || parsed.name) jsonLd = parsed;
          } catch (e) {}
        });

        // Title
        const title = $('h1').first().text().trim() || $('title').text().replace('– Silver Oak University', '').trim();

        // Teaching Scheme link
        let teachingScheme = '';
        $('a[href]').each((_, el) => {
          const t = $(el).text().trim();
          const h = $(el).attr('href');
          if (/teaching scheme|syllabus|curriculum/i.test(t)) {
            teachingScheme = h;
          }
        });

        // Eligibility
        let eligibility = '';
        $('h1, h2, h3, h4').each((_, el) => {
          if (/eligibility/i.test($(el).text())) {
            eligibility = $(el).next().text().replace(/\s+/g, ' ').trim();
          }
        });
        if (!eligibility && jsonLd?.educationalPrerequisite) {
          eligibility = jsonLd.educationalPrerequisite;
        }

        // Fees and duration
        let fees = '';
        let duration = '';
        let semesters = '';
        $('h1, h2, h3, h4').each((_, el) => {
          const t = $(el).text().trim();
          if (/course duration & fees/i.test(t)) {
            const next = $(el).next().text().replace(/\s+/g, ' ').trim();
            const feeMatch = next.match(/([0-9,]+\s*INR[^\n\r]*)/i) || next.match(/(INR\s*[0-9,]+[^\n\r]*)/i);
            if (feeMatch) fees = feeMatch[0];
            const durMatch = next.match(/(\d+\/?\d*\s*Years?)/i);
            if (durMatch) duration = durMatch[0];
            const semMatch = next.match(/(\d+\/?\d*\s*Semesters?)/i);
            if (semMatch) semesters = semMatch[0];
            if (!fees) fees = next;
          }
        });

        return {
          slug,
          url,
          title: jsonLd?.name || title,
          description: jsonLd?.description || '',
          eligibility,
          fees,
          duration,
          semesters,
          teachingScheme,
          credential: jsonLd?.educationalCredentialAwarded || '',
          lastCrawled: new Date().toISOString()
        };
      } catch (err) {
        console.error(`Error on ${url}:`, err.message);
        return null;
      }
    });

    const batchResults = await Promise.all(promises);
    for (const r of batchResults) {
      if (r) branches.push(r);
    }
    console.log(`Processed ${branches.length}/${branchUrls.length} branches...`);
  }

  console.log(`Successfully crawled ${branches.length} branches!`);
  fs.mkdirSync('./server/data', { recursive: true });
  fs.writeFileSync('./server/data/branches.json', JSON.stringify(branches, null, 2));
  console.log('Saved to ./server/data/branches.json');
}

crawlAllBranches().catch(console.error);
