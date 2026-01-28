import slugify from 'slugify';
import { customAlphabet } from 'nanoid';

// Create a nanoid generator with URL-safe characters
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6);

/**
 * Generate a unique slug from a title
 * Format: slugified-title-random6
 */
export function generateSlug(title: string): string {
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });
  
  const randomSuffix = nanoid();
  
  return `${baseSlug}-${randomSuffix}`;
}

/**
 * Validate if a string is a valid slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
