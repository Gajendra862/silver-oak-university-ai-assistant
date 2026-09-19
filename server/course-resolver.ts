import fs from 'fs';
import path from 'path';
import { UniversityBranch } from '../src/types';

export interface CourseResolutionResult {
  isCourseQuery: boolean;
  rawCourseMention: string | null;
  status: 'RESOLVED' | 'UNIDENTIFIED' | 'CLARIFICATION_NEEDED' | 'NOT_A_COURSE_QUERY';
  resolvedOfficialNames: string[];
  primaryBranch?: UniversityBranch;
  matchingBranches: UniversityBranch[];
  clarificationMessage?: string;
  fallbackMessage?: string;
}

interface AbbreviationDefinition {
  primaryAcronym: string;
  aliases: string[]; // Variations like ['b.com', 'bcom', 'b com']
  officialTitleKeywords: string[];
  defaultBranchSlugs?: string[];
  disambiguationRules?: {
    keywords: string[];
    slug: string;
  }[];
}

export class CourseResolver {
  private branches: UniversityBranch[] = [];
  private isLoaded = false;

  // Comprehensive map of Silver Oak University course abbreviations and variants
  private abbreviationDefinitions: AbbreviationDefinition[] = [
    {
      primaryAcronym: 'MCA',
      aliases: ['mca', 'm.c.a', 'm.c.a.', 'master of computer applications', 'master in computer application', 'master of computer application'],
      officialTitleKeywords: ['master of computer applications', 'mca'],
      defaultBranchSlugs: ['mca']
    },
    {
      primaryAcronym: 'BCA',
      aliases: ['bca', 'b.c.a', 'b.c.a.', 'bachelor of computer applications', 'bachelor in computer application', 'bachelor of computer application'],
      officialTitleKeywords: ['bachelor of computer applications', 'bca'],
      defaultBranchSlugs: ['bca'],
      disambiguationRules: [
        { keywords: ['vocational', 'bvoc', 'vocation'], slug: 'bca_vocational_information_technology' }
      ]
    },
    {
      primaryAcronym: 'BBA',
      aliases: ['bba', 'b.b.a', 'b.b.a.', 'bachelor of business administration'],
      officialTitleKeywords: ['bachelor of business administration', 'bba'],
      defaultBranchSlugs: ['bachelor-of-business-administration'],
      disambiguationRules: [
        { keywords: ['logistics', 'supply chain'], slug: 'bachelor_of_business_administration_logistics' },
        { keywords: ['ai', 'analytics', 'data analytics', 'artificial intelligence'], slug: 'bachelor-of-business-administration-ai-business-analytics' },
        { keywords: ['law', 'llb', 'advocacy', 'integrated'], slug: 'integrated-bba-llb' },
        { keywords: ['digital marketing', 'vocational digital'], slug: 'bba_vocational_digital_marketing' },
        { keywords: ['banking', 'taxation', 'finance'], slug: 'bba_vocational_banking_finance_accounting_and_taxation' },
        { keywords: ['entrepreneurship'], slug: 'bba_vocational_management_and_entrepreneurship' }
      ]
    },
    {
      primaryAcronym: 'MBA',
      aliases: ['mba', 'm.b.a', 'm.b.a.', 'master of business administration'],
      officialTitleKeywords: ['master of business administration', 'mba'],
      defaultBranchSlugs: ['master-of-business-administration'],
      disambiguationRules: [
        { keywords: ['integrated', 'imba', 'after 12th', '5 year', '5 years'], slug: 'integrated-master-of-business-administration' }
      ]
    },
    {
      primaryAcronym: 'B.Com',
      aliases: ['b.com', 'bcom', 'b com', 'b.com.', 'bachelor of commerce'],
      officialTitleKeywords: ['bachelor of commerce', 'b.com'],
      defaultBranchSlugs: ['bachelor-of-commerce'],
      disambiguationRules: [
        { keywords: ['forensic', 'forensic accounting'], slug: 'bcom-in-forensic-accounting' },
        { keywords: ['strategic finance', 'finance'], slug: 'bcom-strategic-finance' },
        { keywords: ['global', 'global public accounting', 'us accounting', 'hons'], slug: 'bcomhons-global-public-accounting' },
        { keywords: ['vocational', 'banking'], slug: 'bcom_vocational_banking_finance_accounting_and_taxation' }
      ]
    },
    {
      primaryAcronym: 'M.Com',
      aliases: ['m.com', 'mcom', 'm com', 'm.com.', 'master of commerce'],
      officialTitleKeywords: ['master of commerce', 'm.com'],
      defaultBranchSlugs: ['master-of-commerce'],
      disambiguationRules: [
        { keywords: ['us accounting', 'taxation'], slug: 'mcom-us-accounting-taxation' },
        { keywords: ['anti money laundering', 'counter terrorist', 'aml'], slug: 'mcom-anti-money-laundering-counter-terrorist-financing' },
        { keywords: ['us public accounting'], slug: 'mcom-us-public-accounting-taxation' }
      ]
    },
    {
      primaryAcronym: 'MSc IT',
      aliases: ['msc it', 'm.sc it', 'm.sc. it', 'msc-it', 'mscit', 'master of science in information technology', 'imsc it'],
      officialTitleKeywords: ['master of science in information technology', 'm.sc. it'],
      defaultBranchSlugs: ['msc-it', 'msc-it-2year'],
      disambiguationRules: [
        { keywords: ['integrated', 'after 12th', '12th', '5 year', '5 years', '5 yr', '10 sem', '10 semesters'], slug: 'msc-it' },
        { keywords: ['2 year', '2 years', 'post graduate', 'after graduation', 'after bca', 'after bsc', '4 sem', '4 semesters'], slug: 'msc-it-2year' }
      ]
    },
    {
      primaryAcronym: 'MSc CS',
      aliases: ['msc cs', 'm.sc cs', 'm.sc. cs', 'msc-cs', 'msc cyber security', 'msc computer science'],
      officialTitleKeywords: ['master of science in computer science'],
      defaultBranchSlugs: ['msc-cs']
    },
    {
      primaryAcronym: 'BSc CS-IT',
      aliases: ['bsc cs it', 'b.sc cs it', 'b.sc. cs it', 'b.sc cs-it', 'bsc cs-it', 'bsc it', 'b.sc it', 'b.sc. it', 'bsc computer science'],
      officialTitleKeywords: ['bachelor of science in computer science & information technology', 'b.sc. cs‑it'],
      defaultBranchSlugs: ['bsc_cs_it']
    },
    {
      primaryAcronym: 'BSc Data Science',
      aliases: ['bsc data science', 'b.sc data science', 'b.sc. data science'],
      officialTitleKeywords: ['bachelor of science in data science'],
      defaultBranchSlugs: ['socca-bsc-data-science']
    },
    {
      primaryAcronym: 'MSc Data Science',
      aliases: ['msc data science', 'm.sc data science', 'm.sc. data science'],
      officialTitleKeywords: ['master of science in data science'],
      defaultBranchSlugs: ['socca-msc-data-science']
    },
    {
      primaryAcronym: 'B.Tech',
      aliases: ['b.tech', 'btech', 'b tech', 'b.tech.', 'bachelor of technology', 'be', 'b.e', 'b.e.'],
      officialTitleKeywords: ['b.tech', 'bachelor of technology'],
      defaultBranchSlugs: ['computer-science-engineering', 'computer-engineering', 'infromation-technology'],
      disambiguationRules: [
        { keywords: ['cse', 'computer science engineering', 'computer science and engineering'], slug: 'computer-science-engineering' },
        { keywords: ['computer engineering', 'ce'], slug: 'computer-engineering' },
        { keywords: ['it', 'information technology'], slug: 'infromation-technology' },
        { keywords: ['mechanical', 'mech'], slug: 'mechanical' },
        { keywords: ['civil'], slug: 'civil' },
        { keywords: ['chemical'], slug: 'chemical' },
        { keywords: ['electrical', 'ee'], slug: 'electrical' },
        { keywords: ['electronics', 'ec', 'electronics & communication'], slug: 'btech-electronics-communication' },
        { keywords: ['aerospace'], slug: 'aerospace-engineering' },
        { keywords: ['aeronautical', 'aero'], slug: 'aeronautical' },
        { keywords: ['cyber', 'cyber security'], slug: 'comp-sci-eng-cyber' },
        { keywords: ['ai', 'ml', 'artificial intelligence', 'machine learning'], slug: 'computer-engineering-ml-ai' },
        { keywords: ['biotech', 'biotechnology'], slug: 'btech_biotechnology' },
        { keywords: ['ame', 'aircraft maintenance'], slug: 'ame_with_btech_aeronautical_aerospace_engineering' }
      ]
    },
    {
      primaryAcronym: 'M.Tech',
      aliases: ['m.tech', 'mtech', 'm tech', 'm.tech.', 'master of technology', 'me', 'm.e', 'm.e.'],
      officialTitleKeywords: ['m.tech', 'master of technology', 'masters in civil engineering'],
      defaultBranchSlugs: ['computer-engineering-master', 'master-of-technology-cyber-security'],
      disambiguationRules: [
        { keywords: ['computer', 'computer engineering'], slug: 'computer-engineering-master' },
        { keywords: ['cyber', 'cyber security'], slug: 'master-of-technology-cyber-security' },
        { keywords: ['ai', 'ml', 'artificial intelligence'], slug: 'mtech-computer-engineering-artificial-intelligence-and-machine-learning' },
        { keywords: ['chemical'], slug: 'chemical_master' },
        { keywords: ['civil', 'casad', 'transport'], slug: 'civil-master' },
        { keywords: ['electronics', 'ec', 'communication'], slug: 'electrical-communication-master' },
        { keywords: ['cad', 'cam', 'cad-cam'], slug: 'mtech-me-cad-cam' },
        { keywords: ['auto', 'automobile', 'ic engine'], slug: 'mtech-me-ic-auto' }
      ]
    },
    {
      primaryAcronym: 'LLB',
      aliases: ['llb', 'll.b', 'll.b.', 'bachelor of law', 'bachelor of laws'],
      officialTitleKeywords: ['llb (bachelor of law)', 'bachelor of law'],
      defaultBranchSlugs: ['llb-bachelor-of-law'],
      disambiguationRules: [
        { keywords: ['bba llb', 'bba', 'business law'], slug: 'integrated-bba-llb' },
        { keywords: ['ba llb', 'ba', 'arts law'], slug: 'integrated-ba-llb' },
        { keywords: ['3 year', '3 years', 'after graduation', 'general llb'], slug: 'llb-bachelor-of-law' }
      ]
    },
    {
      primaryAcronym: 'LLM',
      aliases: ['llm', 'll.m', 'll.m.', 'master of law', 'master of laws'],
      officialTitleKeywords: ['ll.m.', 'master of law'],
      defaultBranchSlugs: ['llm-criminal-master-of-law', 'llm-ipr-master-of-law'],
      disambiguationRules: [
        { keywords: ['criminal', 'criminal law'], slug: 'llm-criminal-master-of-law' },
        { keywords: ['ipr', 'intellectual property'], slug: 'llm-ipr-master-of-law' }
      ]
    },
    {
      primaryAcronym: 'Law',
      aliases: ['law', 'law program', 'law degree', 'legal studies'],
      officialTitleKeywords: ['bachelor of law', 'master of law'],
      defaultBranchSlugs: ['llb-bachelor-of-law', 'integrated-ba-llb', 'integrated-bba-llb'],
      disambiguationRules: [
        { keywords: ['llm', 'master', 'pg'], slug: 'llm-criminal-master-of-law' },
        { keywords: ['bba', 'business'], slug: 'integrated-bba-llb' },
        { keywords: ['ba', 'arts'], slug: 'integrated-ba-llb' }
      ]
    },
    {
      primaryAcronym: 'B.Pharm',
      aliases: ['b.pharm', 'bpharm', 'b pharm', 'b.pharm.', 'bachelor of pharmacy'],
      officialTitleKeywords: ['bachelor of pharmacy', 'socop-bpharm'],
      defaultBranchSlugs: ['socop-bpharm']
    },
    {
      primaryAcronym: 'D.Pharm',
      aliases: ['d.pharm', 'dpharm', 'd pharm', 'd.pharm.', 'diploma in pharmacy'],
      officialTitleKeywords: ['diploma in pharmacy', 'socop-dpharm'],
      defaultBranchSlugs: ['socop-dpharm']
    },
    {
      primaryAcronym: 'M.Pharm',
      aliases: ['m.pharm', 'mpharm', 'm pharm', 'm.pharm.', 'master of pharmacy'],
      officialTitleKeywords: ['master of pharmacy (m.pharm.)'],
      defaultBranchSlugs: ['master-of-pharmacy']
    },
    {
      primaryAcronym: 'Pharm.D',
      aliases: ['pharm.d', 'pharmd', 'pharm d', 'pharm.d.', 'doctor of pharmacy'],
      officialTitleKeywords: ['doctor of pharmacy (pharm.d)'],
      defaultBranchSlugs: ['doctor-of-pharmacy']
    },
    {
      primaryAcronym: 'Pharmacy',
      aliases: ['pharmacy', 'pharmaceutical'],
      officialTitleKeywords: ['bachelor of pharmacy', 'diploma in pharmacy', 'master of pharmacy', 'doctor of pharmacy'],
      defaultBranchSlugs: ['socop-bpharm', 'socop-dpharm', 'doctor-of-pharmacy']
    },
    {
      primaryAcronym: 'BPT',
      aliases: ['bpt', 'b.p.t', 'b.p.t.', 'bachelor of physiotherapy', 'physiotherapy'],
      officialTitleKeywords: ['bachelor of physiotherapy (bpt)'],
      defaultBranchSlugs: ['physiotherapy']
    },
    {
      primaryAcronym: 'GNM',
      aliases: ['gnm', 'general nursing midwifery', 'nursing diploma'],
      officialTitleKeywords: ['diploma general nursing midwifery'],
      defaultBranchSlugs: ['diploma-general-nursing-midwifery']
    },
    {
      primaryAcronym: 'B.Sc Nursing',
      aliases: ['bsc nursing', 'b.sc nursing', 'b.sc. nursing', 'bachelor of science in nursing', 'nursing degree'],
      officialTitleKeywords: ['bachelor of science in nursing'],
      defaultBranchSlugs: ['bachelor-of-science-in-nursing']
    },
    {
      primaryAcronym: 'PGDMLT',
      aliases: ['pgdmlt', 'p.g.d.m.l.t', 'medical laboratory technician', 'post graduate diploma in medical laboratory'],
      officialTitleKeywords: ['post graduate diploma in medical laboratory technician (pgdmlt)'],
      defaultBranchSlugs: ['pgd_medial_laboratory_technician']
    },
    {
      primaryAcronym: 'B.Voc',
      aliases: ['b.voc', 'bvoc', 'b voc', 'b.voc.', 'bachelor of vocation'],
      officialTitleKeywords: ['bachelor of vocation (b.voc)', 'bachelor of vocation'],
      defaultBranchSlugs: ['media_graphics_animation', 'hotel-management', 'bvoc-digital-marketing'],
      disambiguationRules: [
        { keywords: ['media', 'graphics', 'animation'], slug: 'media_graphics_animation' },
        { keywords: ['hotel', 'hotel management'], slug: 'hotel-management' },
        { keywords: ['sound', 'digital sound', 'audio'], slug: 'digital_sound_engineering' },
        { keywords: ['digital marketing', 'marketing'], slug: 'bvoc-digital-marketing' },
        { keywords: ['management', 'entrepreneurship'], slug: 'bvoc-management-enterpreneurship' },
        { keywords: ['banking', 'finance', 'taxation'], slug: 'bvoc_banking_finance_accounting_and_taxation' }
      ]
    },
    {
      primaryAcronym: 'M.Voc',
      aliases: ['m.voc', 'mvoc', 'm voc', 'm.voc.', 'master of vocation'],
      officialTitleKeywords: ['master of vocation', 'm.voc in media'],
      defaultBranchSlugs: ['mvoc_media_graphics_animation']
    },
    {
      primaryAcronym: 'BMS',
      aliases: ['bms', 'b.m.s', 'b.m.s.', 'bachelor of management studies'],
      officialTitleKeywords: ['bachelor of management studies ( hons.)'],
      defaultBranchSlugs: ['bachelor-of-management-studies']
    },
    {
      primaryAcronym: 'MMS',
      aliases: ['mms', 'm.m.s', 'm.m.s.', 'master in management studies', 'master of management studies'],
      officialTitleKeywords: ['mms (master in management studies)'],
      defaultBranchSlugs: ['mms']
    },
    {
      primaryAcronym: 'BHM',
      aliases: ['bhm', 'b.h.m', 'hotel management', 'bachelor of hotel management'],
      officialTitleKeywords: ['bachelor of vocation (b.voc) in hotel management', 'master’s in hotel management'],
      defaultBranchSlugs: ['hotel-management', 'masters-hotel-management'],
      disambiguationRules: [
        { keywords: ['master', 'masters', 'pg'], slug: 'masters-hotel-management' },
        { keywords: ['bachelor', 'ug', 'bvoc'], slug: 'hotel-management' }
      ]
    },
    {
      primaryAcronym: 'B.Sc',
      aliases: ['b.sc', 'bsc', 'b sc', 'b.sc.', 'bachelor of science'],
      officialTitleKeywords: ['b.sc. in', 'bachelor of science in'],
      defaultBranchSlugs: ['physics', 'chemistry', 'microbiology', 'biotechnology'],
      disambiguationRules: [
        { keywords: ['physics'], slug: 'physics' },
        { keywords: ['chemistry'], slug: 'chemistry' },
        { keywords: ['microbiology'], slug: 'microbiology' },
        { keywords: ['biotechnology', 'biotech'], slug: 'biotechnology' },
        { keywords: ['forensic', 'criminology'], slug: 'forensic-science-criminology' },
        { keywords: ['anesthesia', 'operation theatre', 'ott'], slug: 'bsc-anesthesia-and-operation-theatre-technology' },
        { keywords: ['radiology', 'imaging'], slug: 'bsc-medical-radiology-and-imaging-technology' },
        { keywords: ['medical lab', 'mlt', 'laboratory technology'], slug: 'bsc-medical-laboratory-technology' },
        { keywords: ['computer science', 'cs-it', 'it'], slug: 'bsc_cs_it' },
        { keywords: ['data science'], slug: 'socca-bsc-data-science' },
        { keywords: ['nursing'], slug: 'bachelor-of-science-in-nursing' },
        { keywords: ['animation', 'media graphics'], slug: 'bachelor-of-science-media-graphics-and-animation' }
      ]
    },
    {
      primaryAcronym: 'M.Sc',
      aliases: ['m.sc', 'msc', 'm sc', 'm.sc.', 'master of science'],
      officialTitleKeywords: ['m.sc. in', 'master of science in'],
      defaultBranchSlugs: ['chemistry-master', 'physics-master', 'microbiology-master', 'mathematics-master'],
      disambiguationRules: [
        { keywords: ['physics'], slug: 'physics-master' },
        { keywords: ['chemistry'], slug: 'chemistry-master' },
        { keywords: ['microbiology'], slug: 'microbiology-master' },
        { keywords: ['mathematics', 'maths', 'math'], slug: 'mathematics-master' },
        { keywords: ['biotechnology', 'biotech'], slug: 'msc_biotechnology' },
        { keywords: ['it', 'information technology'], slug: 'msc-it' },
        { keywords: ['cs', 'cyber security', 'computer science'], slug: 'msc-cs' },
        { keywords: ['data science'], slug: 'socca-msc-data-science' },
        { keywords: ['animation', 'media graphics'], slug: 'masters-of-science-media-graphics-and-animation' }
      ]
    },
    {
      primaryAcronym: 'BA',
      aliases: ['ba', 'b.a', 'b.a.', 'bachelor of arts'],
      officialTitleKeywords: ['bachelor of arts'],
      defaultBranchSlugs: ['psychology', 'english', 'civil-services'],
      disambiguationRules: [
        { keywords: ['psychology'], slug: 'psychology' },
        { keywords: ['english'], slug: 'english' },
        { keywords: ['public administration', 'civil services', 'upsc'], slug: 'civil-services' },
        { keywords: ['law', 'llb'], slug: 'integrated-ba-llb' }
      ]
    },
    {
      primaryAcronym: 'MA',
      aliases: ['ma', 'm.a', 'm.a.', 'master of arts'],
      officialTitleKeywords: ['master of arts', 'ma psychology', 'ma english'],
      defaultBranchSlugs: ['psychology-master', 'english-master'],
      disambiguationRules: [
        { keywords: ['psychology'], slug: 'psychology-master' },
        { keywords: ['english'], slug: 'english-master' }
      ]
    },
    {
      primaryAcronym: 'Diploma Engineering',
      aliases: ['diploma', 'polytechnic', 'diploma engineering'],
      officialTitleKeywords: ['diploma in', 'diploma engineering'],
      defaultBranchSlugs: ['computer-engineering-diploma', 'mechanical-diploma', 'civil-diploma'],
      disambiguationRules: [
        { keywords: ['computer', 'ce', 'computer engineering'], slug: 'computer-engineering-diploma' },
        { keywords: ['cse', 'computer science'], slug: 'diploma-in-computer-science-engineering' },
        { keywords: ['it', 'information technology'], slug: 'information-technology-diploma' },
        { keywords: ['mechanical'], slug: 'mechanical-diploma' },
        { keywords: ['electrical'], slug: 'electrical-diploma' },
        { keywords: ['civil'], slug: 'civil-diploma' },
        { keywords: ['chemical'], slug: 'chemical-diploma' },
        { keywords: ['aeronautical', 'aero'], slug: 'diploma-aeronautical-engineering' },
        { keywords: ['ai', 'ml', 'machine learning'], slug: 'diploma-computer-engineering-with-ml-ai' },
        { keywords: ['cyber', 'cyber security'], slug: 'diploma-in-computer-science-and-engineering-cyber-security' },
        { keywords: ['pharmacy', 'dpharm'], slug: 'socop-dpharm' },
        { keywords: ['nursing', 'gnm'], slug: 'diploma-general-nursing-midwifery' },
        { keywords: ['animation', 'media graphics'], slug: 'diploma-in-media-graphics-and-animation' }
      ]
    },
    {
      primaryAcronym: 'B.Des',
      aliases: ['b.des', 'bdes', 'b des', 'b.des.', 'bachelor of design'],
      officialTitleKeywords: ['bachelor of design', 'b.des'],
      defaultBranchSlugs: ['bachelor-of-design', 'bdes', 'bachelor-of-interior-design'],
      disambiguationRules: [
        { keywords: ['interior', 'interior design'], slug: 'bachelor-of-interior-design' },
        { keywords: ['fashion', 'fashion design'], slug: 'bachelor-of-fashion-design' }
      ]
    },
    {
      primaryAcronym: 'M.Des',
      aliases: ['m.des', 'mdes', 'm des', 'm.des.', 'master of design'],
      officialTitleKeywords: ['master of design', 'm.des'],
      defaultBranchSlugs: ['master-of-design', 'mdes']
    },
    {
      primaryAcronym: 'D.Des',
      aliases: ['d.des', 'ddes', 'd des', 'd.des.', 'diploma in design'],
      officialTitleKeywords: ['diploma in design', 'd.des'],
      defaultBranchSlugs: ['diploma-in-design']
    },
    {
      primaryAcronym: 'B.Arch',
      aliases: ['b.arch', 'barch', 'b arch', 'b.arch.', 'bachelor of architecture'],
      officialTitleKeywords: ['bachelor of architecture', 'b.arch'],
      defaultBranchSlugs: ['bachelor-of-architecture']
    }
  ];

  constructor() {
    this.loadBranches();
  }

  private loadBranches() {
    try {
      const syncPath = path.join(process.cwd(), 'server', 'data', 'synchronized-catalogue.json');
      if (fs.existsSync(syncPath)) {
        const raw = fs.readFileSync(syncPath, 'utf8');
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.programs) && data.programs.length > 0) {
          this.branches = data.programs.map((p: any) => ({
            id: p.programId || p.id || p.slug,
            title: p.officialName || p.name || p.title || '',
            slug: p.programId || p.slug || p.id || '',
            collegeId: typeof p.collegeId === 'number' ? p.collegeId : parseInt(p.collegeId, 10) || 1,
            url: p.officialUrl || p.url || '',
            fees: p.fees || '',
            duration: p.duration || '',
            eligibility: p.eligibility || '',
            semesters: p.semesters || '',
            teachingScheme: p.teachingScheme,
            credential: p.degreeType || p.credential
          }));
          this.isLoaded = true;
          return;
        }
      }

      const dataDir = path.join(process.cwd(), 'server', 'data');
      const branchFile = path.join(dataDir, 'branches.json');
      if (fs.existsSync(branchFile)) {
        this.branches = JSON.parse(fs.readFileSync(branchFile, 'utf8'));
        this.isLoaded = true;
      }
    } catch (e: any) {
      console.error('[CourseResolver] Error loading branches:', e.message);
    }
  }

  public getBranches(): UniversityBranch[] {
    return this.branches;
  }

  public updateBranches(branches: UniversityBranch[]) {
    this.branches = branches;
    this.isLoaded = true;
  }

  /**
   * Main resolution workflow adhering to Silver Oak University official sources
   */
  public resolve(userMessage: string): CourseResolutionResult {
    const rawQuery = userMessage.trim();
    const cleanLower = rawQuery.toLowerCase();

    // 1. Detect if the query is course-related
    const isCourseRelated = this.detectCourseIntent(cleanLower);

    // 2. Extract course mention exactly as written
    const rawCourseMention = this.extractRawCourseMention(rawQuery);

    if (!isCourseRelated && !rawCourseMention) {
      return {
        isCourseQuery: false,
        rawCourseMention: null,
        status: 'NOT_A_COURSE_QUERY',
        resolvedOfficialNames: [],
        matchingBranches: []
      };
    }

    // If an unknown abbreviation or course acronym was specifically queried
    // that does NOT exist in Silver Oak University's official offerings (e.g. MBBS, BAMS, BHMS, BDS, B.Arch, B.Des, etc.)
    const unrecognizedAcronym = this.detectUnrecognizedAcronym(rawQuery);
    if (unrecognizedAcronym) {
      return {
        isCourseQuery: true,
        rawCourseMention: unrecognizedAcronym,
        status: 'UNIDENTIFIED',
        resolvedOfficialNames: [],
        matchingBranches: [],
        fallbackMessage: 'I could not clearly identify the course from the official Silver Oak University information. Please provide the full course name.'
      };
    }

    // 3. Match against known official Silver Oak University course abbreviations
    const matchedDef = this.findMatchingDefinition(cleanLower);

    if (matchedDef) {
      const matchedBranches = this.resolveBranchesForDefinition(matchedDef, cleanLower);
      
      if (matchedBranches.length > 0) {
        const primaryBranch = matchedBranches[0];
        const officialNames = Array.from(new Set(matchedBranches.map(b => b.title)));

        return {
          isCourseQuery: true,
          rawCourseMention: rawCourseMention || matchedDef.primaryAcronym,
          status: 'RESOLVED',
          resolvedOfficialNames: officialNames,
          primaryBranch,
          matchingBranches: matchedBranches
        };
      }
    }

    // 4. Direct title or slug search in official Silver Oak branches
    const directBranchMatches = this.findDirectBranchMatches(cleanLower);
    if (directBranchMatches.length > 0) {
      return {
        isCourseQuery: true,
        rawCourseMention: rawCourseMention || directBranchMatches[0].title,
        status: 'RESOLVED',
        resolvedOfficialNames: Array.from(new Set(directBranchMatches.map(b => b.title))),
        primaryBranch: directBranchMatches[0],
        matchingBranches: directBranchMatches
      };
    }

    // 5. If user wrote an apparent course acronym/query but it could not be identified
    if (rawCourseMention && /^[A-Z\.\s]{2,10}$/i.test(rawCourseMention.trim())) {
      return {
        isCourseQuery: true,
        rawCourseMention,
        status: 'UNIDENTIFIED',
        resolvedOfficialNames: [],
        matchingBranches: [],
        fallbackMessage: 'I could not clearly identify the course from the official Silver Oak University information. Please provide the full course name.'
      };
    }

    // General course query without a specific identifiable course
    return {
      isCourseQuery: true,
      rawCourseMention: null,
      status: 'NOT_A_COURSE_QUERY',
      resolvedOfficialNames: [],
      matchingBranches: []
    };
  }

  /**
   * Checks if query has course-related keywords or intent
   */
  private detectCourseIntent(text: string): boolean {
    const courseKeywords = [
      'course', 'program', 'programme', 'degree', 'diploma', 'syllabus', 'fees', 'fee',
      'eligibility', 'admission', 'duration', 'semesters', 'semester', 'sem', 'subjects',
      'subject', 'curriculum', 'teaching scheme', 'specialization', 'specialisation', 'branch',
      'cut off', 'cutoff', 'criteria', 'qualification', 'dakhila', 'laykat', 'abhyaskram',
      'vishayo', 'paisa', 'kitne saal', 'kitna saal', 'admission kab', 'scholarship',
      'ફી', 'અભ્યાસક્રમ', 'પ્રવેશ', 'લાયકાત', 'વિષયો', 'કોર્સ', 'પરીક્ષા',
      'फीस', 'पाठ्यक्रम', 'प्रवेश', 'पात्रता', 'विषय', 'कोर्स'
    ];

    if (courseKeywords.some(kw => text.includes(kw))) {
      return true;
    }

    // Check if any recognized acronym is in the text
    for (const def of this.abbreviationDefinitions) {
      for (const alias of def.aliases) {
        const regex = new RegExp(`\\b${escapeRegExp(alias)}\\b`, 'i');
        if (regex.test(text)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Extracts raw course string exactly as the user wrote it
   */
  public extractRawCourseMention(rawText: string): string | null {
    // Sort aliases by length descending so "MSc IT" is tested before "MSc"
    const allAliases: { alias: string; primary: string }[] = [];
    for (const def of this.abbreviationDefinitions) {
      for (const alias of def.aliases) {
        allAliases.push({ alias, primary: def.primaryAcronym });
      }
    }
    allAliases.sort((a, b) => b.alias.length - a.alias.length);

    for (const item of allAliases) {
      const regex = new RegExp(`\\b(${escapeRegExp(item.alias)})\\b`, 'i');
      const m = rawText.match(regex);
      if (m) {
        return m[1]; // Return exact string as written by the user
      }
    }

    // Also check for common unregistered course acronyms like MBBS, BAMS, etc.
    const genericAcronymMatch = rawText.match(/\b([A-Z]{2,6}(?:\.[A-Z]{1,4})*)\b/);
    if (genericAcronymMatch) {
      const candidate = genericAcronymMatch[1];
      if (!['AI', 'AND', 'THE', 'FOR', 'HOW', 'WHAT', 'WHO', 'WHY', 'CAN', 'ANY', 'NOT', 'PDF', 'URL'].includes(candidate.toUpperCase())) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Detects acronyms not offered by Silver Oak University (e.g. MBBS, BAMS, BDS, BHMS)
   */
  private detectUnrecognizedAcronym(rawText: string): string | null {
    const unofferedAcronyms = [
      'mbbs', 'bams', 'bhms', 'bds', 'md', 'ms', 'b.ed', 'bed', 'm.ed', 'med'
    ];

    for (const un of unofferedAcronyms) {
      const regex = new RegExp(`\\b${escapeRegExp(un)}\\b`, 'i');
      const m = rawText.match(regex);
      if (m) {
        const unLower = un.toLowerCase();
        const isOffered = this.branches.some(b => 
          b.slug.toLowerCase().includes(unLower) || 
          b.title.toLowerCase().includes(unLower)
        );
        if (!isOffered) {
          return m[1];
        }
      }
    }

    return null;
  }

  /**
   * Finds the best matching official abbreviation definition
   */
  private findMatchingDefinition(cleanText: string): AbbreviationDefinition | null {
    // Collect all { alias, def } pairs
    const pairs: { alias: string; def: AbbreviationDefinition; isSpecificDegree: boolean }[] = [];
    for (const def of this.abbreviationDefinitions) {
      for (const alias of def.aliases) {
        const isSpecific = def.primaryAcronym !== 'Law' && def.primaryAcronym !== 'Pharmacy';
        pairs.push({ alias, def, isSpecificDegree: isSpecific });
      }
    }

    // Sort by: 1) alias length descending, 2) specific degree acronym over generic category
    pairs.sort((a, b) => {
      if (b.alias.length !== a.alias.length) {
        return b.alias.length - a.alias.length;
      }
      if (b.isSpecificDegree !== a.isSpecificDegree) {
        return b.isSpecificDegree ? 1 : -1;
      }
      return 0;
    });

    for (const item of pairs) {
      const regex = new RegExp(`\\b${escapeRegExp(item.alias)}\\b`, 'i');
      if (regex.test(cleanText)) {
        return item.def;
      }
    }

    return null;
  }

  /**
   * Resolves official UniversityBranch objects for an abbreviation, applying disambiguation rules
   */
  private resolveBranchesForDefinition(def: AbbreviationDefinition, queryText: string): UniversityBranch[] {
    // 1. Check specific disambiguation rules if query contains specialization / keyword
    if (def.disambiguationRules) {
      for (const rule of def.disambiguationRules) {
        if (rule.keywords.some(kw => new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i').test(queryText))) {
          const matched = this.branches.find(b => b.slug === rule.slug);
          if (matched) {
            return [matched];
          }
        }
      }
    }

    // 2. Use default branch slugs if mapped
    if (def.defaultBranchSlugs && def.defaultBranchSlugs.length > 0) {
      const matchedDefaults = this.branches.filter(b => def.defaultBranchSlugs!.includes(b.slug));
      if (matchedDefaults.length > 0) {
        return matchedDefaults;
      }
    }

    // 3. Fallback: match by official title keywords
    const matches = this.branches.filter(b => {
      const titleLower = (b.title || '').toLowerCase();
      return def.officialTitleKeywords.some(kw => titleLower.includes(kw));
    });

    return matches;
  }

  /**
   * Finds branches whose titles directly match words in the query
   */
  private findDirectBranchMatches(queryText: string): UniversityBranch[] {
    const results: UniversityBranch[] = [];

    for (const b of this.branches) {
      const titleLower = (b.title || '').toLowerCase();
      const slugLower = (b.slug || '').toLowerCase().replace(/[-_]/g, ' ');

      if (titleLower && (queryText.includes(titleLower) || (slugLower.length > 4 && queryText.includes(slugLower)))) {
        results.push(b);
      }
    }

    return results;
  }
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const courseResolver = new CourseResolver();
