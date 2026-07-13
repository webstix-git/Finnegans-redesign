'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import { PageContent } from '@/components/PageContent';
import {
  applyMenuDataToHtml,
  applySectionItems,
  cloneMenuData,
  removeItemById,
  toEditableItem,
  type MenuData,
} from '@/lib/menuItems';
import { authHeaders, clearStoredAuth, getStoredAuth } from '@/lib/menuAuth';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { syncEditorChromeBelowBreadcrumb } from '@/components/editor/syncEditorStatusBelowBreadcrumb';
import {
  attachInlineEditors,
  detachInlineEditors,
  enterSectionEditModeById,
  getActiveSectionId,
} from '@/components/menu-editor/inlineEditor';
import './editor-ui.css';

interface LiveMenuEditorProps {
  baseHtml: string;
}

export function LiveMenuEditor({ baseHtml }: LiveMenuEditorProps) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<MenuData | null>(null);
  const savedDataRef = useRef<MenuData | null>(null);
  const attachEditorsRef = useRef<() => void>(() => {});
  const [displayHtml, setDisplayHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [saveError, setSaveError] = useState(false);

  const renderEditor = useCallback(
    (data: MenuData, keepSectionEditing = false) => {
      const activeSection = keepSectionEditing ? getActiveSectionId() : null;
      const newHtml = applyMenuDataToHtml(baseHtml, data, { editorMode: true });
      dataRef.current = data;
      flushSync(() => {
        setDisplayHtml(newHtml);
      });
      attachEditorsRef.current();
      if (activeSection) {
        enterSectionEditModeById(activeSection);
      }
    },
    [baseHtml]
  );

  const attachEditors = useCallback(() => {
    const root = contentRef.current;
    const data = dataRef.current;
    if (!root || !data) return;

    attachInlineEditors(root, {
      getOriginal: (id) => {
        const saved = savedDataRef.current;
        return saved ? toEditableItem(saved, id) : null;
      },
      onError: (message) => {
        setSaveError(true);
        setSaveStatus(message);
        window.setTimeout(() => {
          setSaveStatus('');
          setSaveError(false);
        }, 3000);
      },
      onCancelSection: () => {
        const saved = savedDataRef.current;
        if (!saved) return;
        renderEditor(cloneMenuData(saved), false);
      },
      onDeleteItem: async (itemId) => {
        const current = dataRef.current;
        if (!current) return;
        renderEditor(removeItemById(current, itemId), true);
      },
      onSaveSection: async (sectionId, items) => {
        const current = dataRef.current;
        if (!current) return;

        setSaveError(false);
        setSaveStatus('Saving…');

        const updated = applySectionItems(current, sectionId, items);
        renderEditor(updated, false);

        const res = await fetch('/api/menu-html', {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ data: updated }),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok) throw new Error(json.error || 'Save failed');

        savedDataRef.current = cloneMenuData(updated);
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
      router.replace('/menu-editor/login');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/menu-html', {
          cache: 'no-store',
          headers: authHeaders(),
        });
        const json = (await res.json()) as { data?: MenuData; error?: string };
        if (res.status === 401) {
          clearStoredAuth();
          router.replace('/menu-editor/login');
          return;
        }
        if (!res.ok) throw new Error(json.error || 'Failed to load menu');
        if (cancelled || !json.data) return;

        const menuData = cloneMenuData(json.data);
        dataRef.current = menuData;
        savedDataRef.current = cloneMenuData(menuData);
        setDisplayHtml(applyMenuDataToHtml(baseHtml, menuData, { editorMode: true }));
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

  useEffect(() => () => detachInlineEditors(), []);

  function handleLogout() {
    clearStoredAuth();
    router.replace('/menu-editor/login');
  }

  if (loading) {
    return <div className="fw-editor-loading">Loading menu…</div>;
  }

  if (error) {
    return <div className="fw-editor-error">{error}</div>;
  }

  return (
    <>
      <EditorToolbar ref={toolbarRef} previewHref="/menu" onLogout={handleLogout} />

      <PageContent
        ref={contentRef}
        html={displayHtml}
        effects="scroll"
        onHtmlRendered={handleHtmlRendered}
      />
    </>
  );
}
