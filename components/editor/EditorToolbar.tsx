'use client';

import { forwardRef } from 'react';

interface EditorToolbarProps {
  previewHref: string;
  siblingEditorHref?: string;
  siblingEditorLabel?: string;
  onLogout: () => void;
}

export const EditorToolbar = forwardRef<HTMLDivElement, EditorToolbarProps>(
  function EditorToolbar({ previewHref, siblingEditorHref, siblingEditorLabel, onLogout }, ref) {
    return (
      <div className="fw-editor-toolbar-bar" ref={ref}>
        <div className="fw-editor-toolbar">
          <span className="fw-editor-toolbar-label">Editing Mode</span>
          {siblingEditorHref && siblingEditorLabel ? (
            <a href={siblingEditorHref} className="fw-editor-toolbar-btn">
              {siblingEditorLabel}
            </a>
          ) : null}
          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className="fw-editor-toolbar-btn"
          >
            Preview
          </a>
          <button
            type="button"
            className="fw-editor-toolbar-btn fw-editor-toolbar-btn--logout"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }
);
