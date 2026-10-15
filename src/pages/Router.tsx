import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { usePageMeta, type PageMeta } from '@/hooks/usePageMeta';
import { BETA_TERMS_PATH } from '@/lib/beta';
import { OPEN_SOURCE_PATH } from '@/lib/site';
import { betaTermsStructuredData, homeStructuredData, openSourceStructuredData } from '@/lib/structuredData';

const Home = lazy(() => import('./Home'));
const Leaving = lazy(() => import('./Leaving'));
const BetaTerms = lazy(() => import('./BetaTerms'));
const OpenSource = lazy(() => import('./OpenSource'));

function parsePath(): string {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function metaFor(path: string): PageMeta {
  switch (path) {
    case BETA_TERMS_PATH:
      return {
        title: 'Beta Terms and Disclaimer | LocalModel Hub',
        description: 'Plain-language beta terms for LocalModel Hub: AI answers can be wrong, downloads use storage, and everything stays on your device.',
        path,
        structuredData: betaTermsStructuredData(),
      };
    case OPEN_SOURCE_PATH:
      return {
        title: 'Open Source and Credits | LocalModel Hub',
        description: 'LocalModel Hub is MIT licensed. See every open-source tool and AI model that powers it, with licenses and links.',
        path,
        structuredData: openSourceStructuredData(),
      };
    default:
      return {
        title: 'LocalModel Hub | Private Open-Source AI Model Library',
        description: 'Browse open-source AI models, check what your device can run, and chat with them fully offline in your browser. No accounts, no tracking.',
        path: '/',
        structuredData: homeStructuredData(),
      };
  }
}

export function Router() {
  const [path, setPath] = useState<string>(parsePath);
  const meta = useMemo(() => metaFor(path), [path]);
  usePageMeta(meta);

  useEffect(() => {
    const onPop = () => setPath(parsePath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  let page: React.ReactNode;
  switch (path) {
    case '/leaving':
      page = <Leaving />;
      break;
    case BETA_TERMS_PATH:
      page = <BetaTerms />;
      break;
    case OPEN_SOURCE_PATH:
      page = <OpenSource />;
      break;
    default:
      page = <Home />;
  }

  return (
    <div className="h-full">
      <Suspense fallback={<div className="p-8 text-sm text-neutral-600 dark:text-neutral-400">Loading…</div>}>{page}</Suspense>
    </div>
  );
}
