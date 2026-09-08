/**
 * Home Screen / lock-screen setup video.
 * Paste your YouTube video id when the iPhone + Android walkthrough is ready.
 * Example: youtubeVideoId: 'dQw4w9WgXcQ'
 */
export const installGuide = {
  youtubeVideoId: '',
  youtubeUrl: '',
} as const;

export function installGuideEmbedUrl() {
  const id = installGuide.youtubeVideoId.trim();
  if (id) return `https://www.youtube.com/embed/${id}`;
  const url = installGuide.youtubeUrl.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const shortId = parsed.pathname.replace('/', '');
      return shortId ? `https://www.youtube.com/embed/${shortId}` : null;
    }
    const queryId = parsed.searchParams.get('v');
    return queryId ? `https://www.youtube.com/embed/${queryId}` : url;
  } catch {
    return null;
  }
}
