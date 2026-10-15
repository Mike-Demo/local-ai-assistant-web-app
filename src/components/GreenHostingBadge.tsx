import { Globe, Sprout } from 'lucide-react';
import { GREEN_CHECK_URL as CHECK_URL, SITE_URL } from '@/lib/site';

const SITE = new URL(SITE_URL).host;
const PROVIDER = 'Cloudflare';

// Recreated locally: the official badge image is a third-party request blocked by the site's CSP.
export function GreenHostingBadge() {
  return (
    <a
      href={CHECK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group block w-[200px] rounded-md border-2 border-[#1e3a2b] bg-white text-left text-[#1e3a2b] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ba85b] focus-visible:ring-offset-2 dark:ring-offset-neutral-950"
    >
      <span className="flex items-start justify-between gap-2 px-2.5 pt-1.5">
        <span className="text-[15px] font-semibold leading-tight tracking-wide">GREEN HOSTING</span>
        <span className="relative mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center" aria-hidden>
          <Globe className="h-6 w-6 text-[#1e3a2b]" strokeWidth={1.5} />
          <Sprout className="absolute -top-1.5 left-1/2 h-4 w-4 -translate-x-1/2 text-[#3ba85b] transition group-hover:scale-110" strokeWidth={2.25} />
        </span>
      </span>
      <span className="block truncate px-2.5 text-[11px] leading-snug">{SITE}</span>
      <span className="block px-2.5 pb-1.5 text-[11px] leading-snug">Hosted by {PROVIDER}</span>
      <span className="block border-t-2 border-[#1e3a2b] px-2.5 py-1 text-[11px] font-semibold tracking-wide">
        GREEN WEB FOUNDATION
      </span>
      <span className="sr-only">(opens the Green Web Foundation check in a new tab)</span>
    </a>
  );
}
