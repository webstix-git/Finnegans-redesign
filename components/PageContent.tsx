'use client';

import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import { useFinnegansEffects, type EffectsMode } from '@/hooks/useFinnegansEffects';

interface PageContentProps {
  html: string;
  effects: EffectsMode;
  onHtmlRendered?: () => void;
}

export const PageContent = forwardRef<HTMLDivElement, PageContentProps>(function PageContent(
  { html, effects, onHtmlRendered },
  forwardedRef
) {
  const containerRef = useRef<HTMLDivElement>(null);

  const setContainerRef = (el: HTMLDivElement | null) => {
    containerRef.current = el;
    if (typeof forwardedRef === 'function') {
      forwardedRef(el);
    } else if (forwardedRef) {
      forwardedRef.current = el;
    }
  };

  useFinnegansEffects(containerRef, effects);

  useLayoutEffect(() => {
    onHtmlRendered?.();
  }, [html, onHtmlRendered]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.querySelectorAll<HTMLElement>('[style-hover]').forEach((el) => {
      const hoverRaw = el.getAttribute('style-hover') || '';
      const baseStyle = el.getAttribute('style') || '';

      const parseStyle = (raw: string) => {
        const styles: Record<string, string> = {};
        raw.split(';').forEach((part) => {
          const idx = part.indexOf(':');
          if (idx === -1) return;
          const key = part.slice(0, idx).trim();
          const val = part.slice(idx + 1).trim();
          if (key) styles[key] = val;
        });
        return styles;
      };

      const base = parseStyle(baseStyle);
      const hover = parseStyle(hoverRaw);

      const onEnter = () => {
        const merged = { ...base, ...hover };
        el.setAttribute(
          'style',
          Object.entries(merged)
            .map(([k, v]) => `${k}:${v}`)
            .join(';')
        );
      };

      const onLeave = () => {
        el.setAttribute('style', baseStyle);
      };

      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });
  }, [html]);

  return (
    <div
      ref={setContainerRef}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
