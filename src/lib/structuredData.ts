import { MODELS } from '@/data/models';
import { ATTRIBUTIONS, BUILD_TOOLS, RUNTIME_TOOLS } from '@/data/openSource';
import { BETA_TERMS_PATH, BETA_TERMS_VERSION } from '@/lib/beta';
import { AUTHOR, GREEN_CHECK_URL, OPEN_SOURCE_PATH, OPEN_SOURCE_UPDATED_ISO, PROJECT_LICENSE, REPO_URL, SITE_NAME, SITE_URL } from '@/lib/site';

type Node = Record<string, unknown>;

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const APP_ID = `${SITE_URL}/#app`;
const SOURCE_ID = `${SITE_URL}/#source`;

const ref = (id: string) => ({ '@id': id });

const LICENSE_URLS: Record<string, string> = {
  MIT: 'https://opensource.org/license/mit',
  'Apache-2.0': 'https://www.apache.org/licenses/LICENSE-2.0',
  'Apache 2.0': 'https://www.apache.org/licenses/LICENSE-2.0',
  ISC: 'https://opensource.org/license/isc-license-txt',
};

function licenseValue(license: string): string {
  return LICENSE_URLS[license] ?? license;
}

function baseNodes(): Node[] {
  return [
    {
      '@type': 'Person',
      '@id': PERSON_ID,
      name: AUTHOR.fullName,
      alternateName: AUTHOR.displayName,
      url: AUTHOR.github,
      sameAs: [AUTHOR.github, AUTHOR.x],
    },
    {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      description: 'Discover open-source AI models and run them privately in your browser.',
      inLanguage: 'en',
      publisher: ref(PERSON_ID),
      creator: ref(PERSON_ID),
      license: PROJECT_LICENSE.url,
      subjectOf: [
        { '@type': 'WebPage', name: 'Green Web Check', url: GREEN_CHECK_URL },
        { '@type': 'CreativeWork', name: 'carbon.txt sustainability disclosure', url: `${SITE_URL}/carbon.txt`, encodingFormat: 'text/plain' },
      ],
    },
    {
      '@type': 'WebApplication',
      '@id': APP_ID,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description: 'Browse open-source AI models, check what your device can run, and chat with them fully offline in your browser.',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires a modern browser with WebGPU (Chrome or Edge on desktop recommended) or WebAssembly.',
      softwareVersion: 'Beta',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      license: PROJECT_LICENSE.url,
      image: `${SITE_URL}/pwa/icon-512.png`,
      featureList: [
        'Runs AI models entirely in the browser',
        'Works offline after the first load',
        'Device compatibility check',
        'No account, analytics or tracking',
        'Voice input and read-aloud',
      ],
      author: ref(PERSON_ID),
      creator: ref(PERSON_ID),
      publisher: ref(PERSON_ID),
      isPartOf: ref(WEBSITE_ID),
      sameAs: [REPO_URL],
      isBasedOn: ref(SOURCE_ID),
    },
    {
      '@type': 'SoftwareSourceCode',
      '@id': SOURCE_ID,
      name: `${SITE_NAME} source code`,
      url: REPO_URL,
      codeRepository: REPO_URL,
      programmingLanguage: 'TypeScript',
      license: PROJECT_LICENSE.url,
      author: ref(PERSON_ID),
      targetProduct: ref(APP_ID),
    },
  ];
}

function breadcrumb(path: string, name: string): Node {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${SITE_URL}${path}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name, item: `${SITE_URL}${path}` },
    ],
  };
}

function graph(nodes: Node[]): Node {
  return { '@context': 'https://schema.org', '@graph': [...baseNodes(), ...nodes] };
}

export function homeStructuredData(): Node {
  return graph([
    {
      '@type': 'ItemList',
      '@id': `${SITE_URL}/#models`,
      name: 'Open-source AI models available in LocalModel Hub',
      numberOfItems: MODELS.length,
      itemListElement: MODELS.map((m, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'CreativeWork',
          name: m.name,
          url: m.hfUrl,
          description: m.oneLiner,
          creator: { '@type': 'Organization', name: m.provider },
          license: licenseValue(m.license),
        },
      })),
    },
  ]);
}

export function betaTermsStructuredData(): Node {
  const url = `${SITE_URL}${BETA_TERMS_PATH}`;
  return graph([
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: 'Beta Terms and Disclaimer',
      description: 'Plain-language terms and disclaimer for the LocalModel Hub beta.',
      dateModified: BETA_TERMS_VERSION,
      isPartOf: ref(WEBSITE_ID),
      about: ref(APP_ID),
      publisher: ref(PERSON_ID),
      breadcrumb: ref(`${url}#breadcrumb`),
      genre: 'Terms of service',
    },
    breadcrumb(BETA_TERMS_PATH, 'Beta Terms'),
  ]);
}

export function openSourceStructuredData(): Node {
  const url = `${SITE_URL}${OPEN_SOURCE_PATH}`;
  const tools = [...RUNTIME_TOOLS, ...BUILD_TOOLS];
  return graph([
    {
      '@type': 'AboutPage',
      '@id': `${url}#webpage`,
      url,
      name: 'Open Source and Credits',
      description: 'LocalModel Hub is MIT licensed. Credits for every open-source tool and AI model it uses.',
      dateModified: OPEN_SOURCE_UPDATED_ISO,
      isPartOf: ref(WEBSITE_ID),
      about: ref(APP_ID),
      publisher: ref(PERSON_ID),
      breadcrumb: ref(`${url}#breadcrumb`),
      mainEntity: ref(`${url}#credits`),
    },
    {
      '@type': 'ItemList',
      '@id': `${url}#credits`,
      name: 'Open-source software used by LocalModel Hub',
      numberOfItems: tools.length,
      itemListElement: tools.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@type': 'SoftwareSourceCode', name: t.name, url: t.url, description: t.role, license: licenseValue(t.license) },
      })),
    },
    {
      '@type': 'ItemList',
      '@id': `${url}#attributions`,
      name: 'Attributions',
      itemListElement: ATTRIBUTIONS.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@type': 'Thing', name: a.name, url: a.url, description: a.role },
      })),
    },
    breadcrumb(OPEN_SOURCE_PATH, 'Open Source'),
  ]);
}
