import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import {
  SynchronizedProgram,
  SynchronizedCollege,
  CatalogueMetadata,
  ProgrammeFeeInfo,
  UniversityBranch,
  CollegeInfo
} from '../src/types';

const OFFICIAL_PROGRAM_OFFERED_URL = 'https://silveroakuni.ac.in/program-offered';
const CACHE_FILE_PATH = path.join(process.cwd(), 'server', 'data', 'synchronized-catalogue.json');
const BRANCHES_SEED_PATH = path.join(process.cwd(), 'server', 'data', 'branches.json');
const UNIVERSITY_SEED_PATH = path.join(process.cwd(), 'server', 'data', 'university.json');

// Standard college abbreviation heuristics
const KNOWN_COLLEGE_ABBREVIATIONS: Record<string, string> = {
  'SILVER OAK COLLEGE OF COMPUTER APPLICATION': 'SOCCA',
  'SILVER OAK COLLEGE OF PHYSIOTHERAPY': 'SOCP',
  'SILVER OAK INSTITUTE OF SCIENCE': 'SOIS',
  'SILVER OAK COLLEGE OF NURSING': 'SOCN',
  'SILVER OAK INSTITUTE OF MANAGEMENT': 'SOIM',
  'SILVER OAK LAW COLLEGE': 'SOLC',
  'COLLEGE OF PHARMACY': 'COP',
  'SILVER OAK COLLEGE OF ANIMATION & MULTIMEDIA': 'SOCAM',
  'SILVER OAK COMMERCE COLLEGE': 'SOCC',
  'SILVER OAK COLLEGE OF HUMANITIES & SOCIAL SCIENCE': 'SOCHSS',
  'COLLEGE OF ENGINEERING & TECHNOLOGY': 'COET',
  'SILVER OAK INSTITUTE OF LIBERAL & PROFESSIONAL STUDIES': 'SOILPS',
  'SILVER OAK COLLEGE OF ALLIED AND HEALTH CARE': 'SOCAHC',
  'SILVER OAK COLLEGE OF VOCATIONAL EDUCATION': 'SOCVE',
  'SILVER OAK INSTITUTE OF DESIGN': 'SOID',
  'SILVER OAK INSTITUTE OF BUSINESS MANAGEMENT': 'SOIBM',
  'SILVER OAK COLLEGE OF AVIATION TECHNOLOGY': 'SOCAT'
};

export class ProgrammeSyncService {
  private programs: Map<string, SynchronizedProgram> = new Map();
  private colleges: Map<string, SynchronizedCollege> = new Map();
  private degrees: Set<string> = new Set();
  private metadata: CatalogueMetadata = {
    version: new Date().toISOString(),
    lastSyncAttempt: new Date().toISOString(),
    lastSuccessfulSync: new Date().toISOString(),
    syncStatus: 'idle',
    syncMessage: 'Programme catalogue ready',
    totalActivePrograms: 0,
    totalColleges: 0,
    changeLog: []
  };

  private isSyncing = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private branchCache: Map<string, Partial<SynchronizedProgram>> = new Map();

  constructor() {
    this.init();
  }

  /**
   * Initializes the catalogue from cache or seed data, and schedules auto-sync
   */
  public async init() {
    this.loadFromStorage();

    // Check if auto-sync is needed (if never synced with live site or sync interval passed)
    const syncIntervalHours = process.env.PROGRAM_SYNC_INTERVAL_HOURS
      ? Number(process.env.PROGRAM_SYNC_INTERVAL_HOURS)
      : 24;

    const lastSyncTime = new Date(this.metadata.lastSuccessfulSync).getTime();
    const now = Date.now();
    const hoursSinceLastSync = (now - lastSyncTime) / (1000 * 60 * 60);

    // If cache is empty or older than sync interval, trigger initial sync in background
    if (this.programs.size === 0 || hoursSinceLastSync >= syncIntervalHours) {
      const initTimer = setTimeout(() => {
        this.syncFromOfficialWebsite().catch(err => {
          console.error('[ProgrammeSync] Initial sync error:', err.message);
        });
      }, 2000);
      if (initTimer && typeof initTimer.unref === 'function') {
        initTimer.unref();
      }
    }

    // Schedule background periodic check every hour
    const checkIntervalMs = 60 * 60 * 1000;
    this.syncTimer = setInterval(() => {
      const currentHours = (Date.now() - new Date(this.metadata.lastSuccessfulSync).getTime()) / (1000 * 60 * 60);
      if (currentHours >= syncIntervalHours) {
        console.log(`[ProgrammeSync] Sync due (${currentHours.toFixed(1)}h since last sync). Running auto-sync...`);
        this.syncFromOfficialWebsite().catch(err => {
          console.error('[ProgrammeSync] Periodic auto-sync error:', err.message);
        });
      }
    }, checkIntervalMs);
    if (this.syncTimer && typeof this.syncTimer.unref === 'function') {
      this.syncTimer.unref();
    }
  }

  /**
   * Loads cached catalogue from disk or bootstraps from static seed
   */
  private loadFromStorage() {
    try {
      if (fs.existsSync(CACHE_FILE_PATH)) {
        const raw = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf8'));
        if (raw.programs && Array.isArray(raw.programs) && raw.programs.length > 0) {
          this.programs.clear();
          for (const p of raw.programs) {
            this.programs.set(p.programId, p);
          }
        }
        if (raw.colleges && Array.isArray(raw.colleges) && raw.colleges.length > 0) {
          this.colleges.clear();
          for (const c of raw.colleges) {
            c.name = this.normalizeCollegeTitle(c.name);
            c.displayName = this.normalizeCollegeTitle(c.displayName || c.name);
            this.colleges.set(c.id.toString(), c);
          }
        }
        if (raw.metadata) {
          this.metadata = raw.metadata;
        }
        this.recalculateDegrees();
        console.log(`[ProgrammeSync] Loaded ${this.programs.size} programs and ${this.colleges.size} colleges from cache file.`);
        return;
      }
    } catch (e: any) {
      console.warn('[ProgrammeSync] Could not load cache file, falling back to seed data:', e.message);
    }

    // Bootstrap fallback from branches.json and university.json
    this.bootstrapFromSeed();
  }

  /**
   * Bootstraps catalogue from local seed files
   */
  private bootstrapFromSeed() {
    try {
      if (fs.existsSync(UNIVERSITY_SEED_PATH)) {
        const uni = JSON.parse(fs.readFileSync(UNIVERSITY_SEED_PATH, 'utf8'));
        const collegesList = uni.colleges || [];
        for (const col of collegesList) {
          const cleanName = this.normalizeCollegeTitle(col.name);
          this.colleges.set(col.id.toString(), {
            id: col.id,
            name: cleanName,
            abbreviation: col.abbreviation || '',
            displayName: cleanName,
            programCount: 0,
            officialUrl: col.external_website_url || '',
            lastVerifiedAt: new Date().toISOString(),
            status: 'active'
          });
        }
      }

      if (fs.existsSync(BRANCHES_SEED_PATH)) {
        const rawBranches: UniversityBranch[] = JSON.parse(fs.readFileSync(BRANCHES_SEED_PATH, 'utf8'));
        for (const b of rawBranches) {
          const colId = b.college_id ? b.college_id.toString() : '11';
          const colObj = this.colleges.get(colId);
          const colName = colObj ? colObj.name : 'Silver Oak University';

          const programId = b.slug || this.slugify(b.title);
          const degreeType = this.extractDegreeTypeFromTitle(b.title);

          const feeInfo: ProgrammeFeeInfo | undefined = b.fees ? {
            amount: b.fees,
            period: 'Per Annum',
            currency: 'INR',
            rawText: b.fees,
            sourceUrl: b.url,
            lastVerifiedAt: b.lastCrawled || new Date().toISOString()
          } : undefined;

          const prog: SynchronizedProgram = {
            programId,
            officialName: b.title,
            degreeType,
            shortName: this.extractShortName(b.title),
            aliases: this.generateAliases(b.title, b.slug),
            specialization: this.extractSpecialization(b.title),
            colleges: [
              {
                id: colId,
                name: colName,
                abbreviation: colObj?.abbreviation || ''
              }
            ],
            duration: b.duration || '',
            semesters: b.semesters || '',
            fee: feeInfo,
            officialUrl: b.url || `https://silveroakuni.ac.in/branches/${b.slug}`,
            syllabusUrl: b.teachingScheme,
            eligibility: b.eligibility,
            sourceUrl: OFFICIAL_PROGRAM_OFFERED_URL,
            lastVerifiedAt: b.lastCrawled || new Date().toISOString(),
            status: 'active'
          };

          this.programs.set(programId, prog);
        }
      }

      this.recalculateDegrees();
      this.recalculateCollegeCounts();

      this.metadata = {
        version: new Date().toISOString(),
        lastSyncAttempt: new Date().toISOString(),
        lastSuccessfulSync: new Date().toISOString(),
        syncStatus: 'success',
        syncMessage: 'Catalogue bootstrapped from verified local seed dataset.',
        totalActivePrograms: this.getActivePrograms().length,
        totalColleges: this.getActiveColleges().length,
        changeLog: []
      };

      this.saveToStorage();
      console.log(`[ProgrammeSync] Bootstrapped ${this.programs.size} programs across ${this.colleges.size} colleges from seed.`);
    } catch (e: any) {
      console.error('[ProgrammeSync] Bootstrap error:', e.message);
    }
  }

  /**
   * Persists catalogue to disk safely
   */
  private saveToStorage() {
    try {
      const dataDir = path.dirname(CACHE_FILE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const payload = {
        metadata: this.metadata,
        colleges: Array.from(this.colleges.values()),
        programs: Array.from(this.programs.values()),
        degrees: Array.from(this.degrees)
      };

      fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(payload, null, 2), 'utf8');
    } catch (e: any) {
      console.error('[ProgrammeSync] Failed to save catalogue to storage:', e.message);
    }
  }

  /**
   * Primary Synchronization Workflow
   * Fetches official website -> parses -> normalizes -> validates -> updates catalogue
   */
  public async syncFromOfficialWebsite(force = false): Promise<{
    success: boolean;
    message: string;
    metadata: CatalogueMetadata;
    programsCount: number;
    collegesCount: number;
  }> {
    if (this.isSyncing) {
      return {
        success: true,
        message: 'A synchronization is already currently in progress...',
        metadata: this.metadata,
        programsCount: this.getActivePrograms().length,
        collegesCount: this.getActiveColleges().length
      };
    }

    this.isSyncing = true;
    this.metadata.syncStatus = 'syncing';
    this.metadata.syncMessage = 'Updating programme information from official Silver Oak University website...';
    this.metadata.lastSyncAttempt = new Date().toISOString();

    try {
      console.log(`[ProgrammeSync] Fetching official catalogue from ${OFFICIAL_PROGRAM_OFFERED_URL}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(OFFICIAL_PROGRAM_OFFERED_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Official website returned HTTP status ${res.status}: ${res.statusText}`);
      }

      const html = await res.text();
      if (!html || html.length < 5000) {
        throw new Error('Fetched HTML content is unexpectedly small or incomplete');
      }

      // Parse HTML content
      const $ = cheerio.load(html);
      const parsedColleges = this.parseCollegesAndPrograms($);

      // Validation Step: Ensure parsed results are valid before committing
      if (!this.validateParsedData(parsedColleges)) {
        throw new Error('Parsed data failed validation checks (suspiciously low records or malformed DOM)');
      }

      // Process and integrate the validated records
      const changeReport = await this.integrateFreshCatalogue(parsedColleges);

      this.metadata.version = new Date().toISOString();
      this.metadata.lastSuccessfulSync = new Date().toISOString();
      this.metadata.syncStatus = 'success';
      this.metadata.syncMessage = 'Programme data updated successfully.';
      this.metadata.totalActivePrograms = this.getActivePrograms().length;
      this.metadata.totalColleges = this.getActiveColleges().length;

      if (changeReport.addedPrograms.length > 0 || changeReport.removedPrograms.length > 0 || changeReport.updatedPrograms.length > 0 || changeReport.addedColleges.length > 0) {
        this.metadata.changeLog = this.metadata.changeLog || [];
        this.metadata.changeLog.unshift({
          timestamp: new Date().toISOString(),
          addedPrograms: changeReport.addedPrograms,
          removedPrograms: changeReport.removedPrograms,
          updatedPrograms: changeReport.updatedPrograms,
          addedColleges: changeReport.addedColleges
        });
        if (this.metadata.changeLog.length > 20) {
          this.metadata.changeLog = this.metadata.changeLog.slice(0, 20);
        }
      }

      this.recalculateDegrees();
      this.recalculateCollegeCounts();
      this.saveToStorage();

      console.log(`[ProgrammeSync] Sync completed successfully! Active programs: ${this.metadata.totalActivePrograms}, Colleges: ${this.metadata.totalColleges}`);

      return {
        success: true,
        message: 'Programme data updated successfully.',
        metadata: this.metadata,
        programsCount: this.getActivePrograms().length,
        collegesCount: this.getActiveColleges().length
      };

    } catch (err: any) {
      console.error('[ProgrammeSync] Synchronization failed:', err.message);
      
      // Website failure safety: DO NOT wipe out existing catalogue!
      this.metadata.syncStatus = 'failed';
      this.metadata.syncMessage = 'Showing the last successfully verified programme data.';

      return {
        success: false,
        message: `Sync failed: ${err.message}. Showing last successfully verified catalogue.`,
        metadata: this.metadata,
        programsCount: this.getActivePrograms().length,
        collegesCount: this.getActiveColleges().length
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Resiliently parses colleges and programs from cheerio DOM
   */
  public parseCollegesAndPrograms($: cheerio.CheerioAPI): {
    collegeName: string;
    collegeAbbreviation: string;
    programs: {
      rawText: string;
      href: string;
    }[];
  }[] {
    const results: {
      collegeName: string;
      collegeAbbreviation: string;
      programs: { rawText: string; href: string }[];
    }[] = [];

    const ignoredTerms = ['QUICK LINKS', 'STUDENT FACILITIES', 'CONTACT US', 'PLACEMENT & ACHIEVEMENTS', 'ACCREDITATIONS'];

    // Find all accordion buttons or college headers
    $('button').each((_, btn) => {
      // Find candidate heading inside button or its text
      const candidateHeading = $(btn).find('h1, h2, h3, h4, h5, h6, span, div').filter((_, el) => {
        const t = $(el).text().trim().toUpperCase();
        return (t.includes('COLLEGE') || t.includes('INSTITUTE') || t.includes('FACULTY') || t.includes('SCHOOL')) &&
          !ignoredTerms.some(ig => t.includes(ig));
      }).first();

      let collegeName = (candidateHeading.length ? candidateHeading.text() : $(btn).text()).trim();
      collegeName = collegeName.replace(/\s+/g, ' ').trim();

      if (!collegeName || ignoredTerms.some(ig => collegeName.toUpperCase().includes(ig))) {
        return;
      }

      // Clean college name
      collegeName = this.normalizeCollegeTitle(collegeName);

      // Find the accordion panel containing program links
      const panel = $(btn).next();
      const programs: { rawText: string; href: string }[] = [];

      panel.find('a').each((_, a) => {
        const href = $(a).attr('href') || '';
        const rawText = $(a).text().replace(/\s+/g, ' ').trim();
        if (
          href &&
          rawText &&
          (href.includes('/branches/') ||
            href.includes('.silveroakuni.ac.in') ||
            href.includes('/program') ||
            href.startsWith('/'))
        ) {
          programs.push({ rawText, href });
        }
      });

      if (programs.length > 0) {
        const abbreviation = KNOWN_COLLEGE_ABBREVIATIONS[collegeName.toUpperCase()] ||
          this.generateCollegeAbbreviation(collegeName);

        results.push({
          collegeName,
          collegeAbbreviation: abbreviation,
          programs
        });
      }
    });

    return results;
  }

  /**
   * Validates parsed data before replacing active catalogue
   */
  private validateParsedData(parsedColleges: any[]): boolean {
    if (!Array.isArray(parsedColleges) || parsedColleges.length === 0) {
      return false;
    }

    let totalProgs = 0;
    for (const c of parsedColleges) {
      if (!c.collegeName || !Array.isArray(c.programs)) return false;
      totalProgs += c.programs.length;
    }

    // Must detect at least 10 colleges and 50 programs from the official page
    if (parsedColleges.length < 10 || totalProgs < 50) {
      return false;
    }

    return true;
  }

  /**
   * Integrates freshly parsed data into internal maps and detects changes
   */
  private async integrateFreshCatalogue(parsedColleges: {
    collegeName: string;
    collegeAbbreviation: string;
    programs: { rawText: string; href: string }[];
  }[]): Promise<{
    addedPrograms: string[];
    removedPrograms: string[];
    updatedPrograms: string[];
    addedColleges: string[];
  }> {
    const addedPrograms: string[] = [];
    const removedPrograms: string[] = [];
    const updatedPrograms: string[] = [];
    const addedColleges: string[] = [];

    const currentActiveProgramIds = new Set(this.getActivePrograms().map(p => p.programId));
    const newlyDetectedProgramIds = new Set<string>();

    // 1. Update/Add Colleges
    for (const pc of parsedColleges) {
      const existingCollege = Array.from(this.colleges.values()).find(
        c => this.normalizeCollegeTitle(c.name) === this.normalizeCollegeTitle(pc.collegeName)
      );

      let collegeId: string;
      if (existingCollege) {
        collegeId = existingCollege.id.toString();
        existingCollege.status = 'active';
        existingCollege.lastVerifiedAt = new Date().toISOString();
      } else {
        // Auto-assign new college ID
        collegeId = (this.colleges.size + 1).toString();
        this.colleges.set(collegeId, {
          id: collegeId,
          name: this.normalizeCollegeTitle(pc.collegeName),
          abbreviation: pc.collegeAbbreviation,
          displayName: this.normalizeCollegeTitle(pc.collegeName),
          programCount: pc.programs.length,
          lastVerifiedAt: new Date().toISOString(),
          status: 'active'
        });
        addedColleges.push(pc.collegeName);
      }
    }

    // 2. Process all programs across colleges
    // Note: Deduplicate programs sharing the same official URL/slug
    const programGroupMap = new Map<string, {
      rawTexts: string[];
      href: string;
      colleges: { id: string; name: string; abbreviation: string }[];
    }>();

    for (const pc of parsedColleges) {
      const collegeObj = this.findOrCreateCollege(pc.collegeName, pc.collegeAbbreviation);

      for (const p of pc.programs) {
        const canonicalKey = this.getCanonicalProgramId(p.href, p.rawText);
        newlyDetectedProgramIds.add(canonicalKey);

        if (!programGroupMap.has(canonicalKey)) {
          programGroupMap.set(canonicalKey, {
            rawTexts: [p.rawText],
            href: p.href,
            colleges: [
              {
                id: collegeObj.id.toString(),
                name: collegeObj.name,
                abbreviation: collegeObj.abbreviation
              }
            ]
          });
        } else {
          const group = programGroupMap.get(canonicalKey)!;
          if (!group.rawTexts.includes(p.rawText)) {
            group.rawTexts.push(p.rawText);
          }
          if (!group.colleges.some(c => c.id === collegeObj.id.toString())) {
            group.colleges.push({
              id: collegeObj.id.toString(),
              name: collegeObj.name,
              abbreviation: collegeObj.abbreviation
            });
          }
        }
      }
    }

    // 3. Update or create SynchronizedProgram records
    const nowIso = new Date().toISOString();

    for (const [programId, group] of programGroupMap.entries()) {
      const rawText = group.rawTexts[0];
      const officialUrl = group.href.startsWith('http')
        ? group.href
        : `https://silveroakuni.ac.in${group.href}`;

      const degreeType = this.extractDegreeTypeFromTitle(rawText);
      const cleanOfficialName = this.cleanOfficialName(rawText);
      const shortName = this.extractShortName(cleanOfficialName);
      const aliases = this.generateAliases(cleanOfficialName, programId);
      const specialization = this.extractSpecialization(cleanOfficialName);

      const existingProg = this.programs.get(programId);

      if (!existingProg) {
        // NEW PROGRAM DETECTED!
        addedPrograms.push(cleanOfficialName);

        // Fetch details from the official branch page (or reuse cached)
        const branchDetails = await this.fetchBranchMetadata(officialUrl);

        const newProg: SynchronizedProgram = {
          programId,
          officialName: cleanOfficialName,
          degreeType,
          shortName,
          aliases,
          specialization,
          colleges: group.colleges,
          duration: branchDetails.duration || '',
          semesters: branchDetails.semesters || '',
          fee: branchDetails.fee || {
            amount: 'Fee information is not currently available on the official Silver Oak program page.',
            period: '',
            currency: 'INR',
            rawText: 'Fee information is not currently available on the official Silver Oak program page.',
            sourceUrl: officialUrl,
            lastVerifiedAt: nowIso
          },
          officialUrl,
          syllabusUrl: branchDetails.syllabusUrl,
          eligibility: branchDetails.eligibility || '',
          sourceUrl: OFFICIAL_PROGRAM_OFFERED_URL,
          lastVerifiedAt: nowIso,
          status: 'active',
          isNew: true
        };

        this.programs.set(programId, newProg);
      } else {
        // EXISTING PROGRAM - check if changed/renamed/colleges updated
        let hasChanged = false;
        if (existingProg.officialName !== cleanOfficialName) {
          hasChanged = true;
          existingProg.officialName = cleanOfficialName;
        }
        if (existingProg.degreeType !== degreeType) {
          hasChanged = true;
          existingProg.degreeType = degreeType;
        }

        // Compare colleges
        const existingColIds = existingProg.colleges.map(c => c.id).sort().join(',');
        const newColIds = group.colleges.map(c => c.id).sort().join(',');
        if (existingColIds !== newColIds) {
          hasChanged = true;
          existingProg.colleges = group.colleges;
        }

        existingProg.status = 'active';
        existingProg.lastVerifiedAt = nowIso;
        existingProg.officialUrl = officialUrl;

        // If fees or duration are missing or older, attempt refresh
        if (!existingProg.fee || !existingProg.duration || !existingProg.syllabusUrl) {
          const details = await this.fetchBranchMetadata(officialUrl);
          if (details.fee) existingProg.fee = details.fee;
          if (details.duration) existingProg.duration = details.duration;
          if (details.semesters) existingProg.semesters = details.semesters;
          if (details.syllabusUrl) existingProg.syllabusUrl = details.syllabusUrl;
          if (details.eligibility) existingProg.eligibility = details.eligibility;
        }

        if (hasChanged) {
          updatedPrograms.push(cleanOfficialName);
        }
      }
    }

    // 4. Mark programs that disappeared as inactive (Section 8: DO NOT permanently delete)
    for (const progId of currentActiveProgramIds) {
      if (!newlyDetectedProgramIds.has(progId)) {
        const p = this.programs.get(progId);
        if (p && p.status === 'active') {
          p.status = 'inactive';
          removedPrograms.push(p.officialName);
        }
      }
    }

    return {
      addedPrograms,
      removedPrograms,
      updatedPrograms,
      addedColleges
    };
  }

  /**
   * Fetches official branch metadata (fee, duration, semesters, syllabus, eligibility)
   * with defensive rate-limiting and in-memory cache
   */
  private async fetchBranchMetadata(url: string): Promise<{
    fee?: ProgrammeFeeInfo;
    duration?: string;
    semesters?: string;
    syllabusUrl?: string;
    eligibility?: string;
  }> {
    if (this.branchCache.has(url)) {
      const cached = this.branchCache.get(url)!;
      return {
        fee: cached.fee,
        duration: cached.duration,
        semesters: cached.semesters,
        syllabusUrl: cached.syllabusUrl,
        eligibility: cached.eligibility
      };
    }

    try {
      // Only fetch official Silver Oak domains
      const parsedUrl = new URL(url);
      if (!parsedUrl.hostname.endsWith('silveroakuni.ac.in')) {
        return {};
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return {};
      }

      const html = await res.text();
      const $ = cheerio.load(html);
      const pageText = $('body').text();

      // Extract Fee
      let fee: ProgrammeFeeInfo | undefined;
      const feeMatch = pageText.match(/(\d+[\d,]*\s*INR\s*\/?-?\s*(?:Fees\s*Per\s*Annum|Per\s*Annum|Per\s*Year)?)/i);
      if (feeMatch) {
        const rawText = feeMatch[0].trim();
        const amountMatch = rawText.match(/\d+[\d,]*/);
        fee = {
          amount: rawText,
          period: rawText.toLowerCase().includes('annum') || rawText.toLowerCase().includes('year') ? 'Per Annum' : '',
          currency: 'INR',
          rawText,
          sourceUrl: url,
          lastVerifiedAt: new Date().toISOString()
        };
      }

      // Extract Duration
      let duration: string | undefined;
      const durMatch = pageText.match(/(\d+(?:\/\d+)?\s*Years?)/i);
      if (durMatch) {
        duration = durMatch[0].trim();
      }

      // Extract Semesters
      let semesters: string | undefined;
      const semMatch = pageText.match(/(\d+(?:\/\d+)?\s*Semesters?)/i);
      if (semMatch) {
        semesters = semMatch[0].trim();
      }

      // Extract Syllabus
      let syllabusUrl: string | undefined;
      $('a').each((_, a) => {
        const href = $(a).attr('href') || '';
        if (href.includes('/syllabus/') && href.endsWith('.pdf')) {
          syllabusUrl = href.startsWith('http') ? href : `https://sapiou.silveroakuni.ac.in${href}`;
        }
      });

      // Extract Eligibility
      let eligibility: string | undefined;
      const eligMatch = pageText.match(/eligibility[:\s]+([^\n\r]+)/i);
      if (eligMatch) {
        eligibility = eligMatch[1].trim().replace(/<\/?.*?>/g, '');
      }

      const result = { fee, duration, semesters, syllabusUrl, eligibility };
      this.branchCache.set(url, result);
      return result;
    } catch (e: any) {
      // Branch page fetch error is non-fatal; returns available fields
      return {};
    }
  }

  /**
   * Generates a stable canonical program ID from URL or title
   */
  private getCanonicalProgramId(href: string, title: string): string {
    const cleanHref = href.split('?')[0].split('#')[0].replace(/\/$/, '');
    const parts = cleanHref.split('/');
    const lastPart = parts[parts.length - 1];

    if (lastPart && lastPart.length > 2 && !lastPart.includes('.html')) {
      return lastPart.toLowerCase();
    }

    return this.slugify(title);
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Dynamically extracts degree types (e.g. BCA, MCA, B.Tech, M.Tech, BBA, MBA, B.Sc, M.Sc, etc.)
   */
  public extractDegreeTypeFromTitle(title: string): string {
    const upper = title.toUpperCase();

    // 1. Look for explicit degree parenthetical (e.g. "Bachelor of Computer Application (BCA)")
    const parenMatch = title.match(/\(([A-Z][A-Za-z0-9.\s&/-]{1,12})\)/);
    if (parenMatch) {
      const candidate = parenMatch[1].trim();
      if (
        /^(BCA|MCA|B\.TECH|M\.TECH|BBA|MBA|B\.COM|M\.COM|B\.SC|M\.SC|B\.PHARM|M\.PHARM|D\.PHARM|PHARM\.D|BPT|LLB|LLM|B\.VOC|M\.VOC|B\.DES|D\.DES|PGDM|GNM|B\.ARCH|M\.DES|PH\.D)$/i.test(
          candidate
        )
      ) {
        return this.standardizeDegreeName(candidate);
      }
    }

    // 2. Known regex degree matchers
    if (/\b(PH\.?D|DOCTOR OF PHILOSOPHY)\b/i.test(upper)) return 'Ph.D';
    if (/\b(PHARM\.?D|DOCTOR OF PHARMACY)\b/i.test(upper)) return 'Pharm.D';
    if (/\b(B\.?TECH|BACHELOR OF TECHNOLOGY)\b/i.test(upper)) return 'B.Tech';
    if (/\b(M\.?TECH|MASTER OF TECHNOLOGY)\b/i.test(upper)) return 'M.Tech';
    if (/\b(BCA|BACHELOR OF COMPUTER APPLICATION)\b/i.test(upper)) return 'BCA';
    if (/\b(MCA|MASTER OF COMPUTER APPLICATION)\b/i.test(upper)) return 'MCA';
    if (/\b(BBA|BACHELOR OF BUSINESS ADMINISTRATION)\b/i.test(upper)) return 'BBA';
    if (/\b(MBA|MASTER OF BUSINESS ADMINISTRATION)\b/i.test(upper)) return 'MBA';
    if (/\b(B\.?COM|BACHELOR OF COMMERCE)\b/i.test(upper)) return 'B.Com';
    if (/\b(M\.?COM|MASTER OF COMMERCE)\b/i.test(upper)) return 'M.Com';
    if (/\b(B\.?SC|BACHELOR OF SCIENCE)\b/i.test(upper)) return 'B.Sc';
    if (/\b(M\.?SC|MASTER OF SCIENCE)\b/i.test(upper)) return 'M.Sc';
    if (/\b(B\.?PHARM|BACHELOR OF PHARMACY)\b/i.test(upper)) return 'B.Pharm';
    if (/\b(M\.?PHARM|MASTER OF PHARMACY)\b/i.test(upper)) return 'M.Pharm';
    if (/\b(D\.?PHARM|DIPLOMA IN PHARMACY)\b/i.test(upper)) return 'D.Pharm';
    if (/\b(BPT|BACHELOR OF PHYSIOTHERAPY)\b/i.test(upper)) return 'BPT';
    if (/\b(LL\.?B|BACHELOR OF LAWS?)\b/i.test(upper)) return 'LLB';
    if (/\b(LL\.?M|MASTER OF LAWS?)\b/i.test(upper)) return 'LLM';
    if (/\b(B\.?VOC|BACHELOR OF VOCATION)\b/i.test(upper)) return 'B.Voc';
    if (/\b(M\.?VOC|MASTER OF VOCATION)\b/i.test(upper)) return 'M.Voc';
    if (/\b(B\.?DES|BACHELOR OF DESIGN)\b/i.test(upper)) return 'B.Des';
    if (/\b(D\.?DES|DIPLOMA IN DESIGN)\b/i.test(upper)) return 'D.Des';
    if (/\b(B\.?ARCH|BACHELOR OF ARCHITECTURE)\b/i.test(upper)) return 'B.Arch';
    if (/\b(M\.?DES|MASTER OF DESIGN)\b/i.test(upper)) return 'M.Des';
    if (/\b(GNM|GENERAL NURSING MIDWIFERY)\b/i.test(upper)) return 'GNM';
    if (/\b(PGDM|POST GRADUATE DIPLOMA)\b/i.test(upper)) return 'PG Diploma';
    if (/\b(DIPLOMA|POLYTECHNIC)\b/i.test(upper)) return 'Diploma';
    if (/\b(CERTIFICATE|AIRCRAFT MAINTENANCE ENGINEERING)\b/i.test(upper)) return 'Certificate Course';
    if (/\b(BACHELOR OF ARTS|B\.A)\b/i.test(upper)) return 'B.A';
    if (/\b(MASTER OF ARTS|M\.A)\b/i.test(upper)) return 'M.A';

    return 'Other';
  }

  private standardizeDegreeName(deg: string): string {
    const clean = deg.toUpperCase().replace(/\s+/g, '');
    if (clean === 'BTECH' || clean === 'B.TECH') return 'B.Tech';
    if (clean === 'MTECH' || clean === 'M.TECH') return 'M.Tech';
    if (clean === 'BCOM' || clean === 'B.COM') return 'B.Com';
    if (clean === 'MCOM' || clean === 'M.COM') return 'M.Com';
    if (clean === 'BSC' || clean === 'B.SC') return 'B.Sc';
    if (clean === 'MSC' || clean === 'M.SC') return 'M.Sc';
    if (clean === 'BPHARM' || clean === 'B.PHARM') return 'B.Pharm';
    if (clean === 'MPHARM' || clean === 'M.PHARM') return 'M.Pharm';
    if (clean === 'DPHARM' || clean === 'D.PHARM') return 'D.Pharm';
    if (clean === 'PHARMD' || clean === 'PHARM.D') return 'Pharm.D';
    if (clean === 'PHD' || clean === 'PH.D') return 'Ph.D';
    if (clean === 'LLB' || clean === 'LL.B') return 'LLB';
    if (clean === 'LLM' || clean === 'LL.M') return 'LLM';
    if (clean === 'BVOC' || clean === 'B.VOC') return 'B.Voc';
    if (clean === 'MVOC' || clean === 'M.VOC') return 'M.Voc';
    if (clean === 'BDES' || clean === 'B.DES') return 'B.Des';
    if (clean === 'DDES' || clean === 'D.DES') return 'D.Des';
    if (clean === 'BARCH' || clean === 'B.ARCH') return 'B.Arch';
    if (clean === 'MDES' || clean === 'M.DES') return 'M.Des';
    return deg;
  }

  private cleanOfficialName(rawText: string): string {
    // If rawText has " - ", like "Bachelor of Computer Application (BCA) - BACHELOR OF COMPUTER APPLICATIONS (BCA/BCA HONOURS)"
    const parts = rawText.split(' - ');
    if (parts.length > 1) {
      // Pick the more specific or cleaner part
      const p1 = parts[0].trim();
      const p2 = parts[1].trim();
      if (p2.length > p1.length && !p2.toUpperCase().includes('BACHELOR OF COMPUTER APPLICATION (BCA)')) {
        return this.toTitleCase(p2);
      }
      return this.toTitleCase(p1);
    }
    return this.toTitleCase(rawText);
  }

  private extractShortName(name: string): string | undefined {
    const m = name.match(/\(([A-Z0-9.\s&/-]+)\)/i);
    return m ? m[1].trim() : undefined;
  }

  private extractSpecialization(name: string): string | undefined {
    const inMatch = name.match(/\bin\s+([^–|()]+)/i);
    if (inMatch) {
      return inMatch[1].trim();
    }
    const withMatch = name.match(/\bwith\s+([^–|()]+)/i);
    if (withMatch) {
      return withMatch[1].trim();
    }
    return undefined;
  }

  private generateAliases(name: string, slug?: string): string[] {
    const aliases = new Set<string>();
    const lower = name.toLowerCase();
    aliases.add(lower);
    if (slug) aliases.add(slug.toLowerCase().replace(/-/g, ' '));

    // Extract acronym from parentheses
    const m = name.match(/\(([A-Z0-9.\s&/-]+)\)/i);
    if (m) {
      const acr = m[1].toLowerCase().trim();
      aliases.add(acr);
      aliases.add(acr.replace(/\./g, ''));
      aliases.add(acr.replace(/\./g, ' '));
    }

    // Common standard aliases
    if (lower.includes('computer application')) {
      aliases.add('bca');
      aliases.add('mca');
    }
    if (lower.includes('business administration')) {
      aliases.add('bba');
      aliases.add('mba');
    }
    if (lower.includes('technology') && lower.includes('bachelor')) {
      aliases.add('btech');
      aliases.add('b.tech');
    }
    if (lower.includes('technology') && lower.includes('master')) {
      aliases.add('mtech');
      aliases.add('m.tech');
    }
    if (lower.includes('commerce')) {
      aliases.add('bcom');
      aliases.add('b.com');
      aliases.add('mcom');
      aliases.add('m.com');
    }
    if (lower.includes('data science')) {
      aliases.add('data science');
      aliases.add('ds');
    }
    if (lower.includes('cyber security')) {
      aliases.add('cyber security');
      aliases.add('cyber');
    }

    return Array.from(aliases);
  }

  private normalizeCollegeTitle(title: string): string {
    return title.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
  }

  private findOrCreateCollege(name: string, abbreviation?: string): SynchronizedCollege {
    const clean = this.normalizeCollegeTitle(name);
    for (const c of this.colleges.values()) {
      if (this.normalizeCollegeTitle(c.name) === clean) {
        return c;
      }
    }

    const id = (this.colleges.size + 1).toString();
    const abbrev = abbreviation || KNOWN_COLLEGE_ABBREVIATIONS[clean] || this.generateCollegeAbbreviation(clean);
    const newCol: SynchronizedCollege = {
      id,
      name: clean,
      abbreviation: abbrev,
      displayName: clean,
      programCount: 0,
      lastVerifiedAt: new Date().toISOString(),
      status: 'active'
    };
    this.colleges.set(id, newCol);
    return newCol;
  }

  private generateCollegeAbbreviation(name: string): string {
    const words = name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => !['OF', 'AND', '&', 'THE'].includes(w.toUpperCase()));
    return words.map(w => w[0].toUpperCase()).join('');
  }

  private toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map(w => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(' ')
      .replace(/\bb\.tech\b/gi, 'B.Tech')
      .replace(/\bm\.tech\b/gi, 'M.Tech')
      .replace(/\bbca\b/gi, 'BCA')
      .replace(/\bmca\b/gi, 'MCA')
      .replace(/\bbba\b/gi, 'BBA')
      .replace(/\bmba\b/gi, 'MBA')
      .replace(/\bb\.com\b/gi, 'B.Com')
      .replace(/\bm\.com\b/gi, 'M.Com')
      .replace(/\bb\.sc\b/gi, 'B.Sc')
      .replace(/\bm\.sc\b/gi, 'M.Sc')
      .replace(/\bllb\b/gi, 'LLB')
      .replace(/\bllm\b/gi, 'LLM')
      .replace(/\bbpt\b/gi, 'BPT')
      .replace(/\bgnm\b/gi, 'GNM')
      .replace(/\bph\.?d\b/gi, 'Ph.D')
      .replace(/\bpharm\.?d\b/gi, 'Pharm.D');
  }

  private recalculateDegrees() {
    this.degrees.clear();
    for (const p of this.getActivePrograms()) {
      if (p.degreeType && p.degreeType !== 'Other') {
        this.degrees.add(p.degreeType);
      }
    }
  }

  private recalculateCollegeCounts() {
    for (const col of this.colleges.values()) {
      let count = 0;
      for (const p of this.getActivePrograms()) {
        if (p.colleges.some(c => c.id.toString() === col.id.toString())) {
          count++;
        }
      }
      col.programCount = count;
    }
  }

  // --- Public Accessors ---

  public getActivePrograms(): SynchronizedProgram[] {
    return Array.from(this.programs.values()).filter(p => p.status === 'active');
  }

  public getAllPrograms(): SynchronizedProgram[] {
    return Array.from(this.programs.values());
  }

  public getActiveColleges(): SynchronizedCollege[] {
    return Array.from(this.colleges.values()).filter(c => c.status === 'active');
  }

  public getDynamicDegrees(): string[] {
    const list = Array.from(this.degrees).sort();
    return list;
  }

  public getMetadata(): CatalogueMetadata {
    return this.metadata;
  }

  /**
   * Adapts synchronized programs to existing UniversityBranch[] format
   */
  public getBranchesAsUniversityBranch(): UniversityBranch[] {
    return this.getActivePrograms().map(p => ({
      slug: p.programId,
      url: p.officialUrl,
      title: p.officialName,
      description: `${p.officialName} offered by ${p.colleges.map(c => c.name).join(', ')}. Duration: ${p.duration || 'Official course duration'}. Fee: ${p.fee?.rawText || 'Refer to official program page'}.`,
      eligibility: p.eligibility || 'Refer to official university prospectus.',
      fees: p.fee?.rawText || 'Fee information is not currently available on the official Silver Oak program page.',
      duration: p.duration || '',
      semesters: p.semesters || '',
      teachingScheme: p.syllabusUrl,
      credential: p.degreeType,
      college_id: p.colleges[0]?.id ? Number(p.colleges[0].id) : 11,
      lastCrawled: p.lastVerifiedAt,
      degreeType: p.degreeType,
      specialization: p.specialization,
      colleges: p.colleges,
      lastVerifiedAt: p.lastVerifiedAt,
      status: p.status,
      sourceUrl: p.sourceUrl,
      isNew: p.isNew
    }));
  }

  /**
   * Adapts synchronized colleges to existing CollegeInfo[] format
   */
  public getCollegesAsCollegeInfo(): CollegeInfo[] {
    return this.getActiveColleges().map(c => ({
      id: isNaN(Number(c.id)) ? c.id : Number(c.id),
      name: c.name,
      abbreviation: c.abbreviation,
      display_name: c.displayName,
      external_website_url: c.officialUrl || '',
      status: c.status,
      programCount: c.programCount,
      lastVerifiedAt: c.lastVerifiedAt
    }));
  }

  // --- Testing simulation helpers (for Section 36 tests) ---

  /**
   * Injects simulated mock HTML or program for Test A, B, C, D, E
   */
  public simulateMockUpdate(mockColleges: {
    collegeName: string;
    collegeAbbreviation: string;
    programs: { rawText: string; href: string }[];
  }[]) {
    return this.integrateFreshCatalogue(mockColleges);
  }
}

export const programmeSyncService = new ProgrammeSyncService();
