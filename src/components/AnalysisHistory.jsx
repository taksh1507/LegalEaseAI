import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../config';

export default function AnalysisHistory({ onLoad, onNewDocument }) {
  const [items, setItems] = useState([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(0);
  const [query, setQuery] = useState(''),
    [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const refresh = useCallback(
    async (signal) => {
      setLoading(true);
      setError('');
      try {
        const result = await apiRequest(
          `/api/document-history?limit=10&offset=${page * 10}&search=${encodeURIComponent(search)}`,
          { signal },
        );
        setItems(result.data);
        setTotal(result.total);
      } catch (failure) {
        if (failure.name !== 'AbortError') setError(failure.message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [page, search],
  );
  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);
  async function remove(id) {
    if (!window.confirm('Delete this saved analysis? This cannot be undone.')) return;
    try {
      await apiRequest(`/api/document-history/${id}`, { method: 'DELETE' });
      if (items.length === 1 && page > 0) setPage(page - 1);
      else await refresh();
    } catch (failure) {
      setError(failure.message);
    }
  }
  async function clear() {
    if (!window.confirm('Delete all of your saved analyses? This cannot be undone.')) return;
    try {
      await apiRequest('/api/document-history', { method: 'DELETE' });
      if (page > 0) setPage(0);
      else await refresh();
    } catch (failure) {
      setError(failure.message);
    }
  }
  function review(item) {
    if (
      !item.fullAnalysis ||
      !item.fullAnalysis.summary ||
      !Array.isArray(item.fullAnalysis.clauses) ||
      !Array.isArray(item.fullAnalysis.redFlags) ||
      !item.fullAnalysis.clauses.every(
        (value) => value && typeof value.title === 'string' && typeof value.riskLevel === 'string',
      ) ||
      !item.fullAnalysis.redFlags.every((value) => value && typeof value.severity === 'string')
    ) {
      setError('This saved record does not contain a complete analysis.');
      return;
    }
    onLoad(item.fullAnalysis);
  }
  return (
    <section className="max-w-6xl mx-auto space-y-6" aria-busy={loading}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="workspace-eyebrow">YOUR WORKSPACE</p>
          <h1 className="text-3xl font-bold text-accent-900 dark:text-white">Analysis history</h1>
          <p className="text-accent-500 mt-2">
            Revisit a review, or delete information you no longer need.
          </p>
        </div>
        <button className="btn-primary" onClick={onNewDocument}>
          Analyze a document
        </button>
      </div>
      <div className="card p-5 flex flex-wrap gap-4 items-center justify-between">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(0);
            setSearch(query.trim());
          }}
        >
          <label className="sr-only" htmlFor="history-search">
            Search analyses
          </label>
          <input
            id="history-search"
            className="input-field !w-auto"
            value={query}
            maxLength={100}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search document names"
          />
          <button className="btn-secondary" type="submit">
            Search
          </button>
        </form>
        <button
          className="text-sm text-danger-600 disabled:opacity-50"
          onClick={clear}
          disabled={!total || loading}
        >
          Clear history
        </button>
      </div>
      {error && (
        <div role="alert" className="card border-danger-200 p-4 text-danger-600">
          {error}
          <button className="btn-secondary ml-3" onClick={() => refresh()}>
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <div role="status" className="card p-12 text-center text-accent-500">
          Loading saved analyses…
        </div>
      ) : items.length ? (
        <>
          <div
            className="card overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-label="Saved analyses table"
          >
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead className="bg-accent-50 dark:bg-accent-900 text-accent-500">
                <tr>
                  <th className="p-5">Document</th>
                  <th className="p-5">Risk</th>
                  <th className="p-5">Reviewed</th>
                  <th className="p-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-accent-100 dark:border-accent-700">
                    <td className="p-5 max-w-sm">
                      <div className="font-semibold text-accent-900 dark:text-white break-words">
                        {item.fileName}
                      </div>
                      <p className="text-accent-500 truncate max-w-xs">{item.summary}</p>
                    </td>
                    <td className="p-5 capitalize">{item.riskLevel}</td>
                    <td className="p-5 whitespace-nowrap">
                      {new Date(item.analysisDate).toLocaleDateString()}
                    </td>
                    <td className="p-5 whitespace-nowrap">
                      <button className="btn-secondary mr-3" onClick={() => review(item)}>
                        Review
                      </button>
                      <button
                        className="text-danger-600"
                        aria-label={`Delete ${item.fileName}`}
                        onClick={() => remove(item.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap justify-between items-center gap-4 text-sm text-accent-500">
            <p>
              {total} saved {total === 1 ? 'analysis' : 'analyses'} · Newest first
            </p>
            <div className="flex items-center gap-4">
              <button
                className="btn-secondary disabled:opacity-40"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>
                Page {page + 1} of {Math.ceil(total / 10)}
              </span>
              <button
                className="btn-secondary disabled:opacity-40"
                disabled={(page + 1) * 10 >= total}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        !error && (
          <div className="card py-20 px-6 text-center">
            <p className="text-4xl mb-4" aria-hidden="true">
              ↗
            </p>
            <h2 className="text-xl font-semibold">
              {search ? 'No matching analyses' : 'Your next review starts here'}
            </h2>
            <p className="text-accent-500 my-3">
              {search
                ? 'Try another document name.'
                : 'Completed analyses will appear here after you review a document.'}
            </p>
            <button className="btn-primary mt-3" onClick={onNewDocument}>
              Start a review
            </button>
          </div>
        )
      )}
    </section>
  );
}
