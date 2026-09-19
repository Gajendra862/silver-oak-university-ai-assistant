import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { UniversityBranch, CollegeInfo, ExamScheduleItem, SourceCitation } from '../src/types';
import { courseResolver, CourseResolutionResult } from './course-resolver';
import { programmeSyncService } from './programme-sync';

export interface RetrievedDocument {
  title: string;
  url: string;
  type: SourceCitation['type'];
  content: string;
  snippet: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}

class UniversityDataManager {
  private branches: UniversityBranch[] = [];
  private colleges: CollegeInfo[] = [];
  private examSchedules: ExamScheduleItem[] = [];
  private circulars: any[] = [];
  private contactInfo: any = null;
  private isLoaded = false;

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      const dataDir = path.join(process.cwd(), 'server', 'data');
      if (fs.existsSync(path.join(dataDir, 'branches.json'))) {
        const rawBranches = JSON.parse(fs.readFileSync(path.join(dataDir, 'branches.json'), 'utf8'));
        this.branches = rawBranches.map((b: any) => ({
          ...b,
          college_id: b.college_id || this.mapCollegeIdForBranch(b)
        }));
      }
      if (fs.existsSync(path.join(dataDir, 'university.json'))) {
        const uni = JSON.parse(fs.readFileSync(path.join(dataDir, 'university.json'), 'utf8'));
        this.colleges = uni.colleges || [];
        this.circulars = uni.circulars || [];
        this.contactInfo = uni.contactInfo || null;
      }
      if (fs.existsSync(path.join(dataDir, 'exam-schedules.json'))) {
        this.examSchedules = JSON.parse(fs.readFileSync(path.join(dataDir, 'exam-schedules.json'), 'utf8'));
      }
      this.isLoaded = true;
      console.log(`[DataManager] Loaded ${this.branches.length} branches, ${this.colleges.length} colleges, ${this.examSchedules.length} exam schedules, ${this.circulars.length} circular categories.`);
    } catch (e: any) {
      console.error('[DataManager] Error loading initial data:', e.message);
    }
  }

  private mapCollegeIdForBranch(b: any): number {
    const abbrMap: Record<string, number> = {
      'SOCCA': 1,
      'SOCP': 2,
      'SOIS': 3,
      'SOCN': 4,
      'SOIM': 5,
      'SOLC': 6,
      'COP': 7,
      'SOIPR': 7,
      'SOCOP': 7,
      'SOCOP & SOIPR': 7,
      'SOCAM': 8,
      'SOCC': 9,
      'SOCHSS': 10,
      'COET': 11,
      'SOCOT': 11,
      'SOILPS': 12,
      'SOCAHC': 13,
      'SOCVE': 14,
      'SOID': 17,
      'SOIBM': 18,
      'SOCAT': 19
    };

    if (b.teachingScheme) {
      const m = b.teachingScheme.match(/\/syllabus\/([^\/]+)\//i);
      if (m && abbrMap[m[1]]) {
        return abbrMap[m[1]];
      }
    }

    const title = (b.title || '').toLowerCase();
    const slug = (b.slug || '').toLowerCase();
    const cred = typeof b.credential === 'string' ? b.credential.toLowerCase() : '';

    if (slug.includes('anesthesia') || slug.includes('radiology') || slug.includes('medical-laboratory') ||
        title.includes('anesthesia') || title.includes('imaging technology') || title.includes('medical laboratory technology')) {
      return 13;
    }
    if ((slug.includes('aeronautical') && slug.includes('ame')) || slug.includes('aviation') || title.includes('ame with') || title.includes('aviation')) {
      return 19;
    }
    if (slug.includes('pharm') || title.includes('pharmacy') || cred.includes('pharmacy')) {
      return 7;
    }
    if (slug.includes('nursing') || title.includes('nursing') || slug.includes('gnm') || title.includes('gnm')) {
      return 4;
    }
    if (slug.includes('physiotherapy') || title.includes('physiotherapy') || slug.includes('bpt') || title.includes('bpt')) {
      return 2;
    }
    if (slug.includes('llb') || slug.includes('llm') || title.includes('ll.b') || title.includes('ll.m') || title.includes('bachelor of law') || title.includes('master of law') || title.includes('ba llb') || title.includes('bba llb')) {
      return 6;
    }
    if (slug.includes('media-graphics') || slug.includes('animation') || title.includes('media graphics') || title.includes('animation')) {
      if (slug.includes('mvoc') || slug.includes('bvoc') || title.includes('b.voc') || title.includes('m.voc') || title.includes('vocation')) {
        return 14;
      }
      return 8;
    }
    if (slug.includes('bvoc') || slug.includes('mvoc') || slug.includes('vocational') || title.includes('b.voc') || title.includes('m.voc') || title.includes('(vocational)') || title.includes('vocation') || slug.includes('pgdmlt') || slug.includes('pgd_medial') || slug.includes('ites') || slug.includes('information_technology_enabled_services') || slug.includes('digital_sound')) {
      return 14;
    }
    if (slug === 'bca' || slug === 'mca' || slug.includes('msc-it') || slug.includes('msc-cs') || slug.includes('socca') || slug.includes('bsc_cs_it') || title.includes('computer application') || title.includes('information technology (m.sc. it)') || title.includes('m.sc. in data science') || title.includes('b.sc. in data science') || title.includes('computer science & information technology')) {
      return 1;
    }
    if (slug.includes('btech') || slug.includes('mtech') || title.includes('b.tech') || title.includes('m.tech') || title.includes('engineering') || slug.includes('engineering') || slug.includes('mechanical') || slug.includes('civil') || slug.includes('electrical') || slug.includes('chemical') || slug.includes('aerospace') || slug.includes('electronics-and-communication')) {
      return 11;
    }
    if (slug.includes('bcom') || slug.includes('mcom') || title.includes('b.com') || title.includes('m.com') || title.includes('commerce') || title.includes('accounting')) {
      return 9;
    }
    if (slug.includes('mba') || slug.includes('bba') || title.includes('mba') || title.includes('bba') || title.includes('business administration') || title.includes('management studies') || slug.includes('hotel-management') || title.includes('hotel management')) {
      return 5;
    }
    if (slug.includes('psychology') || slug.includes('english') || title.includes('psychology') || title.includes('english') || slug.includes('civil-services') || title.includes('public administration') || title.includes('arts (hons)')) {
      return 10;
    }
    if (slug.includes('physics') || slug.includes('chemistry') || slug.includes('mathematics') || slug.includes('microbiology') || slug.includes('biotechnology') || slug.includes('forensic-science') || title.includes('physics') || title.includes('chemistry') || title.includes('mathematics') || title.includes('microbiology') || title.includes('biotechnology') || title.includes('forensic science') || title.includes('science')) {
      return 3;
    }

    return 11;
  }

  public getStats() {
    const activeBranches = this.getBranches();
    const activeColleges = this.getColleges();
    const meta = programmeSyncService.getMetadata();
    return {
      branchesCount: activeBranches.length,
      collegesCount: activeColleges.length,
      examSchedulesCount: this.examSchedules.length,
      circularsCount: this.circulars.length,
      lastUpdated: meta.lastSuccessfulSync || new Date().toISOString(),
      lastSuccessfulSync: meta.lastSuccessfulSync,
      catalogueVersion: meta.version,
      syncStatus: meta.syncStatus,
      syncMessage: meta.syncMessage
    };
  }

  public getColleges(): CollegeInfo[] {
    const synced = programmeSyncService.getCollegesAsCollegeInfo();
    if (synced && synced.length > 0) {
      this.colleges = synced;
      return synced;
    }
    return this.colleges;
  }

  public getBranches(): UniversityBranch[] {
    const synced = programmeSyncService.getBranchesAsUniversityBranch();
    if (synced && synced.length > 0) {
      this.branches = synced;
      courseResolver.updateBranches(synced);
      return synced;
    }
    return this.branches;
  }

  /**
   * Primary multi-source retrieval engine
   * Retrieves strictly official Silver Oak University sources based on query and resolved course
   */
  public async retrieveRelevantDocs(
    query: string,
    resolution?: CourseResolutionResult
  ): Promise<{ docs: RetrievedDocument[]; expandedQueries: string[]; failedSources: string[] }> {
    const rawQuery = query.toLowerCase().trim();
    const courseRes = resolution || courseResolver.resolve(query);
    const expandedQueries = this.expandQuery(rawQuery);

    if (courseRes.isCourseQuery && courseRes.status === 'RESOLVED') {
      for (const name of courseRes.resolvedOfficialNames) {
        expandedQueries.push(name.toLowerCase());
        expandedQueries.push(`${name.toLowerCase()} fees eligibility syllabus duration admission`);
      }
    }

    const results: RetrievedDocument[] = [];
    const failedSources: string[] = [];

    // Normalize terms for matching from both raw and expanded queries
    const tokens = Array.from(new Set([
      ...rawQuery.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/),
      ...expandedQueries.join(' ').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    ])).filter(t => t.length > 1);

    // 1. Check Contact & General Campus Info
    if (this.contactInfo && (
      rawQuery.includes('contact') || rawQuery.includes('address') || rawQuery.includes('phone') || 
      rawQuery.includes('helpline') || rawQuery.includes('email') || rawQuery.includes('location') ||
      rawQuery.includes('where is') || rawQuery.includes('hostel') || rawQuery.includes('bus') || 
      rawQuery.includes('transport') || rawQuery.includes('approval') || rawQuery.includes('ugc') || 
      rawQuery.includes('aicte') || rawQuery.includes('naac') || rawQuery.includes('sports')
    )) {
      results.push({
        title: 'Silver Oak University - Official Contact & Campus Facilities',
        url: 'https://silveroakuni.ac.in/contact',
        type: 'official_contact',
        content: `Official Address: ${this.contactInfo.address}
Admission Helpline: ${this.contactInfo.admissionHelpline}
Official Email: ${this.contactInfo.email}
Admission Email: ${this.contactInfo.admissionEmail}
Official Website: https://silveroakuni.ac.in
Approvals & Accreditation:
${this.contactInfo.approvals?.map((a: string) => `- ${a}`).join('\n')}
Campus Facilities:
${this.contactInfo.campusFacilities?.map((f: string) => `- ${f}`).join('\n')}`,
        snippet: `Silver Oak University official campus: ${this.contactInfo.address}. Helpline: ${this.contactInfo.admissionHelpline}`,
        relevanceScore: 35
      });
    }

    // 2. Search Branches (Course catalog, eligibility, fees, duration, semesters, teaching schemes)
    const activeBranches = this.getBranches();
    for (const b of activeBranches) {
      let score = 0;
      const bTitle = typeof b.title === 'string' ? b.title.toLowerCase() : '';
      const bSlug = typeof b.slug === 'string' ? b.slug.toLowerCase().replace(/[-_]/g, ' ') : '';
      const bDesc = typeof b.description === 'string' ? b.description.toLowerCase() : '';
      const bCred = typeof b.credential === 'string' ? b.credential.toLowerCase() : '';

      // Check if branch matches resolved course
      const isResolvedMatch = courseRes.status === 'RESOLVED' && 
        courseRes.matchingBranches.some(mb => mb.slug === b.slug || mb.title.toLowerCase() === bTitle);

      if (isResolvedMatch) {
        score += 60; // High priority boost for the exact resolved Silver Oak University program
      }

      // Exact title match or abbreviation
      if (rawQuery.includes(b.slug) || (bSlug.length > 3 && rawQuery.includes(bSlug))) score += 15;
      if (rawQuery.includes(bTitle)) score += 20;

      // Abbreviation checks
      if (/\bbca\b/i.test(rawQuery) && (bTitle.includes('bca') || bSlug.includes('bca') || bTitle.includes('computer application'))) score += 12;
      if (/\bmca\b/i.test(rawQuery) && (bTitle.includes('mca') || bSlug.includes('mca'))) score += 12;
      if (/\bb\.?tech\b/i.test(rawQuery) && (bTitle.includes('b.tech') || bTitle.includes('technology') || bSlug.includes('btech'))) score += 10;
      if (/\bmba\b/i.test(rawQuery) && (bTitle.includes('mba') || bSlug.includes('mba') || bTitle.includes('business administration'))) score += 12;
      if (/\bbba\b/i.test(rawQuery) && (bTitle.includes('bba') || bSlug.includes('bba'))) score += 12;
      if (/\bpharmacy\b|\bb\.?pharm\b|\bd\.?pharm\b/i.test(rawQuery) && (bTitle.includes('pharm') || bSlug.includes('pharm'))) score += 12;
      if (/\bnursing\b|\bgnm\b|\bb\.?sc nursing\b/i.test(rawQuery) && (bTitle.includes('nursing') || bSlug.includes('nursing') || bTitle.includes('gnm'))) score += 12;
      if (/\bphysiotherapy\b|\bbpt\b/i.test(rawQuery) && (bTitle.includes('physiotherapy') || bSlug.includes('physiotherapy'))) score += 14;
      if (/\blaw\b|\bllb\b|\bba llb\b|\bbba llb\b/i.test(rawQuery) && (bTitle.includes('law') || bTitle.includes('llb') || bSlug.includes('law'))) score += 12;
      if (/\baviation\b/i.test(rawQuery) && (bTitle.includes('aviation') || bSlug.includes('aviation'))) score += 12;
      if (/\bdesign\b|\bb\.?des\b/i.test(rawQuery) && (bTitle.includes('design') || bSlug.includes('design'))) score += 12;

      // Field match
      for (const t of tokens) {
        if (t.length > 2) {
          if (bTitle.includes(t)) score += 3;
          if (bSlug.includes(t)) score += 3;
          if (bDesc.includes(t)) score += 1;
        }
      }

      // If user asks for fees, eligibility, syllabus, duration
      if (score > 4) {
        const collegesListStr = b.colleges && b.colleges.length > 0
          ? b.colleges.map((c: any) => `${c.name} (${c.abbreviation || ''})`).join(', ')
          : 'Silver Oak University';

        let snippetText = `Course: ${b.title}. Offered by: ${collegesListStr}. Duration: ${b.duration || 'N/A'}. Fees: ${b.fees || 'Check official portal'}. Eligibility: ${b.eligibility || 'Check official guidelines'}.`;
        if (b.teachingScheme) {
          snippetText += ` Teaching Scheme/Syllabus Document: ${b.teachingScheme}`;
        }
        results.push({
          title: `Silver Oak University - ${b.title}`,
          url: b.url,
          type: 'web_page',
          content: `Course Title: ${b.title}
Official URL: ${b.url}
Constituent College(s) Offering This Program: ${collegesListStr}
Awarded Credential: ${b.credential || b.title}
Eligibility Criteria: ${b.eligibility || 'Refer to official admission guidelines'}
Course Duration: ${b.duration || 'N/A'} (${b.semesters || 'N/A'})
Tuition Fees: ${b.fees || 'Refer to official fee circular'}
Description: ${b.description || 'Program offered at Silver Oak University.'}
${b.teachingScheme ? `Teaching Scheme / Syllabus: ${b.teachingScheme}` : ''}`,
          snippet: snippetText,
          relevanceScore: score,
          metadata: { branch: b }
        });

        // If syllabus requested and teaching scheme exists, add dedicated syllabus source
        if (isResolvedMatch && b.teachingScheme && (
          rawQuery.includes('syllabus') || rawQuery.includes('subject') || rawQuery.includes('teaching scheme') || 
          rawQuery.includes('curriculum') || rawQuery.includes('અભ્યાસક્રમ') || rawQuery.includes('पाठ्यक्रम')
        )) {
          results.push({
            title: `Official Teaching Scheme / Syllabus - ${b.title}`,
            url: b.teachingScheme,
            type: 'curriculum_pdf',
            content: `Official Teaching Scheme & Syllabus Document for ${b.title}
University: Silver Oak University
Constituent College(s): ${collegesListStr}
College ID: ${b.college_id}
Document URL: ${b.teachingScheme}
Program Duration: ${b.duration || 'N/A'} (${b.semesters || 'N/A'})
Official Program Page: ${b.url}`,
            snippet: `Official Teaching Scheme and Syllabus PDF for ${b.title}: ${b.teachingScheme}`,
            relevanceScore: score + 5,
            metadata: { branch: b }
          });
        }
      }
    }

    // 3. Search Colleges
    const activeColleges = this.getColleges();
    for (const c of activeColleges) {
      let score = 0;
      const cName = (c.display_name || c.name || '').toLowerCase();
      const cAbbr = (c.abbreviation || '').toLowerCase();
      if (rawQuery.includes(cAbbr) && cAbbr.length >= 3) score += 12;
      if (rawQuery.includes(cName)) score += 10;
      for (const t of tokens) {
        if (t.length > 3 && cName.includes(t)) score += 2;
      }
      if (score > 3) {
        const matchingPrograms = activeBranches.filter(b =>
          b.colleges?.some(col => col.id.toString() === c.id.toString()) ||
          b.college_id?.toString() === c.id.toString()
        );

        let progListText = '';
        if (matchingPrograms.length > 0) {
          progListText = `\nPrograms offered under this college/institute:\n` +
            matchingPrograms.slice(0, 20).map(p => `- ${p.title} (${p.credential || p.duration || ''})`).join('\n');
        }

        results.push({
          title: `Silver Oak University - ${c.display_name || c.name} (${c.abbreviation})`,
          url: c.external_website_url || `https://silveroakuni.ac.in/colleges`,
          type: 'web_page',
          content: `Constituent College: ${c.name}
Abbreviation: ${c.abbreviation}
Display Name: ${c.display_name}
${c.external_website_url ? `Official Portal: ${c.external_website_url}` : 'Official Campus: Silver Oak University Ahmedabad'}${progListText}`,
          snippet: `Constituent College: ${c.display_name} (${c.abbreviation}) at Silver Oak University. ${matchingPrograms.length} programs offered.`,
          relevanceScore: score
        });
      }
    }

    // 4. Search Exam Schedules & Timetables
    const isExamQuery = rawQuery.includes('exam') || rawQuery.includes('timetable') || rawQuery.includes('time table') || 
                        rawQuery.includes('schedule') || rawQuery.includes('date sheet') || rawQuery.includes('datesheet') ||
                        rawQuery.includes('when is') || rawQuery.includes('mid sem') || rawQuery.includes('end sem') ||
                        rawQuery.includes('ese') || rawQuery.includes('mse') || rawQuery.includes('intermediate') ||
                        expandedQueries.some(eq => eq.includes('exam') || eq.includes('timetable') || eq.includes('schedule'));

    if (isExamQuery || tokens.some(t => ['date', 'time', 'timing', 'test'].includes(t))) {
      for (const ex of this.examSchedules) {
        let score = 0;
        const exTitle = ex.title.toLowerCase();
        const exContent = ex.content.toLowerCase();

        // Exact term matches
        for (const t of tokens) {
          if (t.length > 2) {
            if (exTitle.includes(t)) score += 4;
            if (exContent.includes(t)) score += 2;
          }
        }

        // Program matches in exam content
        if (/\bbca\b/i.test(rawQuery) && (exTitle.includes('socca') || exTitle.includes('bca') || exContent.includes('bca'))) score += 12;
        if (/\bb\.?tech\b/i.test(rawQuery) && (exTitle.includes('btech') || exContent.includes('b.tech'))) score += 12;
        if (/\bmba\b/i.test(rawQuery) && (exTitle.includes('mba') || exContent.includes('mba'))) score += 12;
        if (/\bbba\b/i.test(rawQuery) && (exTitle.includes('bba') || exContent.includes('bba'))) score += 12;
        if (/\bb\.?sc\b/i.test(rawQuery) && (exTitle.includes('bsc') || exContent.includes('b.sc'))) score += 10;
        if (/\bm\.?sc\b/i.test(rawQuery) && (exTitle.includes('msc') || exContent.includes('m.sc'))) score += 10;
        if (/\bdiploma\b/i.test(rawQuery) && (exTitle.includes('diploma') || exContent.includes('diploma'))) score += 12;
        if (/\blaw\b|\bllb\b/i.test(rawQuery) && (exTitle.includes('law') || exTitle.includes('solc') || exContent.includes('law'))) score += 12;

        // Semester matches
        const semMatch = rawQuery.match(/sem(?:ester)?\s*([1-8])/i);
        if (semMatch) {
          const semNum = semMatch[1];
          if (exTitle.includes(`sem${semNum}`) || exTitle.includes(`semester ${semNum}`) || exContent.includes(`sem: ${semNum}`) || exContent.includes(`semester: ${semNum}`)) {
            score += 15;
          }
        }

        if (score > 5) {
          // Extract matching excerpt around keywords
          const excerpt = this.extractRelevantExcerpt(ex.content, tokens);
          results.push({
            title: `Official Exam Schedule - ${ex.title} (${ex.session})`,
            url: ex.url,
            type: 'exam_timetable',
            content: `Document Title: ${ex.title}
Session: ${ex.session}
Exam Type: ${ex.examType}
Official Document URL: ${ex.url}
Timetable Schedule Content:
${ex.content.slice(0, 3000)}`,
            snippet: excerpt,
            relevanceScore: score + 5
          });
        }
      }

      // Also include general circulars links
      for (const circ of this.circulars) {
        if (circ.path.includes('exam')) {
          results.push({
            title: `Silver Oak University Official Circular: ${circ.title}`,
            url: circ.url,
            type: 'circular',
            content: `Official Circular: ${circ.title}
URL: ${circ.url}
Total Published Official PDFs: ${circ.pdfCount}
Includes schedules for colleges such as SOCOT, SOCCA, SOIM, SOIS, SOCP, SOLC, SOCAT, SOCVE.`,
            snippet: `${circ.title} published on Silver Oak University portal with ${circ.pdfCount} schedule PDFs.`,
            relevanceScore: 4
          });
        }
      }
    }

    // Sort by relevance score descending and take top 6 most relevant documents
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const topResults = results.slice(0, 6);

    return {
      docs: topResults,
      expandedQueries,
      failedSources
    };
  }

  private expandQuery(query: string): string[] {
    const expansions: string[] = [query];
    let q = query.toLowerCase();

    // Map Gujarati/Devanagari numerals to standard digits
    const gujDigits: Record<string, string> = { '૧': '1', '૨': '2', '૩': '3', '૪': '4', '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9', '૦': '0' };
    const devDigits: Record<string, string> = { '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9', '०': '0' };
    for (const [k, v] of Object.entries(gujDigits)) q = q.replaceAll(k, v);
    for (const [k, v] of Object.entries(devDigits)) q = q.replaceAll(k, v);

    // Common Hindi and Gujarati academic terms mapping
    const academicTermsMap: Record<string, string> = {
      'બીટેક': 'b.tech engineering',
      'बीटेक': 'b.tech engineering',
      'કમ્પ્યુટર': 'computer',
      'कंप्यूटर': 'computer',
      'એન્જિનિયરિંગ': 'engineering',
      'इंजीनियरिंग': 'engineering',
      'મિકેનિકલ': 'mechanical',
      'मैकेनिकल': 'mechanical',
      'સિવિલ': 'civil',
      'सिविल': 'civil',
      'ઇલેક્ટ્રિકલ': 'electrical',
      'इलेक्ट्रिकल': 'electrical',
      'આઈટી': 'information technology',
      'आईटी': 'information technology',
      'ફાર્મસી': 'pharmacy b.pharm',
      'फार्मेसी': 'pharmacy b.pharm',
      'નર્સિંગ': 'nursing b.sc gnm',
      'नर्सिंग': 'nursing b.sc gnm',
      'ફિઝિયોથેરાપી': 'physiotherapy bpt',
      'फिजियोथेरेपी': 'physiotherapy bpt',
      'કાયદો': 'law llb',
      'लॉ': 'law llb',
      'મેનેજમેન્ટ': 'management mba bba',
      'मैनेजमेंट': 'management mba bba',
      'સાયન્સ': 'science b.sc m.sc',
      'साइंस': 'science b.sc m.sc',
      'કોમર્સ': 'commerce b.com m.com',
      'कॉमर्स': 'commerce b.com m.com',
      'બીસીએ': 'bca computer application',
      'बीसीए': 'bca computer application',
      'એમસીએ': 'mca computer application',
      'एमसीए': 'mca computer application',
      'એમબીએ': 'mba',
      'एमबीए': 'mba',
      'બીબીએ': 'bba',
      'बीबीए': 'bba',
      'હોસ્ટેલ': 'hostel',
      'हॉस्टल': 'hostel',
      'પ્લેસમેન્ટ': 'placement recruiter package',
      'प्लेसमेंट': 'placement recruiter package'
    };

    for (const [key, val] of Object.entries(academicTermsMap)) {
      if (q.includes(key)) {
        expansions.push(val);
      }
    }

    const isExam = q.includes('exam') || q.includes('timetable') || q.includes('time table') || 
                   q.includes('schedule') || q.includes('પરીક્ષા') || q.includes('परीक्षा') || 
                   q.includes('pariksha') || q.includes('kare chhe') || q.includes('kab hoga');
    if (isExam) {
      expansions.push('examination schedule intermediate assessment end semester winter summer timetable exam');
    }

    const isFee = q.includes('fee') || q.includes('fees') || q.includes('paisa') || q.includes('kharch') || 
                  q.includes('kitni') || q.includes('ફી') || q.includes('फीस');
    if (isFee) {
      expansions.push('fees per annum tuition cost');
    }

    const isAdmission = q.includes('admission') || q.includes('dakhila') || q.includes('apply') || 
                        q.includes('eligibility') || q.includes('laykat') || q.includes('પ્રવેશ') || 
                        q.includes('દાખલા') || q.includes('प्रवेश');
    if (isAdmission) {
      expansions.push('admission eligibility criteria educational prerequisite');
    }

    const isSyllabus = q.includes('syllabus') || q.includes('subject') || q.includes('course') || 
                       q.includes('topics') || q.includes('teaching scheme') || q.includes('અભ્યાસક્રમ') || 
                       q.includes('વિષયો') || q.includes('पाठ्यक्रम') || q.includes('विषय');
    if (isSyllabus) {
      expansions.push('teaching scheme curriculum syllabus subjects');
    }

    // Semester mapping
    const semMatch = q.match(/(?:sem|semester|સેમેસ્ટર|सेमेस्टर)\s*([1-8])/i);
    if (semMatch) {
      expansions.push(`sem${semMatch[1]}`);
      expansions.push(`semester ${semMatch[1]}`);
    }

    return expansions;
  }

  private extractRelevantExcerpt(text: string, tokens: string[]): string {
    const lower = text.toLowerCase();
    for (const t of tokens) {
      if (t.length > 3) {
        const idx = lower.indexOf(t);
        if (idx !== -1) {
          const start = Math.max(0, idx - 80);
          const end = Math.min(text.length, idx + 180);
          return text.slice(start, end).replace(/\s+/g, ' ').trim() + '...';
        }
      }
    }
    return text.slice(0, 200).replace(/\s+/g, ' ').trim() + '...';
  }
}

export const universityDataManager = new UniversityDataManager();
