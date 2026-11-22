// Cloudflare Pages Function: returns the visitor's approximate city (from Cloudflare's edge).
export async function onRequest({ request }) {
  const cf = request.cf || {}
  return new Response(JSON.stringify({ city: cf.city || null, country: cf.country || null }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}
