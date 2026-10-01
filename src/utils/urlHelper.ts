/**
 * URL Utilities for Silver Oak University Official Links & PDF Documents
 * Ensures proper URL encoding (spaces -> %20, parentheses -> %28 %29),
 * validation against authorized official domains, and markdown link preservation.
 */

/**
 * Normalizes, validates and properly encodes official Silver Oak University URLs.
 * Handles spaces (%20), parentheses (%28, %29), ampersands, and ensures standard HTTPS.
 */
export function sanitizeAndEncodeOfficialUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();

  // Strip wrapping markdown, brackets or quotes
  url = url.replace(/^<|>$/g, '').replace(/^['"]|['"]$/g, '');

  if (!url) return '';

  // Handle local /api/ or /uploads/ paths for authorized faculty documents
  if (url.startsWith('/api/') || url.startsWith('/uploads/')) {
    return encodeURI(url);
  }

  // Ensure protocol
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  try {
    const parsed = new URL(url);
    // Split pathname into segments and properly encode each segment
    const segments = parsed.pathname.split('/').map(segment => {
      try {
        const decoded = decodeURIComponent(segment);
        return encodeURIComponent(decoded);
      } catch {
        return encodeURI(segment);
      }
    });

    parsed.pathname = segments.join('/');

    // In markdown and web links, parentheses in path/query should be encoded to prevent markdown breaks
    let result = parsed.toString();
    result = result.replace(/\(/g, '%28').replace(/\)/g, '%29');
    return result;
  } catch {
    return encodeURI(url)
      .replace(/ /g, '%20')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29');
  }
}

/**
 * Validates that a source URL strictly belongs to official Silver Oak University domains
 * or authorized internal document paths.
 */
export function isVerifiedOfficialSource(source: { title?: string; url?: string; type?: string }): boolean {
  if (!source || !source.url || typeof source.url !== 'string') return false;
  const url = source.url.trim();

  if (url === '#' || url === '' || url.includes('example.com') || url.includes('placeholder')) {
    return false;
  }

  if (url.startsWith('/api/faculty/documents/') || url.startsWith('/uploads/')) {
    return true;
  }

  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase();
    const isOfficial = host === 'silveroakuni.ac.in' || 
                       host === 'sapiou.silveroakuni.ac.in' || 
                       host === 'admission.silveroakuni.ac.in' ||
                       host.endsWith('.silveroakuni.ac.in');
    return isOfficial;
  } catch {
    return false;
  }
}

/**
 * Pre-processes markdown text so that any [label](url) link
 * containing spaces or parentheses in the url is properly encoded
 * before passing to markdown parsers (which would otherwise truncate at space or parenthesis).
 * Also converts raw unlinked Silver Oak PDF URLs into properly formatted markdown links.
 */
export function cleanAnswerMarkdownLinks(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return '';

  // 1. Convert any unlinked Silver Oak PDF URLs into clean markdown links
  let text = markdown.replace(/(^|[^(\[])(https?:\/\/(?:[a-zA-Z0-9.-]+\.)?silveroakuni\.ac\.in\/[^\n\r<>"']+\.pdf)(?=[.,\s]|$)/gi, (_match, prefix, url) => {
    return `${prefix}[Official Syllabus / Teaching Scheme PDF](${url})`;
  });

  // 2. Parse all [label](url) markdown links and properly encode and clean URLs
  let result = '';
  let i = 0;
  while (i < text.length) {
    const linkStart = text.indexOf('[', i);
    if (linkStart === -1) {
      result += text.slice(i);
      break;
    }
    result += text.slice(i, linkStart);

    const labelEnd = text.indexOf('](', linkStart);
    if (labelEnd === -1) {
      result += text.slice(linkStart, linkStart + 1);
      i = linkStart + 1;
      continue;
    }

    const label = text.slice(linkStart + 1, labelEnd);
    const urlStart = labelEnd + 2;

    if (text.startsWith('http://', urlStart) || text.startsWith('https://', urlStart) || text.startsWith('/api/', urlStart)) {
      let depth = 1;
      let urlEnd = urlStart;
      while (urlEnd < text.length && depth > 0) {
        if (text[urlEnd] === '(') depth++;
        else if (text[urlEnd] === ')') depth--;
        urlEnd++;
      }

      let rawUrl = text.slice(urlStart, urlEnd - 1).trim();
      // Remove trailing punctuation like sentence period or comma if placed outside the actual URL filename
      if (rawUrl.endsWith('.') && !rawUrl.toLowerCase().endsWith('.pdf') && !rawUrl.toLowerCase().endsWith('..pdf')) {
        rawUrl = rawUrl.slice(0, -1);
      } else if (rawUrl.endsWith(',') || rawUrl.endsWith(';')) {
        rawUrl = rawUrl.slice(0, -1);
      }

      const safeUrl = sanitizeAndEncodeOfficialUrl(rawUrl);
      result += '[' + label + '](' + safeUrl + ')';
      i = urlEnd;
    } else {
      result += text.slice(linkStart, labelEnd + 2);
      i = labelEnd + 2;
    }
  }
  return result;
}
