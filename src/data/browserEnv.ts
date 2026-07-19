// ---------------------------------------------------------------------------
// Browser environment detection, used to pick the right Google sign-in flow.
//
// Key constraint: Google BLOCKS OAuth inside embedded / in-app browsers
// (Facebook, Instagram, TikTok, etc.) with a `disallowed_useragent` error.
// There is no code workaround — the correct handling is to detect the in-app
// browser and prompt the user to open the app in Safari or Chrome.
// ---------------------------------------------------------------------------

function ua(): string {
  return typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
}

/** True inside an embedded/in-app webview where Google OAuth won't work. */
export function isInAppBrowser(): boolean {
  const u = ua();
  if (!u) return false;

  // Named in-app browsers.
  const inAppPatterns = [
    /FBAN|FBAV|FB_IAB|FBIOS/i, // Facebook
    /Instagram/i,
    /Line\//i,
    /Twitter|TwitterAndroid/i,
    /Snapchat/i,
    /Musical_?ly|Bytedance|TikTok|musical\.ly/i,
    /LinkedInApp/i,
    /Pinterest/i,
    /GSA\//i, // Google Search App in-app browser
    /\bWhatsApp\b/i,
    /\bMessenger\b/i,
  ];
  if (inAppPatterns.some((re) => re.test(u))) return true;

  const iOS = /iPhone|iPod|iPad/i.test(u);
  const android = /Android/i.test(u);

  // iOS WKWebView: has "Mobile" but lacks "Safari" (real Safari includes it).
  if (iOS && /AppleWebKit/i.test(u) && /Mobile/i.test(u) && !/Safari/i.test(u)) {
    return true;
  }
  // Generic Android WebView marker.
  if (android && /; wv\)/i.test(u)) return true;

  return false;
}

/** iOS/Android or desktop Safari — where popup sign-in is unreliable. */
export function isMobileOrSafari(): boolean {
  const u = ua();
  const mobile = /iPhone|iPod|iPad|Android/i.test(u);
  const safari = /^((?!chrome|android|crios|fxios).)*safari/i.test(u);
  return mobile || safari;
}

/** True when running as an installed / standalone PWA (no browser chrome). */
export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;
  const mm = window.matchMedia?.('(display-mode: standalone)').matches;
  // iOS Safari exposes navigator.standalone.
  const iosStandalone = (navigator as unknown as { standalone?: boolean })
    .standalone;
  return Boolean(mm || iosStandalone);
}

/** Best-effort label for the current in-app browser (for the nudge copy). */
export function inAppBrowserName(): string {
  const u = ua();
  if (/Instagram/i.test(u)) return 'Instagram';
  if (/FBAN|FBAV|FB_IAB|FBIOS|Messenger/i.test(u)) return 'Facebook';
  if (/TikTok|Musical_?ly|Bytedance/i.test(u)) return 'TikTok';
  if (/Snapchat/i.test(u)) return 'Snapchat';
  if (/LinkedInApp/i.test(u)) return 'LinkedIn';
  if (/Twitter/i.test(u)) return 'X';
  return 'this app';
}
