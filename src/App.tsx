import { lazy, Suspense } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineIndicator } from './components/ErrorUI';
import { AssistantProvider } from './components/assistant/AssistantProvider';
import { PrivacyTipsProvider } from '@/components/privacyTips/PrivacyTipsProvider';
import { Router } from './pages/Router';

const AssistantOverlay = lazy(() =>
  import('./components/assistant/AssistantOverlay').then((m) => ({ default: m.AssistantOverlay }))
);

export default function App() {
  return (
    <ErrorBoundary>
      <AssistantProvider>
        <PrivacyTipsProvider>
          <Router />
          <Suspense fallback={null}>
            <AssistantOverlay />
          </Suspense>
        </PrivacyTipsProvider>
      </AssistantProvider>
      <OfflineIndicator />
    </ErrorBoundary>
  );
}
