export interface SeoAnalysis {
  score: number;
  wordCount: number;
  keywordInTitle: boolean;
  keywordInFirstPara: boolean;
  keywordCount: number;
  headingCount: number;
  suggestions: string[];
}

export function analyzeSeo(
  title: string,
  content: string,
  primaryKeyword: string
): SeoAnalysis {
  const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const keyword = primaryKeyword.toLowerCase().trim();

  const keywordInTitle = keyword.length > 0 && title.toLowerCase().includes(keyword);

  const firstPara = content.match(/<p[^>]*>(.*?)<\/p>/i)?.[1]?.replace(/<[^>]+>/g, '') || '';
  const keywordInFirstPara = keyword.length > 0 && firstPara.toLowerCase().includes(keyword);

  const keywordRegex = keyword.length > 0 ? new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi') : null;
  const keywordCount = keywordRegex ? (plainText.match(keywordRegex) || []).length : 0;

  const headingCount = (content.match(/<h[2-4][^>]*>/gi) || []).length;

  let score = 0;
  const suggestions: string[] = [];

  // Word count (30 pts)
  if (wordCount >= 1200) score += 30;
  else if (wordCount >= 800) score += 25;
  else if (wordCount >= 500) score += 15;
  else score += 5;
  if (wordCount < 800) suggestions.push('Aim for 800–1500 words for better ranking.');

  // Keyword in title (15 pts)
  if (keywordInTitle) score += 15;
  else if (keyword) suggestions.push('Include primary keyword in the title.');

  // Keyword in first paragraph (15 pts)
  if (keywordInFirstPara) score += 15;
  else if (keyword) suggestions.push('Use primary keyword in the first paragraph.');

  // Keyword frequency (20 pts)
  if (keywordCount >= 3) score += 20;
  else if (keywordCount >= 2) score += 15;
  else if (keywordCount >= 1) score += 10;
  else if (keyword) suggestions.push('Use primary keyword at least 2–3 times in content.');

  // Headings (20 pts)
  if (headingCount >= 3) score += 20;
  else if (headingCount >= 2) score += 15;
  else if (headingCount >= 1) score += 10;
  else suggestions.push('Add 2–3 subheadings (H2, H3) for better readability.');

  return { score: Math.min(score, 100), wordCount, keywordInTitle, keywordInFirstPara, keywordCount, headingCount, suggestions };
}

export function generateKeywords(title: string): { primary: string; related: string[] } {
  const words = title.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3);
  const stopwords = ['that', 'this', 'with', 'from', 'your', 'what', 'when', 'where', 'which', 'they', 'have', 'been', 'most', 'people', 'does', 'will', 'about'];
  const keywords = words.filter(w => !stopwords.includes(w));

  const primary = keywords.slice(0, 3).join(' ') || title.toLowerCase();

  const related: string[] = [];
  if (keywords.length >= 2) {
    for (let i = 0; i < Math.min(keywords.length - 1, 5); i++) {
      related.push(`${keywords[i]} ${keywords[i + 1]}`);
    }
  }
  related.push(`how to ${keywords[0] || ''}`.trim());
  related.push(`best ${keywords[0] || ''} tips`.trim());
  related.push(`${keywords[0] || ''} guide`.trim());
  related.push(`${keywords[0] || ''} strategies`.trim());
  related.push(`why ${keywords.slice(0, 2).join(' ')}`.trim());

  return { primary, related: related.filter(r => r.length > 3).slice(0, 10) };
}
