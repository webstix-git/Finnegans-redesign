'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import { PageContent } from '@/components/PageContent';
import {
  applyPromoFieldsToData,
  applyPromoScheduleDataToHtml,
  clonePromoScheduleData,
  getPromoCardOriginalFields,
  type PromoCardId,
  type PromoScheduleData,
} from '@/lib/promotionItems';
import { authHeaders, clearStoredAuth, getStoredAuth } from '@/lib/menuAuth';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { syncEditorChromeBelowBreadcrumb } from '@/components/editor/syncEditorStatusBelowBreadcrumb';
import { attachPromoEditors, detachPromoEditors } from '@/components/promotions-editor/promotionsInlineEditor';
import '@/components/menu-editor/editor-ui.css';

interface LivePromotionsEditorProps {
  /** Chromed HTML from getPageHtmlAsync — same pipeline as the public page. */
  baseHtml: string;
  initialData: PromoScheduleData;
}

function renderEditorHtml(baseHtml: string, data: PromoScheduleData): string {
  return applyPromoScheduleDataToHtml(baseHtml, data, { editorMode: true });
}

export function LivePromotionsEditor({ baseHtml, initialData }: LivePromotionsEditorProps) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<PromoScheduleData>(clonePromoScheduleData(initialData));
  const savedDataRef = useRef<PromoScheduleData>(clonePromoScheduleData(initialData));
  const attachEditorsRef = useRef<() => void>(() => {});
  const [displayHtml, setDisplayHtml] = useState(() => renderEditorHtml(baseHtml, initialData));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [saveError, setSaveError] = useState(false);

  const renderEditor = useCallback((data: PromoScheduleData) => {
    dataRef.current = data;
    flushSync(() => {
      setDisplayHtml(renderEditorHtml(baseHtml, data));
    });
    attachEditorsRef.current();
  }, [baseHtml]);

  const attachEditors = useCallback(() => {
    const root = contentRef.current;
    const data = dataRef.current;
    if (!root || !data) return;

    attachPromoEditors(root, {
      getOriginalFields: (cardId) => getPromoCardOriginalFields(savedDataRef.current, cardId),
      onError: (message) => {
        setSaveError(true);
        setSaveStatus(message);
        window.setTimeout(() => {
          setSaveStatus('');
          setSaveError(false);
        }, 3000);
      },
      onSaveCard: async (cardId: PromoCardId, fields) => {
        const current = dataRef.current;
        if (!current) return;

        setSaveError(false);
        setSaveStatus('Saving…');

        const updated = applyPromoFieldsToData(current, cardId, fields);
        renderEditor(updated);

        const res = await fetch('/api/promotions-html', {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ data: updated }),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) throw new Error(json.error || 'Save failed');

        savedDataRef.current = clonePromoScheduleData(updated);
        setSaveStatus('Saved');
        window.setTimeout(() => setSaveStatus(''), 2000);
      },
    });
  }, [renderEditor]);

  attachEditorsRef.current = attachEditors;

  const syncEditorChrome = useCallback(() => {
    syncEditorChromeBelowBreadcrumb(
      contentRef.current,
      toolbarRef.current,
      saveStatus,
      saveError
    );
  }, [saveStatus, saveError]);

  const handleHtmlRendered = useCallback(() => {
    if (!contentRef.current || !dataRef.current) return;
    attachEditorsRef.current();
    syncEditorChrome();
  }, [syncEditorChrome]);

  useLayoutEffect(() => {
    syncEditorChrome();
  }, [syncEditorChrome, displayHtml]);

  useEffect(() => {
    if (!getStoredAuth()) {
      router.replace('/login');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/promotions-html', {
          cache: 'no-store',
          headers: authHeaders(),
        });
        const json = (await res.json()) as {
          data?: PromoScheduleData;
          error?: string;
        };
        if (res.status === 401) {
          clearStoredAuth();
          router.replace('/login');
          return;
        }
        if (!res.ok) throw new Error(json.error || 'Failed to load promotions');
        if (cancelled || !json.data) return;

        const promoData = clonePromoScheduleData(json.data);
        dataRef.current = promoData;
        savedDataRef.current = clonePromoScheduleData(promoData);
        setDisplayHtml(renderEditorHtml(baseHtml, promoData));
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [baseHtml, router]);

  useEffect(() => {
    setDisplayHtml(renderEditorHtml(baseHtml, dataRef.current));
  }, [baseHtml]);

  useEffect(() => () => detachPromoEditors(), []);

  function handleLogout() {
    clearStoredAuth();
    router.replace('/login');
  }

  if (loading) {
    return <div className="fw-editor-loading">Loading promotions…</div>;
  }

  if (error) {
    return <div className="fw-editor-error">{error}</div>;
  }

  return (
    <>
      <EditorToolbar
        ref={toolbarRef}
        previewHref="/promotions-and-events"
        siblingEditorHref="/menu-editor"
        siblingEditorLabel="Menu Editor"
        onLogout={handleLogout}
      />

      <PageContent
        ref={contentRef}
        html={displayHtml}
        effects="scroll-promo"
        onHtmlRendered={handleHtmlRendered}
      />
    </>
  );
}
