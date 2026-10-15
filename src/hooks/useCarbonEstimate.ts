import { useEffect, useState } from 'react';

let cached: number | null = null;

function collectTransferredBytes(): number {
  const entries = performance.getEntriesByType(
    'navigation',
  ) as PerformanceNavigationTiming[];
  const navBytes = entries.reduce(
    (sum, e) => sum + (e.transferSize || e.encodedBodySize || 0),
    0,
  );

  const resources = performance.getEntriesByType(
    'resource',
  ) as PerformanceResourceTiming[];
  const resBytes = resources.reduce(
    (sum, e) => sum + (e.transferSize || e.encodedBodySize || 0),
    0,
  );

  const total = navBytes + resBytes;
  if (total > 0) return total;

  return Math.max(document.documentElement.outerHTML.length, 1);
}

export function useCarbonEstimate(): number | null {
  const [grams, setGrams] = useState<number | null>(cached);

  useEffect(() => {
    if (cached !== null) {
      setGrams(cached);
      return;
    }

    const compute = async () => {
      try {
        const { co2 } = await import('@tgwf/co2');
        const bytes = collectTransferredBytes();
        const model = new co2();
        const result = model.perByte(bytes);
        const value = typeof result === 'number' ? result : Number(result);
        if (Number.isFinite(value) && value >= 0) {
          cached = value;
          setGrams(value);
        }
      } catch {
        setGrams(null);
      }
    };

    if (document.readyState === 'complete') {
      compute();
    } else {
      window.addEventListener('load', compute, { once: true });
      return () => window.removeEventListener('load', compute);
    }
  }, []);

  return grams;
}
