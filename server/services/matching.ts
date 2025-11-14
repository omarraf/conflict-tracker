/**
 * Geographic Matching Utilities
 * Helps match auto-ingested conflicts to existing curated conflicts
 */

import type { Conflict } from '@shared/schema';

/**
 * Calculate distance between two geographic points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Check if two arrays have at least one common element
 */
export function hasCommonElement<T>(arr1: T[], arr2: T[]): boolean {
  return arr1.some(item => arr2.includes(item));
}

/**
 * Calculate similarity between two strings (0-1, higher is more similar)
 * Uses simple word overlap comparison
 */
export function calculateNameSimilarity(name1: string, name2: string): number {
  const words1 = name1.toLowerCase().split(/\s+/);
  const words2 = name2.toLowerCase().split(/\s+/);

  // Count common words
  const commonWords = words1.filter(word =>
    words2.includes(word) && word.length > 3 // Ignore small words like "the", "in"
  );

  if (words1.length === 0 || words2.length === 0) return 0;

  // Similarity is the ratio of common words to total unique words
  const uniqueWords = new Set([...words1, ...words2]);
  return commonWords.length / uniqueWords.size;
}

/**
 * Find matching curated conflict for an auto-ingested conflict
 * Returns the best matching conflict or null if no good match found
 */
export function findMatchingCuratedConflict(
  autoConflict: {
    name: string;
    latitude: number;
    longitude: number;
    countries: string[];
  },
  curatedConflicts: Conflict[]
): Conflict | null {
  let bestMatch: Conflict | null = null;
  let bestScore = 0;

  for (const curated of curatedConflicts) {
    // Skip auto-ingested conflicts (only match to curated ones)
    if (curated.isAutoIngested) continue;

    // Skip resolved conflicts (don't add recent news to resolved conflicts)
    if (curated.status === 'resolved') continue;

    // Calculate geographic distance
    const distance = calculateDistance(
      autoConflict.latitude,
      autoConflict.longitude,
      curated.latitude,
      curated.longitude
    );

    // Skip if too far away (>200km for flexibility, some conflicts span large areas)
    if (distance > 200) continue;

    // Check for country overlap
    const hasCountryOverlap = hasCommonElement(
      autoConflict.countries,
      curated.countries
    );

    // Check name similarity
    const nameSimilarity = calculateNameSimilarity(
      autoConflict.name,
      curated.name
    );

    // Calculate overall match score
    let score = 0;

    // Geographic proximity (closer is better)
    if (distance < 50) score += 3;    // Very close
    else if (distance < 100) score += 2; // Close
    else score += 1;                   // Moderate

    // Country overlap (strong signal)
    if (hasCountryOverlap) score += 3;

    // Name similarity (moderate signal)
    if (nameSimilarity > 0.3) score += 2;
    if (nameSimilarity > 0.5) score += 1; // Bonus for high similarity

    // Update best match if this score is higher
    if (score > bestScore && score >= 4) { // Require minimum score of 4
      bestScore = score;
      bestMatch = curated;
    }
  }

  return bestMatch;
}

/**
 * Check if a recent article already exists in the list
 * (prevents duplicates)
 */
export function isDuplicateArticle(
  article: { url: string; title: string },
  existingArticles: Array<{ url: string; title: string }>
): boolean {
  return existingArticles.some(
    existing =>
      existing.url === article.url ||
      existing.title === article.title
  );
}

/**
 * Keep only recent articles from last 7 days
 */
export function filterRecentArticles(
  articles: Array<{ publishedAt: string; url: string; title: string; source: string }>
): Array<{ publishedAt: string; url: string; title: string; source: string }> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return articles.filter(article => {
    const publishDate = new Date(article.publishedAt);
    return publishDate >= sevenDaysAgo;
  });
}
