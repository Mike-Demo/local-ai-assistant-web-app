import { ArrowLeft, FlaskConical } from 'lucide-react';
import { BETA_TERMS_UPDATED } from '@/lib/beta';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'This is beta software',
    body: 'LocalModel Hub is still being tested. Features may be incomplete, behave unexpectedly, change, or be removed at any time without notice. Please do not rely on it for anything critical.',
  },
  {
    title: 'AI answers can be wrong',
    body: 'The AI models can produce answers that are inaccurate, outdated, biased, or offensive. Always double-check important information. Nothing the AI says is medical, legal, financial, or other professional advice.',
  },
  {
    title: 'Provided "as is"',
    body: 'The app is provided "as is" and "as available", without warranties of any kind, express or implied, including fitness for a particular purpose. To the fullest extent permitted by law, the makers of LocalModel Hub are not liable for any loss or damage arising from its use.',
  },
  {
    title: 'Downloads, storage and your device',
    body: 'AI models are large (roughly 1 to 3 GB) and are downloaded to your browser storage. This uses your internet data allowance and disk space, and running a model can make your device work hard, use more battery, and get warm. You can clear downloaded models at any time from Advanced Settings.',
  },
  {
    title: 'Your privacy',
    body: 'Everything runs inside your browser. Your chats are never sent to us or to any server, and we do not collect accounts, analytics, or tracking data. Your agreement to these terms and your preferences are saved only on this device.',
  },
  {
    title: 'Open-source models',
    body: 'Each AI model is made by a third party and comes with its own open-source license and usage rules. By downloading a model you agree to follow its license. Links to model pages open external sites with their own privacy practices.',
  },
  {
    title: 'Acceptable use',
    body: 'Do not use the app to break the law, harm others, or create content that violates the model licenses. You are responsible for how you use the AI and what you do with its output.',
  },
  {
    title: 'Changes to these terms',
    body: 'We may update these terms as the beta evolves. When we do, the app will ask you to review and agree again before continuing.',
  },
];

function goBack() {
  if (window.history.length > 1) window.history.back();
  else window.location.assign('/');
}

export default function BetaTerms() {
  return (
    <main className="min-h-full bg-[#F5F5F7] px-4 py-10 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 sm:py-16">
      <article className="mx-auto w-full max-w-2xl">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-[#245a96] transition hover:bg-sky-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fb5] dark:text-sky-200 dark:hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>

        <header className="animate-slide-up mt-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-600/30 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 dark:border-sky-400/30 dark:bg-sky-950/60 dark:text-sky-200">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden />
            Beta program
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Beta Terms and Disclaimer</h1>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">Last updated {BETA_TERMS_UPDATED}</p>
          <p className="mt-5 text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
            Thanks for trying LocalModel Hub early. Here is what you should know before you use it, in plain language.
          </p>
        </header>

        <ol className="mt-8 space-y-4">
          {SECTIONS.map((s, i) => (
            <li
              key={s.title}
              className="animate-fade-in rounded-2xl border border-neutral-200/80 bg-white/80 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <h2 className="flex items-baseline gap-3 text-base font-semibold leading-snug">
                <span className="text-sm font-bold text-sky-700 dark:text-sky-300" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {s.title}
              </h2>
              <p className="mt-2 pl-8 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{s.body}</p>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-center text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          By using LocalModel Hub you agree to these terms. If you do not agree, please do not use the app.
        </p>
      </article>
    </main>
  );
}
