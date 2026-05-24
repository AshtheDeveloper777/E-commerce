/** Parse JSON API responses; surface HTML/error pages from misconfigured routes. */
export async function parseApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    if (text.includes('<!doctype') || text.includes('<html')) {
      throw new Error(
        'API route not found. Redeploy with latest code or check Vercel env vars (DATABASE_URL).'
      );
    }
    throw new Error('Invalid server response.');
  }

  return response.json();
}
