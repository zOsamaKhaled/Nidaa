/**
 * Extract a YouTube video id from common URL shapes, or null if not YouTube:
 *   - https://www.youtube.com/watch?v=ID
 *   - https://youtu.be/ID
 *   - https://www.youtube.com/embed/ID
 *   - https://music.youtube.com/watch?v=ID
 *   - https://www.youtube.com/shorts/ID
 */
export function parseYouTubeId(url: string | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  // Bare 11-char id
  if (/^[a-zA-Z0-9_-]{11}$/.test(u)) return u;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = u.match(re);
    if (m) return m[1];
  }
  return null;
}

export function isYouTubeUrl(url: string | undefined): boolean {
  return parseYouTubeId(url) !== null;
}
