import fs from 'fs';
import path from 'path';
import { UniversityBranch, CollegeInfo, ExamScheduleItem, SourceCitation, FeeStructureItem } from '../src/types';
import { courseResolver, CourseResolutionResult } from './course-resolver';
import { programmeSyncService } from './programme-sync';
import { facultyService } from './faculty-service';
import { sanitizeAndEncodeOfficialUrl, isVerifiedOfficialSource } from '../src/utils/urlHelper';

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

  public getFeeCatalogue(): {
    academicYear: string;
    totalProgramsWithFees: number;
    currency: string;
    lastVerifiedAt: string;
    fees: FeeStructureItem[];
  } {
    const branches = this.getBranches();
    const colleges = this.getColleges();

    const collegeMap = new Map<string, CollegeInfo>();
    for (const c of colleges) {
      collegeMap.set(c.id.toString(), c);
      collegeMap.set(c.name.toLowerCase(), c);
    }

    const items: FeeStructureItem[] = branches.map(b => {
      let feeAmount = 0;
      const numMatch = (b.fees || '').match(/(\d[\d,]*)/);
      if (numMatch) {
        feeAmount = parseInt(numMatch[1].replace(/,/g, ''), 10);
      }

      let feePeriod = 'Per Annum';
      if (/per\s*sem(?:ester)?/i.test(b.fees || '')) {
        feePeriod = 'Per Semester';
      } else if (/per\s*year|per\s*annum|annual/i.test(b.fees || '')) {
        feePeriod = 'Per Annum';
      }

      const feeFormatted = feeAmount > 0 ? `₹${feeAmount.toLocaleString('en-IN')}` : (b.fees || 'Official SOU Fee Structure');

      let collegeName = 'Silver Oak University';
      let collegeAbbr = 'SOU';
      let collegeId = 11;

      if (b.colleges && b.colleges.length > 0) {
        collegeName = b.colleges[0].name;
        collegeAbbr = b.colleges[0].abbreviation || 'SOU';
        collegeId = typeof b.colleges[0].id === 'number' ? b.colleges[0].id : parseInt(String(b.colleges[0].id), 10) || 11;
      } else if (b.college_id) {
        collegeId = typeof b.college_id === 'number' ? b.college_id : parseInt(String(b.college_id), 10) || 11;
        const matched = collegeMap.get(collegeId.toString());
        if (matched) {
          collegeName = matched.display_name || matched.name;
          collegeAbbr = matched.abbreviation || 'SOU';
        }
      }

      const titleLower = (b.title || '').toLowerCase();
      const slugLower = (b.slug || '').toLowerCase();

      let degreeLevel = 'Bachelor';
      if (titleLower.includes('master') || titleLower.includes('m.tech') || titleLower.includes('mca') || titleLower.includes('mba') || titleLower.includes('m.com') || titleLower.includes('m.sc') || titleLower.includes('m.des') || titleLower.includes('m.pharm') || titleLower.includes('llm') || titleLower.includes('mvoc')) {
        degreeLevel = 'Master';
      } else if (titleLower.includes('diploma') || slugLower.includes('diploma') || titleLower.includes('gnm') || titleLower.includes('d.pharm') || titleLower.includes('d.des') || titleLower.includes('pgd')) {
        degreeLevel = 'Diploma';
      } else if (titleLower.includes('doctor') || titleLower.includes('phd') || titleLower.includes('ph.d') || titleLower.includes('pharm.d')) {
        degreeLevel = 'Doctoral';
      } else if (titleLower.includes('certificate')) {
        degreeLevel = 'Certificate';
      } else if (titleLower.includes('integrated')) {
        degreeLevel = 'Integrated';
      } else if (titleLower.includes('vocation') || titleLower.includes('b.voc') || titleLower.includes('m.voc')) {
        degreeLevel = 'Vocational';
      }

      let category = 'Other';
      if (titleLower.includes('computer') || titleLower.includes('bca') || titleLower.includes('mca') || titleLower.includes('data science') || titleLower.includes('information technology') || slugLower.includes('msc-it')) {
        category = 'Computer Applications';
      } else if (titleLower.includes('technology') || titleLower.includes('b.tech') || titleLower.includes('m.tech') || titleLower.includes('engineering') || slugLower.includes('engineering')) {
        category = 'Engineering';
      } else if (titleLower.includes('management') || titleLower.includes('business') || titleLower.includes('bba') || titleLower.includes('mba') || titleLower.includes('hotel')) {
        category = 'Management';
      } else if (titleLower.includes('commerce') || titleLower.includes('b.com') || titleLower.includes('m.com') || titleLower.includes('accounting') || titleLower.includes('finance')) {
        category = 'Commerce';
      } else if (titleLower.includes('pharmacy') || titleLower.includes('pharm') || titleLower.includes('b.pharm') || titleLower.includes('d.pharm') || titleLower.includes('pharm.d')) {
        category = 'Pharmacy';
      } else if (titleLower.includes('physiotherapy') || titleLower.includes('bpt')) {
        category = 'Physiotherapy';
      } else if (titleLower.includes('nursing') || titleLower.includes('gnm')) {
        category = 'Nursing';
      } else if (titleLower.includes('design') || titleLower.includes('b.des') || titleLower.includes('interior')) {
        category = 'Design';
      } else if (titleLower.includes('law') || titleLower.includes('llb') || titleLower.includes('llm')) {
        category = 'Law';
      } else if (titleLower.includes('aviation') || titleLower.includes('ame') || titleLower.includes('cabin crew')) {
        category = 'Aviation';
      } else if (titleLower.includes('vocation') || titleLower.includes('b.voc') || titleLower.includes('m.voc') || titleLower.includes('ites') || titleLower.includes('pgdmlt') || titleLower.includes('laboratory technician') || titleLower.includes('radiology') || titleLower.includes('anesthesia')) {
        category = 'Vocational';
      } else if (titleLower.includes('science') || titleLower.includes('physics') || titleLower.includes('chemistry') || titleLower.includes('microbiology') || titleLower.includes('biotechnology')) {
        category = 'Science';
      } else if (titleLower.includes('psychology') || titleLower.includes('english') || titleLower.includes('humanities') || titleLower.includes('arts')) {
        category = 'Humanities';
      }

      return {
        id: b.slug || b.title,
        slug: b.slug,
        title: b.title,
        collegeId,
        collegeName,
        collegeAbbr,
        degreeLevel,
        degreeType: b.credential || b.degreeType,
        category,
        duration: b.duration || 'N/A',
        semesters: b.semesters || 'N/A',
        eligibility: b.eligibility || 'Check official Silver Oak University admission guidelines',
        feeRaw: b.fees || 'Official SOU Fee Structure',
        feeAmount,
        feeFormatted,
        feePeriod,
        sourceUrl: b.url || 'https://silveroakuni.ac.in/program-offered',
        syllabusUrl: b.teachingScheme,
        lastVerifiedAt: b.lastCrawled || b.lastVerifiedAt || new Date().toISOString()
      };
    });

    return {
      academicYear: '2026-2027 (Latest Available)',
      totalProgramsWithFees: items.length,
      currency: 'INR (₹)',
      lastVerifiedAt: new Date().toISOString(),
      fees: items
    };
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

    // 0. University Overview Query Handling (Requirement #3: "Silver Oak University", "SOU", "Silver Oak")
    const isOverview = courseRes.isUniversityOverview || 
      /^(?:silver\s*oak(?:\s*university)?|sou|about\s*sou|about\s*silver\s*oak(?:\s*university)?|university\s*overview)$/i.test(rawQuery) ||
      (/silver\s*oak\s*university/i.test(rawQuery) && (rawQuery.includes('overview') || rawQuery.includes('about') || rawQuery.includes('introduction') || rawQuery.split(/\s+/).length <= 4));

    if (isOverview) {
      results.push({
        title: 'Silver Oak University - Official Overview & Institutional Profile',
        url: 'https://silveroakuni.ac.in',
        type: 'web_page',
        content: `SILVER OAK UNIVERSITY - OFFICIAL INSTITUTIONAL PROFILE
Established: State Private University under Gujarat Private Universities Act (Amendment) 2019.
Recognitions & Approvals: UGC (University Grants Commission) recognized under Section 22 of UGC Act, 1956; AICTE approved technical programs; NAAC Accredited; PCI approved Pharmacy; GNC/INC approved Nursing; BCI approved Law.
Campus Location: S.G. Highway, Gota, Ahmedabad - 382481, Gujarat, India.

ACADEMIC PROGRAMS & DISCIPLINES:
- Over 120+ career-aligned undergraduate, postgraduate, diploma, doctoral (Ph.D.), and certificate programs.
- Major streams: Engineering & Technology (B.Tech, M.Tech), Computer Applications & IT (BCA, MCA, M.Sc IT, B.Sc Data Science), Management & Business (BBA, MBA, BMS), Commerce (B.Com, M.Com, Strategic Finance), Science & Paramedical (B.Sc, M.Sc, Physiotherapy BPT, Nursing GNM/B.Sc), Pharmacy (B.Pharm, D.Pharm, Pharm.D), Law (LLB, LLM, Integrated BA/BBA LLB), Design & Media (B.Des, M.Des, Media Graphics), Aviation & Aerospace (AME, B.Tech Aero), and Vocational Programs (B.Voc, PGDMLT).

17 CONSTITUENT COLLEGES & INSTITUTES:
1. Silver Oak College of Computer Application (SOCCA)
2. Silver Oak College of Engineering & Technology / College of Engineering & Technology (SOCET / COET)
3. Silver Oak Institute of Management (SOIM)
4. Silver Oak Institute of Science (SOIS)
5. Silver Oak College of Pharmacy / College of Pharmacy (COP / SOCOP)
6. Silver Oak College of Physiotherapy (SOCP)
7. Silver Oak College of Nursing (SOCN)
8. Silver Oak Law College (SOLC)
9. Silver Oak Commerce College (SOCC)
10. Silver Oak College of Animation & Multimedia (SOCAM)
11. Silver Oak College of Humanities & Social Science (SOCHSS)
12. Silver Oak Institute of Liberal & Professional Studies (SOILPS)
13. Silver Oak College of Allied and Health Care (SOCAHC)
14. Silver Oak College of Vocational Education (SOCVE)
15. Silver Oak Institute of Design (SOID)
16. Silver Oak Institute of Business Management (SOIBM)
17. Silver Oak College of Aviation Technology (SOCAT)

ADMISSIONS, ELIGIBILITY & INQUIRIES:
- Admission Helpline: +91 7966046300 / +91 9099063464
- Official Admission Email: admission@silveroakuni.ac.in
- General Email: info@silveroakuni.ac.in
- Online Admission Portal: https://admission.silveroakuni.ac.in
- Admissions are conducted on merit basis and per regulatory criteria (GUJCET/ACPC/NEET wherever applicable, or university direct merit).

OFFICIAL FEE STRUCTURE & SCHOLARSHIPS:
- Silver Oak University maintains a transparent annual fee schedule for all degree and diploma courses.
- Course fees range typically from ₹45,000 to ₹1,75,000 per annum depending on the discipline (e.g. BCA ₹82,160/year, B.Tech ₹78,000-₹85,000/year, Physiotherapy ₹85,000/year, GNM ₹79,000/year).
- Government Scholarships Accepted: MYSY (Mukhyamantri Yuva Swavalamban Yojana), Digital Gujarat Post-Matric Scholarships (SC/ST/SEBC/EWS), AICTE Pragati & Saksham schemes, and SOU Institutional merit concessions.

EXAMINATIONS & STUDENT SERVICES:
- Regular semester examinations (Winter and Summer sessions), transparent internal evaluations, online timetable publication, admit cards, and grade sheet generation via student portal.

TRAINING, PLACEMENT & RECRUITERS:
- Active Training & Placement Cell with dedicated pre-placement training, mock interviews, and industry internships.
- Top recruiters include TCS, Infosys, Wipro, Capgemini, Cognizant, Reliance, Adani, Byju's, HDFC, ICICI, and leading tech startups.

CAMPUS FACILITIES & STUDENT LIFE:
- Modern 25+ acre campus equipped with high-speed Wi-Fi, Apple Authorized Training Center / iOS Lab, supercomputing and robotics labs, centralized library with thousands of books & e-journals, separate boys & girls hostels with mess, cafeteria, multi-sport grounds, auditorium, and dedicated bus transportation network covering Ahmedabad and Gandhinagar.

IMPORTANT OFFICIAL LINKS:
- Main Official Portal: https://silveroakuni.ac.in
- Programs Offered Directory: https://silveroakuni.ac.in/program-offered
- Admission Portal: https://admission.silveroakuni.ac.in
- Syllabus & Teaching Schemes: https://silveroakuni.ac.in/syllabus`,
        snippet: 'Comprehensive official overview of Silver Oak University: 120+ programs, 17 constituent colleges, admissions, fees, placements, and campus facilities.',
        relevanceScore: 100
      });
    }

    // Normalize terms for matching from both raw and expanded queries
    const tokens = Array.from(new Set([
      ...rawQuery.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/),
      ...expandedQueries.join(' ').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    ])).filter(t => t.length > 1);

    // 0A. Faculty Member, Teaching Assignments & Document Retrieval (Requirements Parts 4-19)
    const isExplicitFacultyQuery = 
      /teach|teaches|teacher|faculty|professor|prof\b|dr\b|sir\b|madam\b|lecture|padhate|padhata|shikshak|adhyapak|kon\s*che|kon\s*hai|kon\s*padhate/i.test(rawQuery) ||
      /who\s*is\s*(?:dr|prof)?/i.test(rawQuery) ||
      /who\s*teaches/i.test(rawQuery) ||
      /satish\s*sharma|neha\s*patel|rajesh\s*verma/i.test(rawQuery);

    const isStudyNotesQuery = /notes\b|study\s*material|lecture\s*notes|class\s*notes|syllabus\s*notes/i.test(rawQuery);

    const isFacultyOrDocumentQuery = isExplicitFacultyQuery || isStudyNotesQuery;

    if (isFacultyOrDocumentQuery) {
      // 1. Detect if query is ambiguous (Part 13: e.g. "Who teaches DBMS?" without specifying programme)
      const hasExplicitProg = /\b(bca|mca|b\.?tech|btech|cse|ce|mba|bba|b\.?com|bcom|diploma)\b/i.test(rawQuery);
      const isDbmsQuery = /\bdbms\b|\bdatabase\s*management(?:\s*system)?\b/i.test(rawQuery);

      if (!hasExplicitProg && isDbmsQuery && (rawQuery.includes('who') || rawQuery.includes('teach') || rawQuery.includes('notes'))) {
        const ambiguousProgs = facultyService.checkAmbiguousSubject('dbms');
        results.push({
          title: 'Silver Oak University - Faculty Subject Disambiguation',
          url: 'https://silveroakuni.ac.in/faculty',
          type: 'official_faculty_data',
          content: `FACULTY DISAMBIGUATION REQUIRED:
The subject "Database Management System (DBMS)" is taught across multiple distinct programmes at Silver Oak University:
- BCA (Bachelor of Computer Applications - Semester 3)
- MCA (Master of Computer Application)
- B.Tech CSE (Computer Science and Engineering)

CRITICAL INSTRUCTION TO AI:
Do NOT randomly choose one programme. Clearly ask the student:
"Which programme do you mean?"
- BCA
- MCA
- B.Tech CSE

After the student specifies or selects a programme, provide only that programme's authorized faculty information.`,
          snippet: 'Disambiguation required: DBMS is taught across BCA, MCA, and B.Tech CSE programmes.',
          relevanceScore: 200
        });
      } else {
        // 2. Strict Extraction of Programme, Semester, Subject, and Faculty Name
        let targetProg: string | undefined = undefined;
        if (/\bbca\b/i.test(rawQuery)) targetProg = 'BCA';
        else if (/\bmca\b/i.test(rawQuery)) targetProg = 'MCA';
        else if (/\bb\.?tech\b|\bbtech\b|\bcse\b/i.test(rawQuery)) targetProg = 'B.Tech CSE';
        else if (/\bmba\b/i.test(rawQuery)) targetProg = 'MBA';
        else if (/\bbba\b/i.test(rawQuery)) targetProg = 'BBA';
        else if (/\bb\.?com\b|\bbcom\b/i.test(rawQuery)) targetProg = 'B.Com';

        if (!targetProg && courseRes.isCourseQuery && courseRes.status === 'RESOLVED') {
          for (const mb of courseRes.matchingBranches) {
            const slug = (mb.slug || '').toLowerCase();
            if (slug.includes('bca')) { targetProg = 'BCA'; break; }
            if (slug.includes('mca')) { targetProg = 'MCA'; break; }
            if (slug.includes('btech') || slug.includes('cse')) { targetProg = 'B.Tech CSE'; break; }
            if (slug.includes('mba')) { targetProg = 'MBA'; break; }
            if (slug.includes('bba')) { targetProg = 'BBA'; break; }
            if (slug.includes('bcom')) { targetProg = 'B.Com'; break; }
          }
        }

        let targetSem: number | undefined = undefined;
        const semMatch = rawQuery.match(/(?:sem(?:ester)?|term)\s*([1-9]|10)/i) || rawQuery.match(/([1-9]|10)(?:st|nd|rd|th)?\s*sem/i);
        if (semMatch) {
          targetSem = parseInt(semMatch[1], 10);
        }

        let targetSub: string | undefined = undefined;
        if (/\bdbms\b|\bdatabase\b/i.test(rawQuery)) targetSub = 'dbms';
        else if (/advanced\s*programming/i.test(rawQuery)) targetSub = 'advanced programming';
        else if (/web\s*tech/i.test(rawQuery)) targetSub = 'web technologies';
        else if (/artificial\s*intelligence|\bai\b/i.test(rawQuery)) targetSub = 'artificial intelligence';
        else if (/financial\s*management|\bfinance\b/i.test(rawQuery)) targetSub = 'financial management';
        else if (/marketing\s*research|\bmarketing\b/i.test(rawQuery)) targetSub = 'marketing research';

        let targetFaculty: string | undefined = undefined;
        if (/satish|sharma/i.test(rawQuery)) targetFaculty = 'Satish Sharma';
        else if (/neha|patel/i.test(rawQuery)) targetFaculty = 'Neha Patel';
        else if (/rajesh|verma/i.test(rawQuery)) targetFaculty = 'Rajesh Verma';

        const hasSpecificFilter = Boolean(targetProg || targetSub || targetFaculty);

        // Search matching assignments
        const matchingAssignments = (hasSpecificFilter || isExplicitFacultyQuery) ? facultyService.searchAssignments({
          programme: targetProg,
          semester: targetSem,
          subject: targetSub,
          facultyName: targetFaculty
        }) : [];

        // Search matching documents only if looking for study notes/materials with specific filter
        const matchingDocs = (hasSpecificFilter && isStudyNotesQuery) ? facultyService.searchDocuments({
          programme: targetProg,
          semester: targetSem,
          subject: targetSub,
          facultyName: targetFaculty
        }) : [];

        // Search matching faculty profiles
        const matchingProfiles = targetFaculty 
          ? facultyService.searchFacultyProfiles(targetFaculty) 
          : [];

        // If documents requested (e.g. "Give me BCA semester 3 DBMS notes" or "show bca dbms pdf")
        const isDocRequest = /notes|pdf|document|material|file|download|resource/i.test(rawQuery);

        if (matchingDocs.length > 0) {
          for (const doc of matchingDocs) {
            results.push({
              title: `Faculty Academic Resource: ${doc.fileTitle}`,
              url: doc.fileUrl,
              type: 'faculty_document',
              content: `FACULTY-UPLOADED ACADEMIC RESOURCE (OFFICIAL FACULTY DASHBOARD):
File Name: ${doc.fileName}
Resource Title: ${doc.fileTitle}
Programme: ${doc.programme}
Semester: ${doc.semester}
Subject: ${doc.subjectName} (${doc.subjectCode})
Uploaded by Faculty: ${doc.facultyName}
File Format: ${doc.fileType.toUpperCase()}
Description: ${doc.description || 'Official lecture notes uploaded by course faculty.'}
📄 Official Download Link: [View / Open ${doc.fileName}](${doc.fileUrl})

INSTRUCTION TO AI:
When the student asks for this document, provide the exact Programme, Semester, Subject, Faculty Name, and provide the working link:
[View / Open ${doc.fileName}](${doc.fileUrl})
NEVER fabricate a link. Only use this exact URL.`,
              snippet: `Faculty Resource for ${doc.programme} Sem ${doc.semester} ${doc.subjectName} by ${doc.facultyName}: ${doc.fileTitle}`,
              relevanceScore: isDocRequest ? 180 : 90
            });
          }
        }

        if (matchingAssignments.length > 0) {
          // Group by subject and programme
          for (const assign of matchingAssignments) {
            const linkedDocs = facultyService.getDocuments({ assignmentId: assign.id });
            const docListText = linkedDocs.length > 0
              ? linkedDocs.map(ld => `  - 📄 [${ld.fileTitle}](${ld.fileUrl}) (${ld.fileName})`).join('\n')
              : '  - No supplementary PDF documents uploaded yet.';

            results.push({
              title: `Authorized Faculty Assignment - ${assign.programme} Sem ${assign.semester} ${assign.subjectName}`,
              url: 'https://silveroakuni.ac.in/faculty',
              type: 'official_faculty_data',
              content: `AUTHORIZED FACULTY TEACHING RECORD:
Programme: ${assign.programme} (${assign.programmeTitle})
Degree Level: ${assign.degreeType}
Programme Duration: ${assign.duration} (Total Semesters: ${assign.totalSemesters})
Semester: Semester ${assign.semester}
Subject: ${assign.subjectName} (Code: ${assign.subjectCode})
Faculty Member: ${assign.facultyName}
Department: ${assign.department}
Constituent College: ${assign.college}
Lecture Schedule: ${assign.lectureInfo || 'Refer to department notice board'}
Subject Description: ${assign.description || 'Prescribed university syllabus module'}
Important Instructions: ${assign.instructions || 'Standard attendance and lab requirements apply'}
Available Faculty Resources:
${docListText}`,
              snippet: `Faculty for ${assign.programme} Sem ${assign.semester} ${assign.subjectName}: ${assign.facultyName} (${assign.department}, ${assign.college}).`,
              relevanceScore: 160
            });
          }
        }

        if (matchingProfiles.length > 0) {
          for (const prof of matchingProfiles) {
            const facultyAssignments = facultyService.getAssignments(prof.id);
            const assignmentsText = facultyAssignments.length > 0
              ? facultyAssignments.map(fa => `  * Programme: ${fa.programme} | Semester: ${fa.semester} | Subject: ${fa.subjectName} (${fa.subjectCode}) | Timings: ${fa.lectureInfo || 'N/A'}`).join('\n')
              : '  * No active teaching assignments currently listed.';

            results.push({
              title: `Faculty Profile: ${prof.name}`,
              url: 'https://silveroakuni.ac.in/faculty',
              type: 'official_faculty_data',
              content: `FACULTY MEMBER PROFILE:
Name: ${prof.name}
Faculty ID: ${prof.facultyId}
Designation: ${prof.designation}
Department: ${prof.department}
College: ${prof.college}
Qualification: ${prof.qualification}
Official Email: ${prof.email}
Office Location: ${prof.officeLocation || 'Main Academic Campus'}
Office Hours: ${prof.officeHours || 'During working hours'}
Current Teaching Assignments (Multi-Programme):
${assignmentsText}`,
              snippet: `Profile of ${prof.name}, ${prof.designation} in ${prof.department} at ${prof.college}.`,
              relevanceScore: 170
            });
          }
        }

        // If target programme or subject was specified but NO matching faculty records exist:
        if ((targetProg || isFacultyOrDocumentQuery) && matchingAssignments.length === 0 && matchingDocs.length === 0 && matchingProfiles.length === 0) {
          results.push({
            title: 'Silver Oak University - Faculty Information Not Found',
            url: 'https://silveroakuni.ac.in/faculty',
            type: 'official_faculty_data',
            content: `NO MATCHING FACULTY INFORMATION FOUND:
Target Programme: ${targetProg || 'Not specified'}
Target Semester: ${targetSem || 'Not specified'}
Target Subject: ${targetSub || 'Not specified'}
Target Faculty: ${targetFaculty || 'Not specified'}

CRITICAL INSTRUCTION TO AI (Part 17):
You must state clearly:
"I could not find this faculty information for the requested programme in the available university/faculty data."
Do NOT guess or fabricate faculty names, subjects, or documents. Do NOT substitute another programme.`,
            snippet: 'No matching faculty information found in the authorized university/faculty database.',
            relevanceScore: 140
          });
        }
      }
    }

    const isSpecificCourseResolved = courseRes.isCourseQuery && courseRes.status === 'RESOLVED' && courseRes.matchingBranches.length > 0;

    // 1. Check Contact, Campus & Hostel Facilities Info (only if not an exact course query or user specifically asked about campus/hostel/facilities)
    const isHostelOrCampusQuery = !isSpecificCourseResolved && (
      rawQuery.includes('hostel') || rawQuery.includes('accommodation') || 
      rawQuery.includes('facility') || rawQuery.includes('facilities') || rawQuery.includes('campus') || 
      rawQuery.includes('mess') || /\b(room|rooms|stay)\b/i.test(rawQuery) || 
      rawQuery.includes('living') || rawQuery.includes('girls') || rawQuery.includes('boys') || 
      rawQuery.includes('library') || rawQuery.includes('sports') || rawQuery.includes('gym') || 
      rawQuery.includes('wifi') || rawQuery.includes('transport') || /\b(bus|buses)\b/i.test(rawQuery) || 
      rawQuery.includes('cafeteria') || /\b(lab|labs|laboratory)\b/i.test(rawQuery) || rawQuery.includes('medical') || 
      rawQuery.includes('health') || rawQuery.includes('su facilities che') || rawQuery.includes('kya facilities') || 
      rawQuery.includes('su su che') || rawQuery.includes('kare che') || rawQuery.includes('rehne')
    );

    if (isHostelOrCampusQuery) {
      results.push({
        title: 'Silver Oak University - Official Campus & Hostel Facilities',
        url: sanitizeAndEncodeOfficialUrl('https://silveroakuni.ac.in'),
        type: 'official_contact',
        content: `OFFICIAL SILVER OAK UNIVERSITY CAMPUS & HOSTEL FACILITIES

HOSTEL & RESIDENTIAL ACCOMMODATION:
- Hostel Availability: Yes, Silver Oak University provides separate, well-maintained hostel facilities for both Boys and Girls.
- Girls' Hostel Location: The Girls' Hostel is located safely inside the university campus perimeter with 24x7 security.
- Boys' Hostel Location: Boys' hostel accommodations and verified student housing are located in close proximity to the campus.
- Room Types: Furnished rooms with options for Air-Conditioned (AC) and Non-Air-Conditioned (Non-AC) rooms (shared occupancy, triple/quadruple/quintuple options).
- Room Furnishings: Every room includes individual bed, study desk, chair, wardrobe/cupboard, and good ventilation.
- Essential Hostel Amenities:
  * 24x7 High-Speed Wi-Fi connectivity across all hostel blocks.
  * 24x7 CCTV surveillance, boundary security, and dedicated resident wardens.
  * In-house Mess Facility serving hygienic, nutritious food including breakfast, lunch, evening tea, and dinner.
  * RO purified drinking water stations on all floors.
  * 24x7 power backup, clean sanitation, and regular housekeeping.
  * Common recreational room with TV, newspapers, magazines, and indoor games.
- OFFICIAL HOSTEL FEE POLICY:
  * IMPORTANT: The official Silver Oak University website confirms that comprehensive hostel and mess facilities are available for boys and girls, but the specific hostel fee structure is NOT published on the public university website.
  * If asked about hostel fees: State clearly that the official website does not currently provide the hostel fee schedule, and advise students to contact the University Hostel Office or Admission Helpline at +91 7966046300 / info@silveroakuni.ac.in for the official current hostel fee quote and allotment terms.
  * Do NOT invent or guess hostel prices, fees, or room rates.

CAMPUS INFRASTRUCTURE & STUDENT FACILITIES:
- Campus Size & Location: 25+ acre lush green, Wi-Fi-enabled modern campus on S.G. Highway, Opp. Bhagwat Vidyapith, Gota, Ahmedabad, Gujarat - 382481.
- Central Library & E-Resource Center: Thousands of textbooks, reference volumes, national/international research journals, and DELNET digital database access.
- Specialized Laboratories & Centers of Excellence:
  * Apple Authorized Training Center (iOS Developer Lab)
  * PARAM Shavak Supercomputing Center
  * Artificial Intelligence (AI) and Machine Learning Lab
  * Robotics and Automation Lab
  * CNC, CAD/CAM Manufacturing and Mechanical Engineering Labs
  * Aeronautical & Aerospace Labs
  * Multimedia, Animation & Sound Engineering Studios
  * Virtual Labs in collaboration with IITs
  * Language Lab for communication and soft-skill development
  * Royal Enfield Training Cell and Fronius Innovation & Skill Center
- Sports & Athletics: Full-size cricket and football grounds, basketball court, volleyball, badminton court, table tennis, and fully equipped modern gymnasium.
- Cafeteria & Food Courts: Clean, hygienic cafeterias and multiple food kiosks offering fresh meals, snacks, and beverages.
- Transportation: Dedicated fleet of university buses connecting major pickup routes across Ahmedabad and Gandhinagar.
- Medical & Healthcare: On-campus first-aid center, medical care room, and tie-ups with nearby multi-specialty hospitals for emergency medical support.
- Student Support & Innovation:
  * Ignite Incubation Centre (IIC) supported by SSIP & DST for student startups.
  * Active student clubs (Gulmohar, Arjuna, Sanjeevani, Willow, etc.) promoting cultural, technical, and sports events.
  * Disabled-friendly campus with ramps, accessible elevators, and designated facilities.`,
        snippet: 'Official Silver Oak University campus and hostel facilities: separate boys & girls hostels with AC/non-AC rooms, 24x7 Wi-Fi, CCTV, mess, 25+ acre campus, labs, library, and sports.',
        relevanceScore: 85
      });
    }

    const isContactQuery = !isSpecificCourseResolved && (
      rawQuery.includes('contact') || rawQuery.includes('address') || rawQuery.includes('phone') || 
      rawQuery.includes('helpline') || rawQuery.includes('email') || rawQuery.includes('location') ||
      rawQuery.includes('where is') || rawQuery.includes('approval') || rawQuery.includes('ugc') || 
      rawQuery.includes('aicte') || rawQuery.includes('naac')
    );

    if (this.contactInfo && isContactQuery) {
      results.push({
        title: 'Silver Oak University - Official Contact & Campus Facilities',
        url: sanitizeAndEncodeOfficialUrl('https://silveroakuni.ac.in/contact'),
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

      // Check if branch matches resolved course
      const isResolvedMatch = courseRes.status === 'RESOLVED' && 
        courseRes.matchingBranches.some(mb => mb.slug === b.slug);

      // STRICT PROGRAMME MATCHING RULE (MASTER PROMPT REQUIREMENT):
      // When the user asks about an identified, specific programme (e.g., "MSc IT", "MCA", "BCA", "MBA", etc.),
      // retrieve ONLY the matching branches belonging to that exact programme.
      // Do NOT retrieve unrelated courses simply because they share tokens like "IT", "Technology", "Science", "Diploma", etc.
      if (isSpecificCourseResolved && !isResolvedMatch) {
        continue;
      }

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
      if (score > 4 || isResolvedMatch) {
        const collegesListStr = b.colleges && b.colleges.length > 0
          ? b.colleges.map((c: any) => `${c.name} (${c.abbreviation || ''})`).join(', ')
          : 'Silver Oak University';

        let displayTitle = b.title;
        if (b.credential && !b.title.toLowerCase().includes(b.credential.toLowerCase())) {
          displayTitle = `${b.credential} in ${b.title}`;
        } else if (b.degreeType && !b.title.toLowerCase().includes(b.degreeType.toLowerCase())) {
          displayTitle = `${b.degreeType} ${b.title}`;
        }
        if (b.slug === 'msc-it' && !displayTitle.includes('Integrated')) {
          displayTitle = `M.Sc. Information Technology (Integrated)`;
        } else if (b.slug === 'msc-it-2year' && !displayTitle.includes('2-Year')) {
          displayTitle = `M.Sc. Information Technology (2-Year Programme)`;
        }

        const sanitizedBranchUrl = sanitizeAndEncodeOfficialUrl(b.url);
        const sanitizedTeachingScheme = b.teachingScheme ? sanitizeAndEncodeOfficialUrl(b.teachingScheme) : '';

        let snippetText = `Course: ${displayTitle}. Offered by: ${collegesListStr}. Duration: ${b.duration || 'N/A'}. Fees: ${b.fees || 'Check official portal'}. Eligibility: ${b.eligibility || 'Check official guidelines'}.`;
        if (sanitizedTeachingScheme) {
          snippetText += ` Teaching Scheme/Syllabus Document: ${sanitizedTeachingScheme}`;
        }
        results.push({
          title: `Silver Oak University - ${displayTitle}`,
          url: sanitizedBranchUrl,
          type: 'web_page',
          content: `Course Title: ${displayTitle}
Official URL: ${sanitizedBranchUrl}
Constituent College(s) Offering This Program: ${collegesListStr}
Awarded Credential: ${b.credential || displayTitle}
Eligibility Criteria: ${b.eligibility || 'Refer to official admission guidelines'}
Course Duration: ${b.duration || 'N/A'} (${b.semesters || 'N/A'})
Tuition Fees: ${b.fees || 'Refer to official fee circular'}
Description: ${b.description || 'Program offered at Silver Oak University.'}
${sanitizedTeachingScheme ? `Teaching Scheme / Syllabus: ${sanitizedTeachingScheme}` : ''}`,
          snippet: snippetText,
          relevanceScore: score,
          metadata: { branch: b }
        });

        // If syllabus or PDF requested and teaching scheme exists, add dedicated official syllabus PDF source
        const isSyllabusOrPdfRequested = rawQuery.includes('syllabus') || rawQuery.includes('subject') || 
          rawQuery.includes('teaching scheme') || rawQuery.includes('curriculum') || 
          rawQuery.includes('અભ્યાસક્રમ') || rawQuery.includes('पाठ्यक्रम') ||
          rawQuery.includes('pdf') || rawQuery.includes('document') || rawQuery.includes('download') ||
          rawQuery.includes('scheme');

        if (isResolvedMatch && sanitizedTeachingScheme && isSyllabusOrPdfRequested) {
          results.push({
            title: `Official Teaching Scheme / Syllabus PDF - ${displayTitle}`,
            url: sanitizedTeachingScheme,
            type: 'curriculum_pdf',
            content: `Official Teaching Scheme & Syllabus PDF Document for ${displayTitle}
University: Silver Oak University
Constituent College(s): ${collegesListStr}
College ID: ${b.college_id}
Document URL: ${sanitizedTeachingScheme}
Program Duration: ${b.duration || 'N/A'} (${b.semesters || 'N/A'})
Official Program Page: ${sanitizedBranchUrl}
Syllabus / Teaching Scheme: Official credit breakdown, semester-wise subjects, curriculum components, and evaluation guidelines.`,
            snippet: `Official Syllabus and Teaching Scheme PDF for ${displayTitle}: ${sanitizedTeachingScheme}`,
            relevanceScore: score + 100,
            metadata: { branch: b }
          });
        }
      }
    }

    // 3. Search Colleges
    // Only search colleges if no specific course was resolved, OR if user specifically asked about colleges/institutes
    const isCollegeQuery = rawQuery.includes('college') || rawQuery.includes('institute') || rawQuery.includes('કોલેજ') || rawQuery.includes('कॉलेज') || rawQuery.includes('which college');
    if (!isSpecificCourseResolved || isCollegeQuery) {
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

        // Boost college offering the resolved course when user asks 'Which college provides/offers [course]'
        if (courseRes.status === 'RESOLVED') {
          const offersCourse = courseRes.matchingBranches.some(b => 
            b.colleges?.some(col => col.id.toString() === c.id.toString()) ||
            b.college_id?.toString() === c.id.toString()
          );
          if (offersCourse && (
            rawQuery.includes('college') || rawQuery.includes('institute') || rawQuery.includes('faculty') ||
            rawQuery.includes('which') || rawQuery.includes('offer') || rawQuery.includes('provide') ||
            rawQuery.includes('કોલેજ') || rawQuery.includes('કઈ') || rawQuery.includes('कॉलेज') || rawQuery.includes('कौन')
          )) {
            score += 25;
          }
        }
        if (score > 3) {
          const matchingPrograms = activeBranches.filter(b =>
            b.colleges?.some(col => col.id.toString() === c.id.toString()) ||
            b.college_id?.toString() === c.id.toString()
          );

          let progListText = '';
          if (matchingPrograms.length > 0) {
            progListText = `\nOfficial Programmes & Fees under this college/institute:\n` +
              matchingPrograms.map(p => `- ${p.title}: Official Tuition Fees: ${p.fees || 'Check SOU Admission Cell'} | Duration: ${p.duration || 'N/A'} | Eligibility: ${p.eligibility || 'See Admission Portal'}`).join('\n');
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
    }

    // 4. Search Exam Schedules & Timetables
    const isExamQuery = rawQuery.includes('exam') || rawQuery.includes('timetable') || rawQuery.includes('time table') || 
                        rawQuery.includes('schedule') || rawQuery.includes('date sheet') || rawQuery.includes('datesheet') ||
                        rawQuery.includes('when is') || rawQuery.includes('mid sem') || rawQuery.includes('end sem') ||
                        rawQuery.includes('ese') || rawQuery.includes('mse') || rawQuery.includes('intermediate') ||
                        expandedQueries.some(eq => eq.includes('exam') || eq.includes('timetable') || eq.includes('schedule'));

    if (isExamQuery) {
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

    // Ensure all returned docs have properly sanitized and encoded official URLs
    for (const doc of results) {
      doc.url = sanitizeAndEncodeOfficialUrl(doc.url);
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
      'હોસ્ટેલ': 'hostel accommodation boys girls facility',
      'हॉस्टल': 'hostel accommodation boys girls facility',
      'સુવિધા': 'facilities campus infrastructure library hostel',
      'સુવિધાઓ': 'facilities campus infrastructure library hostel',
      'સગવડ': 'facilities campus infrastructure hostel',
      'सुविधा': 'facilities campus infrastructure library hostel',
      'सुविधाएं': 'facilities campus infrastructure library hostel',
      'રહેવા': 'hostel accommodation stay',
      'रहने': 'hostel accommodation stay',
      'ખાવા': 'mess cafeteria food canteen',
      'મેસ': 'mess dining food hostel',
      'મેડિકલ': 'medical healthcare hospital first aid',
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
