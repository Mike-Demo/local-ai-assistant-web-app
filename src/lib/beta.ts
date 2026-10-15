// Bump when the beta terms change so everyone is asked to agree again.
export const BETA_TERMS_VERSION = '2026-10-15';
export const BETA_TERMS_UPDATED = 'October 15, 2026';
export const BETA_TERMS_PATH = '/beta-terms';

const ACCEPT_KEY = 'lmh-beta-terms-accepted';
const MOBILE_DISMISS_KEY = 'lmh-mobile-warning-dismissed';

export function hasAcceptedBetaTerms(): boolean {
  try {
    return localStorage.getItem(ACCEPT_KEY) === BETA_TERMS_VERSION;
  } catch {
    return false;
  }
}

export function acceptBetaTerms(): void {
  try {
    localStorage.setItem(ACCEPT_KEY, BETA_TERMS_VERSION);
  } catch {
    // Storage blocked (private mode): the agreement holds for this visit only.
  }
}

export function isMobileWarningDismissed(): boolean {
  try {
    return localStorage.getItem(MOBILE_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissMobileWarning(): void {
  try {
    localStorage.setItem(MOBILE_DISMISS_KEY, '1');
  } catch {
    // Ignore: the warning simply reappears next visit.
  }
}
