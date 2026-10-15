export const TIP_CATEGORIES = [
  { id: 'passwords', label: 'Passwords & Authentication', emoji: '🔒' },
  { id: 'browsing', label: 'Browsing & Tracking', emoji: '🌐' },
  { id: 'permissions', label: 'App Permissions', emoji: '📱' },
  { id: 'phishing', label: 'Email & Phishing', emoji: '📧' },
  { id: 'cloud', label: 'Data & Cloud Storage', emoji: '☁️' },
  { id: 'habits', label: 'General Privacy Habits', emoji: '🛡️' },
] as const;

export type TipCategoryId = (typeof TIP_CATEGORIES)[number]['id'];

export interface PrivacyTip {
  id: string;
  category: TipCategoryId;
  categoryLabel: string;
  emoji: string;
  message: string;
}

const RAW_TIPS: Record<TipCategoryId, string[]> = {
  passwords: [
    "Hey! A password manager can remember a different strong password for every site, so one leak doesn't unlock everything else. Most browsers have one built in — check your browser settings under \"Passwords\".",
    "Quick one: turn on two-step verification for your email first. Your inbox is the key to resetting every other account, so it deserves the strongest lock.",
    'Did you know a long passphrase like "purple-kettle-river-dance" is easier to remember and harder to crack than "P@ssw0rd!"? Length beats clever symbols.',
    'If a site offers passkeys, give them a try! They use your fingerprint, face or device PIN instead of a password, and they can\'t be phished.',
    "Authenticator apps are safer than text-message codes, because phone numbers can be hijacked. If an account offers both, I'd pick the app.",
    'Ever wondered if your email showed up in a data breach? The free site haveibeenpwned.com will tell you — then change the passwords for anything listed.',
    "Save your account recovery codes somewhere safe and offline, like a printed page in a drawer. Future-you will thank you if you ever lose your phone.",
  ],
  browsing: [
    "Hey! Most browsers let you block third-party cookies in their privacy settings. That stops lots of advertisers from following you from site to site.",
    "Private or incognito mode stops your browser saving history on this device — but websites and your internet provider can still see what you visit. Good to know!",
    'Try a privacy-focused search engine now and then. Many don\'t keep a profile of everything you search for.',
    "Browser extensions can often read every page you visit. Take a minute to remove any you don't use anymore — fewer extensions, fewer eyes.",
    'Look for "https" and the padlock before typing anything sensitive. It means the connection is encrypted, though it doesn\'t prove the site itself is trustworthy.',
    "Public Wi-Fi at cafés or airports can be snooped on. Save banking and other sensitive stuff for your home network or mobile data.",
    'Clearing cookies every so often logs you out everywhere — a little annoying, but it wipes the trail advertisers have been building about you.',
  ],
  permissions: [
    "Hey! Your phone's settings can show every app that has access to your location, camera and microphone. Take a peek — you might be surprised!",
    'When an app asks for your location, try "Only while using the app" instead of "Always". Most apps don\'t need to know where you are around the clock.',
    "A flashlight app asking for your contacts? That's a red flag. If a permission doesn't match what the app does, it's fine to say no.",
    "Uninstalling apps you haven't opened in months is a quick privacy win. Old apps can keep collecting data quietly in the background.",
    'On newer phones you can share your approximate location instead of your exact one. Weather apps work just fine with it!',
    "Watch for the little green or orange dot on your phone screen — it means the camera or mic is in use right now. If you didn't expect it, check which app it is.",
    'Before installing a new app, check its privacy label in the app store. It lists what data the app collects and whether it\'s linked to you.',
  ],
  phishing: [
    "Hey! Before clicking a link in an email, hover over it (or long-press on your phone) to see where it really goes. If it looks odd, don't click.",
    "Real banks and services won't ask for your password or one-time code by email or text. If someone does, it's almost certainly a scam.",
    'Scam emails love urgency: "Act now or your account will be closed!" When something feels rushed, slow down and go to the website yourself instead.',
    "Check the sender's full address, not just their display name. \"Support Team\" sending from a random free email account is a big warning sign.",
    'Unexpected attachment — even from a friend? Ask them about it another way first. Their account might have been taken over.',
    "Email aliases (a different address for each site) help you spot who shared or leaked your address — and make it easy to switch one off.",
    "If you think you clicked a phishing link, don't panic! Change that account's password right away and turn on two-step verification.",
  ],
  cloud: [
    "Hey! Have a look at which apps are connected to your Google, Apple or Microsoft account. Remove any you don't recognise or no longer use.",
    "Photos can carry hidden location data. Many phones let you remove it when sharing — look for a \"location\" or \"options\" toggle in the share menu.",
    "Did you know many services let you download a copy of everything they hold about you? It's an eye-opening way to see what's been collected.",
    'Shared links to cloud files can live forever. Every few months, check your shared files and switch off links you no longer need.',
    'For extra-sensitive files, pick storage with end-to-end encryption, so only you hold the key — not even the provider can read them.',
    "Backups are great, but they can keep things you've deleted. When you clear something sensitive, check it's gone from your backups and trash too.",
    "Fun fact about this app: the AI model runs right in your browser, so your chats never get uploaded to any cloud. That's privacy by design!",
  ],
  habits: [
    "Hey! Keeping your phone, computer and browser up to date is one of the best privacy habits there is. Updates close security holes that attackers love.",
    'Before posting a photo, check the background — house numbers, car plates and boarding passes can reveal more than you\'d think.',
    "Think twice before filling in quizzes like \"Your first pet + street name\". They often match common security questions!",
    'Set a reminder to do a privacy check-up once a season: review app permissions, connected accounts and old passwords. Ten minutes well spent.',
    "Lock your screen with a PIN, fingerprint or face unlock. If your phone goes missing, that's what keeps your messages and photos private.",
    "Less is more: when a form marks something as optional, you can usually leave it blank. Data that's never shared can't leak.",
    'Love this app\'s privacy? Look for "on-device" or "local" options in other tools too — they keep your data with you instead of on a server.',
  ],
};

export const PRIVACY_TIPS: readonly PrivacyTip[] = TIP_CATEGORIES.flatMap((cat) =>
  RAW_TIPS[cat.id].map((message, i) => ({
    id: `${cat.id}-${i + 1}`,
    category: cat.id,
    categoryLabel: cat.label,
    emoji: cat.emoji,
    message,
  }))
);

export const TIP_FREQUENCIES = [
  { id: '2m', label: 'Every 2 min', ms: 2 * 60_000 },
  { id: '5m', label: 'Every 5 min', ms: 5 * 60_000 },
  { id: '15m', label: 'Every 15 min', ms: 15 * 60_000 },
  { id: 'session', label: 'Once per session', ms: null },
  { id: 'manual', label: 'Manual only', ms: null },
] as const;

export type TipFrequency = (typeof TIP_FREQUENCIES)[number]['id'];
