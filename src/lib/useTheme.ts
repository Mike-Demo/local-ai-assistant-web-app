import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function useTheme(preference: 'light' | 'dark' | 'system') {
  const [resolved, setResolved] = useState<Theme>(() => {
    if (preference !== 'system') return preference;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (preference !== 'system') {
      setResolved(preference);
      applyTheme(preference);
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => {
      const t = mq.matches ? 'dark' : 'light';
      setResolved(t);
      applyTheme(t);
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [preference]);

  return resolved;
}
