interface T { morning: string; day: string; evening: string; night: string; back: string }
const L: Record<string, T> = {
  en: { morning: 'Good morning', day: 'Good afternoon', evening: 'Good evening', night: 'Good night', back: 'Welcome back' },
  ru: { morning: 'Доброе утро', day: 'Добрый день', evening: 'Добрый вечер', night: 'Доброй ночи', back: 'С возвращением' },
  tr: { morning: 'Günaydın', day: 'İyi günler', evening: 'İyi akşamlar', night: 'İyi geceler', back: 'Tekrar hoş geldin' },
  uz: { morning: 'Xayrli tong', day: 'Xayrli kun', evening: 'Xayrli kech', night: 'Xayrli tun', back: 'Qaytganingiz bilan' },
  es: { morning: 'Buenos días', day: 'Buenas tardes', evening: 'Buenas noches', night: 'Buenas noches', back: 'Bienvenido de nuevo' },
  de: { morning: 'Guten Morgen', day: 'Guten Tag', evening: 'Guten Abend', night: 'Gute Nacht', back: 'Willkommen zurück' },
}
const KNOWN: Record<string, string> = { tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', telegram: 'Telegram' }

let info: { returning: boolean; from: string | null } | null = null
function getInfo() {
  if (info) return info
  let returning = false
  try { returning = !!localStorage.getItem('ancient_seen'); localStorage.setItem('ancient_seen', '1') } catch { /* ignore */ }
  let from: string | null = null
  const q = (new URLSearchParams(location.search).get('from') || '').toLowerCase()
  if (/^[a-z0-9_-]{1,20}$/.test(q)) from = KNOWN[q] || q.charAt(0).toUpperCase() + q.slice(1)
  else {
    const r = document.referrer.toLowerCase()
    if (r.includes('tiktok')) from = 'TikTok'
    else if (r.includes('instagram')) from = 'Instagram'
    else if (r.includes('t.me') || r.includes('telegram')) from = 'Telegram'
  }
  return (info = { returning, from })
}

/** e.g. "Welcome back · Good evening · Istanbul · TikTok" in the visitor's language. */
export function makeLine(city?: string | null) {
  const t = L[(navigator.language || 'en').slice(0, 2).toLowerCase()] || L.en
  const h = new Date().getHours()
  const part = h >= 5 && h < 12 ? t.morning : h >= 12 && h < 18 ? t.day : h >= 18 && h < 23 ? t.evening : t.night
  const { returning, from } = getInfo()
  return [returning ? t.back : null, part, city || null, from].filter(Boolean).join(' · ')
}

export async function fetchCity(): Promise<string | null> {
  try {
    const c = new AbortController()
    const timer = setTimeout(() => c.abort(), 2500)
    const r = await fetch('/api/geo', { signal: c.signal })
    clearTimeout(timer)
    if (!r.ok) return null
    const j = await r.json()
    return typeof j.city === 'string' ? j.city : null
  } catch { return null }
}
