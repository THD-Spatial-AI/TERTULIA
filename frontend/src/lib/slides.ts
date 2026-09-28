/** Turn a Google Slides share URL into its embeddable form; other URLs pass through. */
export function toEmbedUrl(url: string): string {
  const m = url.match(/\/presentation\/d\/([^/]+)/)
  if (!m) return url
  return `https://docs.google.com/presentation/d/${m[1]}/embed?start=false&loop=false&delayms=60000`
}
