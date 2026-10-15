export type OpenSourceTool = {
  name: string;
  role: string;
  license: string;
  url: string;
};

export const RUNTIME_TOOLS: OpenSourceTool[] = [
  { name: 'WebLLM', role: 'Runs the AI models directly inside your browser, using your graphics card when available.', license: 'Apache-2.0', url: 'https://github.com/mlc-ai/web-llm' },
  { name: 'React', role: 'Builds every screen and keeps it up to date as you use the app.', license: 'MIT', url: 'https://react.dev' },
  { name: 'Agent Robot Avatar', role: 'The animated robot that guides you through the assistant.', license: 'MIT', url: 'https://github.com/CX-ArtLab/agent-robot-avatar' },
  { name: 'Lucide', role: 'The icon set used throughout the interface and the logo.', license: 'ISC', url: 'https://lucide.dev' },
  { name: 'Workbox', role: 'Lets the app keep working offline once it has loaded.', license: 'MIT', url: 'https://github.com/GoogleChrome/workbox' },
];

export const BUILD_TOOLS: OpenSourceTool[] = [
  { name: 'Tailwind CSS', role: 'The design system behind the layout, colors and dark mode.', license: 'MIT', url: 'https://tailwindcss.com' },
  { name: 'Vite', role: 'Packages the app so it loads quickly.', license: 'MIT', url: 'https://vitejs.dev' },
  { name: 'Vite PWA', role: 'Makes the app installable and available offline.', license: 'MIT', url: 'https://github.com/vite-pwa/vite-plugin-pwa' },
  { name: 'TypeScript', role: 'Catches mistakes in the code before they reach you.', license: 'Apache-2.0', url: 'https://www.typescriptlang.org' },
  { name: 'ESLint', role: 'Keeps the code consistent and tidy.', license: 'MIT', url: 'https://eslint.org' },
  { name: 'PostCSS and Autoprefixer', role: 'Makes the styling work the same across browsers.', license: 'MIT', url: 'https://postcss.org' },
];

export const ATTRIBUTIONS: OpenSourceTool[] = [
  { name: 'The Green Web Foundation', role: 'Independent check confirming this site runs on green hosting.', license: 'Service', url: 'https://www.thegreenwebfoundation.org' },
  { name: 'carbon.txt', role: 'Open standard used to publish this site\'s sustainability information.', license: 'Open standard', url: 'https://carbontxt.org' },
  { name: 'Hugging Face', role: 'Hosts the model files that are downloaded to your device.', license: 'Service', url: 'https://huggingface.co' },
];
