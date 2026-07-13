'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useRouter } from 'next/navigation';
import { PageContent } from '@/components/PageContent';
import {
  applyEditableItemUpdate,
  applyMenuDataToHtml,
  cloneMenuData,
  removeItemById,
  toEditableItem,
  type EditableMenuItem,
  type MenuData,
} from '@/lib/menuItems';
import { authHeaders, clearStoredAuth, getStoredAuth } from '@/lib/menuAuth';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { syncEditorChromeBelowBreadcrumb } from '@/components/editor/syncEditorStatusBelowBreadcrumb';
import { attachInlineEditors, detachInlineEditors } from '@/components/menu-editor/inlineEditor';
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

  const renderEditor = useCallback((data: MenuData, scrollToItemId?: string) => {
    const scrollY = window.scrollY;
    const newHtml = applyMenuDataToHtml(baseHtml, data, { editorMode: true });
    dataRef.current = data;
    flushSync(() => {
      setDisplayHtml(newHtml);
    });
    attachEditorsRef.current();

    requestAnimationFrame(() => {
      if (scrollToItemId && contentRef.current) {
        const item = contentRef.current.querySelector<HTMLElement>(
          `[data-fw-item-id="${scrollToItemId}"]`
        );
        if (item) {
          item.scrollIntoView({ block: 'nearest', behavior: 'instant' });
          return;
        }
      }
      window.scrollTo({ top: scrollY, behavior: 'instant' });
    });
  }, [baseHtml]);

  const persistMenu = useCallback(async (updated: MenuData) => {
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
  }, []);

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
      onDeleteItem: async (itemId) => {
        const current = dataRef.current;
        if (!current) return;

        setSaveError(false);
        setSaveStatus('Saving…');

        const updated = removeItemById(current, itemId);
        renderEditor(updated);
        await persistMenu(updated);
      },
      onSaveItem: async (item: EditableMenuItem) => {
        const current = dataRef.current;
        if (!current) return;

        setSaveError(false);
        setSaveStatus('Saving…');

        const updated = applyEditableItemUpdate(current, item);
        renderEditor(updated, item.id);
        await persistMenu(updated);
      },
    });
  }, [persistMenu, renderEditor]);

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
      <EditorToolbar
        ref={toolbarRef}
        previewHref="/menu"
        siblingEditorHref="/promotions-and-events-editor"
        siblingEditorLabel="Promotions Editor"
        onLogout={handleLogout}
      />

      <PageContent
        ref={contentRef}
        html={displayHtml}
        effects="scroll"
        onHtmlRendered={handleHtmlRendered}
      />
    </>
  );
}
