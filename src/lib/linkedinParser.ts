// LinkedIn URL parsing utilities for executive role detection

export interface LinkedInParseResult {
  detectedRole?: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  rawUrl: string;
  suggestions?: string[];
}

// Common LinkedIn URL patterns
const LINKEDIN_URL_PATTERNS = [
  /linkedin\.com\/in\/([^\/\?]+)/i,
  /linkedin\.com\/pub\/([^\/\?]+)/i,
  /linkedin\.com\/profile\/view\?id=([^&]+)/i,
];

// Role keywords that can be extracted from LinkedIn profile slugs
const ROLE_KEYWORDS_MAP: Record<string, string[]> = {
  'CEO / Chief Executive Officer': ['ceo', 'chief-executive', 'chief_executive'],
  'CTO / Chief Technology Officer': ['cto', 'chief-technology', 'chief_technology', 'tech-lead'],
  'COO / Chief Operating Officer': ['coo', 'chief-operating', 'chief_operations'],
  'CFO / Chief Financial Officer': ['cfo', 'chief-financial', 'chief_finance'],
  'CMO / Chief Marketing Officer': ['cmo', 'chief-marketing'],
  'VP / Vice President': ['vp', 'vice-president', 'vice_president'],
  'Director': ['director', 'dir'],
  'Head of Department': ['head-of', 'head_of'],
  'Founder / Co-Founder': ['founder', 'co-founder', 'cofounder'],
  'Managing Director': ['md', 'managing-director', 'managing_director'],
  'Partner / Principal': ['partner', 'principal'],
  'General Manager': ['gm', 'general-manager', 'general_manager'],
};

// Industry keywords for suggestions
const INDUSTRY_KEYWORDS = [
  'tech', 'technology', 'software', 'fintech', 'finance',
  'health', 'healthcare', 'ecommerce', 'retail', 'media',
  'consulting', 'manufacturing', 'education', 'saas',
];

export function parseLinkedInUrl(url: string): LinkedInParseResult {
  const result: LinkedInParseResult = {
    confidence: 'none',
    rawUrl: url.trim(),
    suggestions: [],
  };

  if (!url || url.trim().length === 0) {
    return result;
  }

  // Try to extract profile slug
  let profileSlug: string | null = null;
  
  for (const pattern of LINKEDIN_URL_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      profileSlug = match[1].toLowerCase();
      break;
    }
  }

  if (!profileSlug) {
    // Check if it's just a name/slug without full URL
    if (!url.includes('http') && !url.includes('.com')) {
      profileSlug = url.toLowerCase().replace(/\s+/g, '-');
      result.confidence = 'low';
    } else {
      return result;
    }
  }

  // Clean the slug
  const cleanSlug = profileSlug
    .replace(/[0-9]+/g, '') // Remove numbers
    .replace(/--+/g, '-') // Remove duplicate dashes
    .trim();

  // Try to detect role from slug
  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS_MAP)) {
    for (const keyword of keywords) {
      if (cleanSlug.includes(keyword)) {
        result.detectedRole = role;
        result.confidence = cleanSlug.includes(keyword) ? 'medium' : 'low';
        break;
      }
    }
    if (result.detectedRole) break;
  }

  // Detect industry suggestions
  for (const industry of INDUSTRY_KEYWORDS) {
    if (cleanSlug.includes(industry)) {
      result.suggestions?.push(industry);
    }
  }

  // If we found a LinkedIn URL but no role, still set low confidence
  if (!result.detectedRole && profileSlug) {
    result.confidence = 'low';
    // Suggest common executive roles
    result.suggestions = ['Founder / Co-Founder', 'CEO / Chief Executive Officer', 'Director'];
  }

  return result;
}

export function isValidLinkedInUrl(url: string): boolean {
  if (!url || url.trim().length === 0) return true; // Empty is valid (optional field)
  
  const trimmed = url.trim().toLowerCase();
  
  // Check if it contains linkedin.com
  if (trimmed.includes('linkedin.com')) {
    return LINKEDIN_URL_PATTERNS.some(pattern => pattern.test(trimmed));
  }
  
  // Allow plain profile slugs/names (e.g., "john-doe-ceo")
  return trimmed.length > 2 && trimmed.length < 100;
}
