import { UniversityBranch, CollegeInfo } from '../types';

export type DegreeFilterOption = 'all' | 'Bachelor' | 'Master' | 'Diploma' | 'Doctor' | 'PhD' | 'PharmD' | 'Other';

export interface NormalizedProgram {
  id: string;
  name: string;
  normalizedName: string;
  degreeLevel: 'Bachelor' | 'Master' | 'Diploma' | 'Doctor' | 'PhD' | 'PharmD' | 'Other';
  isDoctor: boolean;
  isPhD: boolean;
  isPharmD: boolean;
  programmeType: string;
  collegeId: number;
  collegeName: string;
  specialization: string;
  officialUrl: string;
  fees: string;
  duration: string;
  semesters: string;
  eligibility: string;
  teachingScheme?: string;
  credential?: string;
  raw: UniversityBranch;
}

// Abbreviation mapping to map user shorthand queries to full degree forms
const ACRONYM_MAP: Record<string, string[]> = {
  bca: ['bca', 'bachelor of computer applications', 'bachelor in computer application'],
  mca: ['mca', 'master of computer applications', 'master in computer application'],
  btech: ['btech', 'b.tech', 'b tech', 'bachelor of technology'],
  mtech: ['mtech', 'm.tech', 'm tech', 'master of technology'],
  bba: ['bba', 'bachelor of business administration'],
  mba: ['mba', 'master of business administration', 'integrated mba', 'imba'],
  bcom: ['bcom', 'b.com', 'b com', 'bachelor of commerce'],
  mcom: ['mcom', 'm.com', 'm com', 'master of commerce'],
  bsc: ['bsc', 'b.sc', 'b sc', 'bachelor of science'],
  msc: ['msc', 'm.sc', 'm sc', 'master of science'],
  bpharm: ['bpharm', 'b.pharm', 'b pharm', 'bachelor of pharmacy'],
  mpharm: ['mpharm', 'm.pharm', 'm pharm', 'master of pharmacy'],
  dpharm: ['dpharm', 'd.pharm', 'd pharm', 'diploma in pharmacy'],
  pharmd: ['pharmd', 'pharm.d', 'pharm d', 'doctor of pharmacy'],
  phd: ['phd', 'ph.d', 'ph d', 'doctor of philosophy'],
  bpt: ['bpt', 'bachelor of physiotherapy'],
  llb: ['llb', 'll.b', 'bachelor of law', 'bachelor of laws'],
  llm: ['llm', 'll.m', 'master of law', 'master of laws'],
  bvoc: ['bvoc', 'b.voc', 'b voc', 'bachelor of vocation'],
  mvoc: ['mvoc', 'm.voc', 'm voc', 'master of vocation'],
  bms: ['bms', 'bachelor of management studies'],
  mms: ['mms', 'master in management studies'],
  gnm: ['gnm', 'general nursing midwifery'],
  pgdmlt: ['pgdmlt', 'medical laboratory technician']
};

// Map abbreviation/code from syllabus paths or metadata to College ID
const ABBR_TO_COLLEGE_ID: Record<string, number> = {
  SOCCA: 1,
  SOCP: 2,
  SOIS: 3,
  SOCN: 4,
  SOIM: 5,
  SOLC: 6,
  COP: 7,
  SOIPR: 7,
  SOCOP: 7,
  'SOCOP & SOIPR': 7,
  SOCAM: 8,
  SOCC: 9,
  SOCHSS: 10,
  COET: 11,
  SOCOT: 11,
  SOILPS: 12,
  SOCAHC: 13,
  SOCVE: 14,
  SOID: 17,
  SOIBM: 18,
  SOCAT: 19
};

/**
 * Normalizes text for robust matching by lowercasing and replacing punctuation with spaces.
 * Safely handles strings, string arrays, or undefined/null values.
 */
export function normalizeText(val: any): string {
  if (!val) return '';
  const str = Array.isArray(val) ? val.join(' ') : String(val);
  return str
    .toLowerCase()
    .replace(/[.\-_&()\/|,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determines the constituent college ID for a branch using official university mapping rules
 */
export function determineCollegeId(b: UniversityBranch): number {
  if (b.college_id && !isNaN(Number(b.college_id)) && Number(b.college_id) > 0) {
    return Number(b.college_id);
  }

  // 1. From syllabus URL path (e.g. /syllabus/SOCCA/...)
  if (b.teachingScheme) {
    const m = b.teachingScheme.match(/\/syllabus\/([^\/]+)\//i);
    if (m && ABBR_TO_COLLEGE_ID[m[1]]) {
      return ABBR_TO_COLLEGE_ID[m[1]];
    }
  }

  const title = (b.title || '').toLowerCase();
  const slug = (b.slug || '').toLowerCase();
  const cred = typeof b.credential === 'string' ? b.credential.toLowerCase() : '';

  // 2. Paramedical / Allied & Health Care (College ID: 13)
  if (
    slug.includes('anesthesia') ||
    slug.includes('radiology') ||
    slug.includes('medical-laboratory') ||
    title.includes('anesthesia') ||
    title.includes('imaging technology') ||
    title.includes('medical laboratory technology')
  ) {
    return 13;
  }

  // 3. Aviation Technology (College ID: 19)
  if (
    (slug.includes('aeronautical') && slug.includes('ame')) ||
    slug.includes('aviation') ||
    title.includes('ame with') ||
    title.includes('aviation')
  ) {
    return 19;
  }

  // 4. Pharmacy (College ID: 7)
  if (slug.includes('pharm') || title.includes('pharmacy') || cred.includes('pharmacy')) {
    return 7;
  }

  // 5. Nursing (College ID: 4)
  if (slug.includes('nursing') || title.includes('nursing') || slug.includes('gnm') || title.includes('gnm')) {
    return 4;
  }

  // 6. Physiotherapy (College ID: 2)
  if (slug.includes('physiotherapy') || title.includes('physiotherapy') || slug.includes('bpt') || title.includes('bpt')) {
    return 2;
  }

  // 7. Law (College ID: 6)
  if (
    slug.includes('llb') ||
    slug.includes('llm') ||
    title.includes('ll.b') ||
    title.includes('ll.m') ||
    title.includes('bachelor of law') ||
    title.includes('master of law') ||
    title.includes('ba llb') ||
    title.includes('bba llb')
  ) {
    return 6;
  }

  // 8. Animation & Multimedia (College ID: 8) vs Vocational (College ID: 14)
  if (slug.includes('media-graphics') || slug.includes('animation') || title.includes('media graphics') || title.includes('animation')) {
    if (slug.includes('mvoc') || slug.includes('bvoc') || title.includes('b.voc') || title.includes('m.voc') || title.includes('vocation')) {
      return 14;
    }
    return 8;
  }

  // 9. Vocational Education (College ID: 14)
  if (
    slug.includes('bvoc') ||
    slug.includes('mvoc') ||
    slug.includes('vocational') ||
    title.includes('b.voc') ||
    title.includes('m.voc') ||
    title.includes('(vocational)') ||
    title.includes('vocation') ||
    slug.includes('pgdmlt') ||
    slug.includes('pgd_medial') ||
    slug.includes('ites') ||
    slug.includes('information_technology_enabled_services') ||
    slug.includes('digital_sound')
  ) {
    return 14;
  }

  // 10. Computer Application (College ID: 1) - SOCCA
  if (
    slug === 'bca' ||
    slug === 'mca' ||
    slug.includes('msc-it') ||
    slug.includes('msc-cs') ||
    slug.includes('socca') ||
    slug.includes('bsc_cs_it') ||
    title.includes('computer application') ||
    title.includes('information technology (m.sc. it)') ||
    title.includes('m.sc. in data science') ||
    title.includes('b.sc. in data science') ||
    title.includes('computer science & information technology')
  ) {
    return 1;
  }

  // 11. Engineering & Technology (College ID: 11) - COET / SOCOT
  if (
    slug.includes('btech') ||
    slug.includes('mtech') ||
    title.includes('b.tech') ||
    title.includes('m.tech') ||
    title.includes('engineering') ||
    slug.includes('engineering') ||
    slug.includes('mechanical') ||
    slug.includes('civil') ||
    slug.includes('electrical') ||
    slug.includes('chemical') ||
    slug.includes('aerospace') ||
    slug.includes('electronics-and-communication')
  ) {
    return 11;
  }

  // 12. Commerce (College ID: 9) - SOCC
  if (slug.includes('bcom') || slug.includes('mcom') || title.includes('b.com') || title.includes('m.com') || title.includes('commerce') || title.includes('accounting')) {
    return 9;
  }

  // 13. Management (College ID: 5) - SOIM / (College ID: 18) SOIBM
  if (slug.includes('mba') || slug.includes('bba') || title.includes('mba') || title.includes('bba') || title.includes('business administration') || title.includes('management studies') || slug.includes('hotel-management') || title.includes('hotel management')) {
    return 5;
  }

  // 14. Liberal Studies / Humanities & Social Science (College ID: 10) - SOCHSS
  if (slug.includes('psychology') || slug.includes('english') || title.includes('psychology') || title.includes('english') || slug.includes('civil-services') || title.includes('public administration') || title.includes('arts (hons)')) {
    return 10;
  }

  // 15. Science (College ID: 3) - SOIS
  if (slug.includes('physics') || slug.includes('chemistry') || slug.includes('mathematics') || slug.includes('microbiology') || slug.includes('biotechnology') || slug.includes('forensic-science') || title.includes('physics') || title.includes('chemistry') || title.includes('mathematics') || title.includes('microbiology') || title.includes('biotechnology') || title.includes('forensic science') || title.includes('science')) {
    return 3;
  }

  return 11;
}

/**
 * Classifies degree level in a data-driven way based on programme credentials, title, and slug
 */
export function classifyDegree(b: UniversityBranch): {
  level: 'Bachelor' | 'Master' | 'Diploma' | 'Doctor' | 'PhD' | 'PharmD' | 'Other';
  isDoctor: boolean;
  isPhD: boolean;
  isPharmD: boolean;
  programmeType: string;
} {
  const title = (b.title || '').toLowerCase();
  const slug = (b.slug || '').toLowerCase();
  const cred = typeof b.credential === 'string' ? b.credential.toLowerCase() : '';

  // 1. Ph.D vs Pharm.D
  const isPhD =
    /\bph\.?d\b/i.test(title) ||
    /\bph\.?d\b/i.test(slug) ||
    /\bdoctor of philosophy\b/i.test(title) ||
    /\bdoctor of philosophy\b/i.test(cred);

  const isPharmD =
    /\bpharm\.?d\b/i.test(title) ||
    /\bpharm\.?d\b/i.test(slug) ||
    /\bdoctor of pharmacy\b/i.test(title) ||
    /\bdoctor of pharmacy\b/i.test(cred);

  if (isPhD) {
    return { level: 'PhD', isDoctor: true, isPhD: true, isPharmD: false, programmeType: 'Doctorate (Ph.D)' };
  }
  if (isPharmD) {
    return { level: 'PharmD', isDoctor: true, isPhD: false, isPharmD: true, programmeType: 'Doctor of Pharmacy (Pharm.D)' };
  }

  // Other Doctor
  if (/\bdoctor\b/i.test(title) || /\bdoctoral\b/i.test(cred)) {
    return { level: 'Doctor', isDoctor: true, isPhD: false, isPharmD: false, programmeType: 'Doctoral Degree' };
  }

  // 2. Diploma
  const isDiploma =
    /\bdiploma\b/i.test(title) ||
    /\bdiploma\b/i.test(slug) ||
    /\bdiploma\b/i.test(cred) ||
    /\bd\.?\s*pharm\b/i.test(title) ||
    /\bd\.?\s*pharm\b/i.test(slug) ||
    /\bpgd\b/i.test(title) ||
    /\bpgdmlt\b/i.test(title) ||
    /\bpgdmlt\b/i.test(slug) ||
    /\bgnm\b/i.test(title) ||
    /\bgnm\b/i.test(slug);

  if (isDiploma) {
    return { level: 'Diploma', isDoctor: false, isPhD: false, isPharmD: false, programmeType: 'Diploma' };
  }

  // 3. Master / Postgraduate
  const isMaster =
    /\bmaster\b/i.test(title) ||
    /\bmaster\b/i.test(slug) ||
    /\bmaster\b/i.test(cred) ||
    /\bpostgraduate\b/i.test(cred) ||
    /\bm\.?\s*tech\b/i.test(title) ||
    /\bm\.?\s*tech\b/i.test(slug) ||
    /\bmca\b/i.test(title) ||
    /\bmca\b/i.test(slug) ||
    /\bmba\b/i.test(title) ||
    /\bmba\b/i.test(slug) ||
    /\bimba\b/i.test(title) ||
    /\bm\.?\s*sc\b/i.test(title) ||
    /\bm\.?\s*sc\b/i.test(slug) ||
    /\bm\.?\s*com\b/i.test(title) ||
    /\bm\.?\s*com\b/i.test(slug) ||
    /\bm\.?\s*pharm\b/i.test(title) ||
    /\bm\.?\s*pharm\b/i.test(slug) ||
    /\bll\.?\s*m\b/i.test(title) ||
    /\bll\.?\s*m\b/i.test(slug) ||
    /\bma\b/i.test(title) ||
    /\bm\.?\s*voc\b/i.test(title) ||
    /\bm\.?\s*voc\b/i.test(slug) ||
    /\bmms\b/i.test(title) ||
    /\bmms\b/i.test(slug);

  if (isMaster) {
    return { level: 'Master', isDoctor: false, isPhD: false, isPharmD: false, programmeType: 'Postgraduate (Master)' };
  }

  // 4. Bachelor / Undergraduate
  const isBachelor =
    /\bbachelor\b/i.test(title) ||
    /\bbachelor\b/i.test(slug) ||
    /\bbachelor\b/i.test(cred) ||
    /\bundergraduate\b/i.test(cred) ||
    /\bb\.?\s*tech\b/i.test(title) ||
    /\bb\.?\s*tech\b/i.test(slug) ||
    /\bbca\b/i.test(title) ||
    /\bbca\b/i.test(slug) ||
    /\bbba\b/i.test(title) ||
    /\bbba\b/i.test(slug) ||
    /\bb\.?\s*sc\b/i.test(title) ||
    /\bb\.?\s*sc\b/i.test(slug) ||
    /\bb\.?\s*com\b/i.test(title) ||
    /\bb\.?\s*com\b/i.test(slug) ||
    /\bb\.?\s*pharm\b/i.test(title) ||
    /\bb\.?\s*pharm\b/i.test(slug) ||
    /\bbpt\b/i.test(title) ||
    /\bbpt\b/i.test(slug) ||
    /\bba\b/i.test(title) ||
    /\bb\.?\s*voc\b/i.test(title) ||
    /\bb\.?\s*voc\b/i.test(slug) ||
    /\bllb\b/i.test(title) ||
    /\bllb\b/i.test(slug) ||
    /\bll\.?\s*b\b/i.test(title) ||
    /\bbms\b/i.test(title) ||
    /\bbms\b/i.test(slug) ||
    slug.includes('ame_with_btech') ||
    title.includes('electronics and communication engineering') ||
    title.includes('media graphics and animation');

  if (isBachelor) {
    return { level: 'Bachelor', isDoctor: false, isPhD: false, isPharmD: false, programmeType: 'Undergraduate (Bachelor)' };
  }

  return { level: 'Other', isDoctor: false, isPhD: false, isPharmD: false, programmeType: 'Other / Unclassified' };
}

/**
 * Transforms and deduplicates raw branches into NormalizedProgram records
 */
export function normalizeProgrammes(branches: UniversityBranch[], colleges: CollegeInfo[]): NormalizedProgram[] {
  const collegeMap = new Map<number, string>();
  for (const c of colleges) {
    collegeMap.set(c.id, c.name);
  }

  const seenIds = new Set<string>();
  const normalized: NormalizedProgram[] = [];

  for (const b of branches) {
    const rawId = b.slug || b.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (seenIds.has(rawId)) {
      continue; // Remove duplicate records
    }
    seenIds.add(rawId);

    const collegeId = determineCollegeId(b);
    const collegeName = collegeMap.get(collegeId) || colleges.find(c => c.id === collegeId)?.name || 'Constituent College';
    const classification = classifyDegree(b);

    // Extract clean specialization from title or description
    let specialization = '';
    const inMatch = b.title.match(/in\s+([^–|()]+)/i);
    if (inMatch) {
      specialization = inMatch[1].trim();
    }

    normalized.push({
      id: rawId,
      name: b.title,
      normalizedName: normalizeText(b.title),
      degreeLevel: classification.level,
      isDoctor: classification.isDoctor,
      isPhD: classification.isPhD,
      isPharmD: classification.isPharmD,
      programmeType: classification.programmeType,
      collegeId,
      collegeName,
      specialization,
      officialUrl: b.url || `https://silveroakuni.ac.in/branches/${b.slug || ''}`,
      fees: b.fees || '',
      duration: b.duration || '',
      semesters: b.semesters || '',
      eligibility: b.eligibility || '',
      teachingScheme: b.teachingScheme,
      credential: Array.isArray(b.credential) ? b.credential.join(', ') : (b.credential || ''),
      raw: b
    });
  }

  return normalized;
}

/**
 * Central Filtering Function
 * Flow:
 * all programmes -> search filter -> degree filter -> college filter -> remove duplicates -> sort results -> display results
 */
export function getFilteredProgrammes(
  programmes: NormalizedProgram[],
  searchQuery: string,
  selectedDegree: DegreeFilterOption | string,
  selectedCollege: string
): NormalizedProgram[] {
  const qRaw = (searchQuery || '').trim().toLowerCase();
  const qNorm = normalizeText(qRaw);
  const qCompact = qNorm.replace(/\s+/g, '');

  const expansions = ACRONYM_MAP[qCompact] || [];

  // Filter and score
  const scoredItems: { program: NormalizedProgram; score: number }[] = [];

  for (const p of programmes) {
    // 1. College Filter (AND condition)
    if (selectedCollege !== 'all' && p.collegeId.toString() !== selectedCollege.toString()) {
      continue;
    }

    // 2. Degree Filter (AND condition)
    if (selectedDegree !== 'all') {
      if (selectedDegree === 'Bachelor' && p.degreeLevel !== 'Bachelor') {
        continue;
      }
      if (selectedDegree === 'Master' && p.degreeLevel !== 'Master') {
        continue;
      }
      if (selectedDegree === 'Diploma' && p.degreeLevel !== 'Diploma') {
        continue;
      }
      if (selectedDegree === 'Doctor' && !p.isDoctor) {
        continue;
      }
      if (selectedDegree === 'PhD' && !p.isPhD) {
        continue;
      }
      if (selectedDegree === 'PharmD' && !p.isPharmD) {
        continue;
      }
      if (selectedDegree === 'Other' && p.degreeLevel !== 'Other') {
        continue;
      }
    }

    // 3. Search Filter (AND condition)
    if (!qRaw) {
      scoredItems.push({ program: p, score: 1 });
      continue;
    }

    let score = 0;
    const titleNorm = p.normalizedName;
    const titleWords = titleNorm.split(' ');
    const slugNorm = normalizeText(p.id);
    const credNorm = normalizeText(p.credential || '');
    const specNorm = normalizeText(p.specialization);

    // Expansion match (e.g. searching 'bca', 'b.pharm', 'mba')
    if (expansions.length > 0) {
      for (const exp of expansions) {
        if (titleNorm === exp || slugNorm === exp) {
          score = Math.max(score, 1000);
        } else if (titleNorm.startsWith(exp)) {
          score = Math.max(score, 800);
        } else if (titleNorm.includes(exp)) {
          score = Math.max(score, 600);
        } else if (slugNorm.includes(exp)) {
          score = Math.max(score, 500);
        } else if (credNorm.includes(exp)) {
          score = Math.max(score, 400);
        }
      }
    }

    // Exact title or slug match
    if (titleNorm === qNorm || slugNorm === qNorm) {
      score = Math.max(score, 1000);
    } else if (titleNorm.startsWith(qNorm)) {
      score = Math.max(score, 700);
    } else if (titleWords.includes(qNorm)) {
      score = Math.max(score, 500);
    } else if (titleNorm.includes(qNorm)) {
      score = Math.max(score, 300);
    } else if (slugNorm.includes(qNorm)) {
      score = Math.max(score, 200);
    } else if (specNorm && specNorm.includes(qNorm)) {
      score = Math.max(score, 180);
    } else if (credNorm.includes(qNorm)) {
      score = Math.max(score, 150);
    }

    // Compact token match (e.g. btech matches b tech)
    if (score === 0 && qCompact.length >= 3) {
      const titleCompact = titleNorm.replace(/\s+/g, '');
      if (titleCompact.includes(qCompact)) {
        score = 250;
      }
    }

    // Boundary protection for short acronyms like bca, mca, mba, bba, llb, bpt
    if (qCompact.length <= 4 && score > 0 && expansions.length === 0) {
      const isWord =
        titleWords.includes(qNorm) ||
        slugNorm.split(' ').includes(qNorm) ||
        titleNorm.includes(`(${qNorm})`);
      if (!isWord) {
        score = 0;
      }
    }

    if (score > 0) {
      scoredItems.push({ program: p, score });
    }
  }

  // Sort results: highest relevance score first when searching, otherwise default order
  if (qRaw) {
    scoredItems.sort((a, b) => b.score - a.score);
  }

  return scoredItems.map((s) => s.program);
}
