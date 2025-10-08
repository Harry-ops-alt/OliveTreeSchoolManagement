import { useState } from 'react';
import { MoreHorizontal, PlusCircle, Star, Trash2 } from 'lucide-react';
import type { AdmissionLeadSavedView } from '../../lib/types/admissions';

export type SavedViewsMenuProps = {
  views: AdmissionLeadSavedView[];
  loading: boolean;
  saving: boolean;
  activeViewId: string | null;
  onRefresh: () => void;
  onSaveCurrent: (options?: { setAsDefault?: boolean }) => void;
  onApply: (view: AdmissionLeadSavedView) => void;
  onSetDefault: (view: AdmissionLeadSavedView) => void;
  onRename: (view: AdmissionLeadSavedView, name: string) => void;
  onDelete: (view: AdmissionLeadSavedView) => void;
};

export function SavedViewsMenu({
  views,
  loading,
  saving,
  activeViewId,
  onRefresh,
  onSaveCurrent,
  onApply,
  onSetDefault,
  onRename,
  onDelete,
}: SavedViewsMenuProps): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);

  const defaultViewId = views.find((candidate) => candidate.isDefault)?.id ?? null;

  const renderViewRow = (view: AdmissionLeadSavedView) => {
    const isDefault = view.id === defaultViewId;
    const isActive = view.id === activeViewId;

    return (
      <li
        key={view.id}
        className={[
          'flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition',
          isActive ? 'bg-emerald-900/40' : 'hover:bg-emerald-900/40',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <button
          type="button"
          className="flex-1 text-left text-sm text-emerald-50 transition hover:text-white"
          onClick={() => {
            onApply(view);
            setMenuOpen(false);
          }}
        >
          <span className="font-medium">{view.name}</span>
          {isDefault ? <span className="ml-2 text-xs text-emerald-300">(Default)</span> : null}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={[
              'rounded-full p-1 text-emerald-200 transition hover:bg-emerald-800/60 hover:text-white',
              isDefault ? 'text-emerald-400' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onSetDefault(view)}
            disabled={isDefault}
            aria-label="Set as default view"
          >
            <Star className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className="rounded-full p-1 text-emerald-200 transition hover:bg-emerald-800/60 hover:text-white"
            onClick={() => {
              const name = window.prompt('Rename saved view', view.name)?.trim();
              if (name) {
                onRename(view, name);
              }
            }}
            aria-label="Rename view"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className="rounded-full p-1 text-red-300 transition hover:bg-red-900/60 hover:text-red-100"
            onClick={() => {
              if (window.confirm(`Delete view "${view.name}"?`)) {
                onDelete(view);
              }
            }}
            aria-label="Delete view"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </li>
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-100 transition hover:bg-emerald-500/30"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <PlusCircle className="h-4 w-4" aria-hidden />
        Saved views
      </button>
      {menuOpen ? (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-emerald-700/60 bg-emerald-950/95 p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Saved views</h3>
            <button
              type="button"
              className="text-xs text-emerald-300 underline-offset-2 hover:underline"
              onClick={onRefresh}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              className="w-full rounded-xl border border-dashed border-emerald-600/60 px-3 py-2 text-left text-sm text-emerald-200 transition hover:bg-emerald-900/40"
              onClick={() => onSaveCurrent()}
              disabled={saving}
            >
              Save current filters
            </button>
            <button
              type="button"
              className="w-full rounded-xl border border-dashed border-emerald-600/60 px-3 py-2 text-left text-sm text-emerald-200 transition hover:bg-emerald-900/40"
              onClick={() => onSaveCurrent({ setAsDefault: true })}
              disabled={saving}
            >
              Save & set as default
            </button>
          </div>
          <hr className="my-3 border-emerald-800/60" />
          {loading && !views.length ? (
            <p className="text-sm text-emerald-300">Loading views...</p>
          ) : views.length ? (
            <ul className="space-y-2">{views.map((view) => renderViewRow(view))}</ul>
          ) : (
            <p className="text-sm text-emerald-300">No saved views yet. Save your current filters to get started.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
