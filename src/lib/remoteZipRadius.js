// Utility to fetch zip codes within a radius from a remote API (ZipCodeAPI example)
// Requires process.env.ZIPCODE_API_KEY

export async function fetchZipCodesWithinRadius(homeZip, radiusMiles) {
  const apiKey = process.env.ZIPCODE_API_KEY;
  if (!apiKey) throw new Error('ZIPCODE_API_KEY not set');
  const url = `https://www.zipcodeapi.com/rest/${apiKey}/radius.json/${homeZip}/${radiusMiles}/mile`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch zip codes');
  const data = await res.json();
  // ZipCodeAPI returns: { zip_codes: [{zip_code: '12345', distance: 0, ...}, ...] }
  return (data.zip_codes || []).map(z => z.zip_code);
}
