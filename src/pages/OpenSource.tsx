import { ArrowLeft, ArrowUpRight, Boxes, Code2, Github, HeartHandshake, Leaf, Scale, Sparkles, Twitter, Wrench } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { MODELS } from '@/data/models';
import { ATTRIBUTIONS, BUILD_TOOLS, RUNTIME_TOOLS, type OpenSourceTool } from '@/data/openSource';
import { AUTHOR, OPEN_SOURCE_UPDATED, PROJECT_LICENSE } from '@/lib/site';

const LINK =
  'font-semibold text-[#245a96] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fb5] rounded-sm dark:text-sky-200';

const LICENSE_STYLES: Record<string, string> = {
  MIT: 'border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-950/50 dark:text-emerald-200',
  'Apache-2.0': 'border-sky-600/30 bg-sky-50 text-sky-800 dark:border-sky-400/30 dark:bg-sky-950/50 dark:text-sky-200',
  'Apache 2.0': 'border-sky-600/30 bg-sky-50 text-sky-800 dark:border-sky-400/30 dark:bg-sky-950/50 dark:text-sky-200',
  ISC: 'border-teal-600/30 bg-teal-50 text-teal-800 dark:border-teal-400/30 dark:bg-teal-950/50 dark:text-teal-200',
};
const LICENSE_FALLBACK =
  'border-neutral-300 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';

function goBack() {
  if (window.history.length > 1) window.history.back();
  else window.location.assign('/');
}

function LicensePill({ license }: { license: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${LICENSE_STYLES[license] ?? LICENSE_FALLBACK}`}>
      {license}
    </span>
  );
}

function ExternalLinkText({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`group inline-flex items-center gap-0.5 ${LINK}`}>
      {children}
      <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

function Section({ icon: Icon, title, intro, children, delay }: { icon: ComponentType<{ className?: string }>; title: string; intro: string; children: ReactNode; delay: number }) {
  return (
    <section className="animate-fade-in mt-10" style={{ animationDelay: `${delay}ms` }}>
      <h2 className="flex items-center gap-2 text-lg font-semibold leading-snug">
        <Icon className="h-5 w-5 text-sky-700 dark:text-sky-300" aria-hidden />
        {title}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{intro}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ToolList({ tools }: { tools: OpenSourceTool[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {tools.map((t) => (
        <li
          key={t.name}
          className="rounded-2xl border border-neutral-200/80 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/70"
        >
          <div className="flex items-start justify-between gap-3">
            <ExternalLinkText href={t.url}>{t.name}</ExternalLinkText>
            <LicensePill license={t.license} />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{t.role}</p>
        </li>
      ))}
    </ul>
  );
}

export default function OpenSource() {
  return (
    <main className="min-h-full bg-[#F5F5F7] px-4 py-10 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 sm:py-16">
      <article className="mx-auto w-full max-w-3xl">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-[#245a96] transition hover:bg-sky-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fb5] dark:text-sky-200 dark:hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>

        <header className="animate-slide-up mt-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-950/60 dark:text-emerald-200">
            <Code2 className="h-3.5 w-3.5" aria-hidden />
            Open source
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Open Source and Credits</h1>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">Last updated {OPEN_SOURCE_UPDATED}</p>
          <p className="mt-5 text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
            LocalModel Hub is built by {AUTHOR.displayName} and released under the MIT License. It stands on the work of many
            open-source projects and model makers, credited below.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href={AUTHOR.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fb5] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <Github className="h-4 w-4" aria-hidden />
              GitHub
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <a
              href={AUTHOR.x}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fb5] dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            >
              <Twitter className="h-4 w-4" aria-hidden />
              X
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </header>

        <section className="animate-fade-in mt-8 rounded-2xl border border-emerald-600/25 bg-white/90 p-5 shadow-sm dark:border-emerald-400/20 dark:bg-neutral-900/80 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Scale className="h-5 w-5 text-emerald-700 dark:text-emerald-300" aria-hidden />
            Project license: MIT
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            Anyone may use, copy, change, merge, publish, share and even sell copies of this app, for free. The only condition is
            that the copyright notice and license text stay with it. The app comes with no warranty.
          </p>
          <p className="mt-3 rounded-lg bg-neutral-100 px-3 py-2 font-mono text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {PROJECT_LICENSE.copyright}
          </p>
          <p className="mt-3 text-sm">
            <ExternalLinkText href={PROJECT_LICENSE.url}>Read the full MIT License</ExternalLinkText>
          </p>
        </section>

        <Section icon={Boxes} title="Inside the app" intro="Open-source software that runs every time you use LocalModel Hub." delay={60}>
          <ToolList tools={RUNTIME_TOOLS} />
        </Section>

        <Section icon={Wrench} title="Used to build it" intro="Tools that shape and package the app before it reaches you." delay={120}>
          <ToolList tools={BUILD_TOOLS} />
        </Section>

        <Section
          icon={Sparkles}
          title={`AI models (${MODELS.length})`}
          intro="Each model is made by its own team and carries its own license. Downloading a model means agreeing to that license."
          delay={180}
        >
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/80 shadow-sm dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/70">
            {MODELS.map((m) => (
              <li key={m.slug} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 transition hover:bg-sky-50/60 dark:hover:bg-white/5">
                <div className="min-w-0">
                  <ExternalLinkText href={m.hfUrl}>{m.name}</ExternalLinkText>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">by {m.provider}</p>
                </div>
                <LicensePill license={m.license} />
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Leaf} title="Attributions" intro="Services and standards this site relies on or follows." delay={240}>
          <ToolList tools={ATTRIBUTIONS} />
        </Section>

        <p className="mt-10 flex items-center justify-center gap-1.5 text-center text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          <HeartHandshake className="h-4 w-4" aria-hidden />
          Thank you to every open-source contributor who made this possible.
        </p>
      </article>
    </main>
  );
}
