/**
 * Shared USA location detection for all scanner sources.
 * Returns true if the location string indicates a US-based job (or is unknown/empty).
 */

const US_KEYWORDS = [
  "united states", "usa", "u.s.a", "u.s.", " us ", "us,", "us-",
  // states
  "alabama","alaska","arizona","arkansas","california","colorado","connecticut",
  "delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa",
  "kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan",
  "minnesota","mississippi","missouri","montana","nebraska","nevada",
  "new hampshire","new jersey","new mexico","new york","north carolina",
  "north dakota","ohio","oklahoma","oregon","pennsylvania","rhode island",
  "south carolina","south dakota","tennessee","texas","utah","vermont",
  "virginia","washington","west virginia","wisconsin","wyoming",
  // abbreviations (bordered)
  " ca,", " ny,", " tx,", " wa,", " il,", " fl,", " co,", " ma,", " ga,", " nc,",
  " va,", " pa,", " oh,", " nj,", " mi,", " or,", " az,", " mn,", " wi,", " md,",
  // major cities
  "san francisco","san jose","new york","nyc","los angeles","seattle","chicago",
  "austin","boston","denver","atlanta","miami","brooklyn","san diego",
  "menlo park","mountain view","palo alto","redwood city","sunnyvale",
  "cupertino","bellevue","kirkland","cambridge","washington dc","dallas",
  "houston","phoenix","philadelphia","portland","san antonio","detroit",
  "charlotte","nashville","indianapolis","raleigh","minneapolis","pittsburgh",
];

const NON_US_KEYWORDS = [
  "canada","toronto","vancouver","montreal","calgary","ottawa",
  "united kingdom"," uk,"," uk ","london","manchester","edinburgh","glasgow",
  "germany","berlin","munich","frankfurt","hamburg",
  "france","paris","lyon",
  "india","bangalore","bengaluru","hyderabad","pune","mumbai","chennai","delhi","gurgaon","noida",
  "australia","sydney","melbourne","brisbane","perth",
  "singapore","japan","tokyo","osaka","china","beijing","shanghai","shenzhen",
  "hong kong","korea","seoul","taiwan","taipei","philippines","manila","vietnam","hanoi",
  "brazil","são paulo","sao paulo","mexico","mexico city","guadalajara",
  "netherlands","amsterdam","rotterdam","ireland","dublin","sweden","stockholm",
  "spain","madrid","barcelona","italy","rome","milan","poland","warsaw",
  "israel","tel aviv","uae","dubai","south africa","cape town","argentina",
  "chile","colombia","bogotá","bogota","peru","lima","turkey","istanbul",
  "russia","moscow","ukraine","kyiv","kiev","romania","bucharest",
  "norway","oslo","denmark","copenhagen","finland","helsinki","greece","athens",
  "emea","apac","latam","europe","asia","africa","oceania",
];

const REMOTE_KEYWORDS = [
  "remote","anywhere","worldwide","global","wfh","work from home",
];

export function isUSLocation(location: string | null | undefined): boolean {
  if (!location || location.trim() === "") return true;
  const loc = ` ${location.toLowerCase()} `;

  // Explicit non-US beats everything
  if (NON_US_KEYWORDS.some((kw) => loc.includes(kw))) {
    // But if it *also* explicitly mentions US, include it (e.g. "Remote US / Canada")
    if (US_KEYWORDS.some((kw) => loc.includes(kw))) {
      return true;
    }
    return false;
  }

  if (US_KEYWORDS.some((kw) => loc.includes(kw))) return true;

  // Pure "Remote" with no country → assume US (all tracked companies are US-based)
  if (REMOTE_KEYWORDS.some((kw) => loc.includes(kw))) return true;

  // Unknown → keep (err on inclusion, match filter catches off-topic later)
  return true;
}

/** Returns true if the ISO date string is within `hours` of now. */
export function isFresh(dateStr: string | null | undefined, hours = 24): boolean {
  if (!dateStr) return false;
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return false;
  const now = Date.now();
  return now - then <= hours * 60 * 60 * 1000;
}
