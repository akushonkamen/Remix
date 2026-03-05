import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useKnowledge } from '../context';

export function URLInput() {
  const [url, setUrl] = useState('');
  const { addEntry, loading } = useKnowledge();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setError('');
    
    try {
      await addEntry(url);
      setUrl('');
    } catch (err) {
      setError('Failed to process URL. Please check the link and try again.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
      <h2 className="text-lg font-semibold mb-4">Add New Knowledge Source</h2>
      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a URL here (e.g. https://example.com/article)"
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          disabled={loading}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
          {loading ? 'Processing...' : 'Add Source'}
        </button>
      </form>
      {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
    </div>
  );
}
