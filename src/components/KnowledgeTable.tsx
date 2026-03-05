import React, { useState } from 'react';
import { useKnowledge } from '../context';
import { useLanguage } from '../i18n';
import { ExternalLink, Tag, Calendar, Image as ImageIcon, FileText, Edit2, Check, X } from 'lucide-react';

export function KnowledgeTable() {
  const { entries, categories, updateEntryCategory } = useKnowledge();
  const { t } = useLanguage();
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  const filteredEntries = filterCategory === 'All' 
    ? entries 
    : entries.filter(e => e.category_name === filterCategory);

  const startEditing = (entry: any) => {
    setEditingId(entry.id);
    setEditCategoryName(entry.category_name);
  };

  const saveCategory = async (id: number) => {
    if (editCategoryName.trim()) {
      await updateEntryCategory(id, editCategoryName);
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('knowledgeBase')}</h2>
        <div className="flex gap-2">
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="All">{t('allCategories')}</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-6 hover:shadow-md transition-shadow">
            {/* Image Thumbnail */}
            <div className="w-32 h-32 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center">
              {entry.image_url ? (
                <img 
                  src={entry.image_url} 
                  alt={entry.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to icon if image fails
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center');
                  }}
                />
              ) : (
                <div className="text-gray-300">
                  {entry.url.startsWith('http') ? <ImageIcon size={32} /> : <FileText size={32} />}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {editingId === entry.id ? (
                    <div className="flex items-center gap-1">
                      <input 
                        type="text" 
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        className="px-2 py-0.5 text-xs border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        autoFocus
                        list="category-options"
                      />
                      <datalist id="category-options">
                        {categories.map(c => <option key={c.id} value={c.name} />)}
                      </datalist>
                      <button onClick={() => saveCategory(entry.id)} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-600"><X size={14} /></button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => startEditing(entry)}
                      className="group flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100 hover:bg-indigo-100 transition-colors"
                    >
                      {entry.category_name}
                      <Edit2 size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                  
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
                {entry.url.startsWith('http') && (
                  <a 
                    href={entry.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    <ExternalLink size={18} />
                  </a>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate" title={entry.title}>
                {entry.title || t('untitled')}
              </h3>
              
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                {entry.summary}
              </p>
            </div>
          </div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400">{t('noEntries')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
