import { ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react';

const ALLOWED_HOSTS = ['huggingface.co', 'github.com'];

function safeTarget(raw: string | null): URL | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    const host = u.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return null;
    return u;
  } catch {
    return null;
  }
}

export default function Leaving() {
  const target = safeTarget(new URLSearchParams(window.location.search).get('url'));

  return (
    <main className="flex min-h-full flex-col items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
        <ShieldAlert className="mx-auto h-10 w-10 text-teal-400" aria-hidden />
        <h1 className="mt-3 text-lg font-bold">You are leaving LocalModel Hub</h1>
        {target ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              You are about to visit an external website, which has its own privacy practices. This app does not share
              your identity or chats, and the link below does not tell the other site where you came from.
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Destination</p>
            <p className="mt-1 break-all rounded-lg bg-slate-800 p-2 text-sm text-slate-200">
              <span className="font-semibold text-white">{target.hostname}</span>
              <span className="text-slate-400">{target.pathname}{target.search}</span>
            </p>
            <a
              href={target.toString()}
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300/60"
            >
              Continue to {target.hostname}
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            This link isn't one we can safely open. Only links to Hugging Face and GitHub are allowed from this app.
          </p>
        )}
      </div>
      <a href="/" className="mt-4 inline-flex items-center gap-1 text-sm text-teal-300 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Cancel and go back
      </a>
    </main>
  );
}
