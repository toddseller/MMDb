// The same 5-second limit as the web app's Tautulli and TMDB calls.
const TIMEOUT_MS = 5000

export const getJson = async <T>(url: string, name: string, headers: Record<string, string> = {}): Promise<T> => {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) throw new Error(`${name} answered ${response.status}`)
  return response.json() as Promise<T>
}
