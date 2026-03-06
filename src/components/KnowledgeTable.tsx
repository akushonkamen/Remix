import React, { useState, useEffect } from 'react';
import { useKnowledge } from '../context';
import { useLanguage } from '../i18n';
import { ExternalLink, Tag, Calendar, Image as ImageIcon, FileText, Edit2, Check, X, Search, Trash2 } from 'lucide-react';

export function KnowledgeTable() {
  const { entries, categories, updateEntryCategory, deleteEntry, refreshData } = useKnowledge();
  const { t } = useLanguage();
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshData(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const handleDelete = (id: number) => {
    setDeleteConfirmation(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmation !== null) {
      await deleteEntry(deleteConfirmation);
      setDeleteConfirmation(null);
    }
  };

  return (
    <div className="space-y-6">
      {deleteConfirmation !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">{t('delete')}</h3>
            <p className="text-gray-600 mb-6">{t('confirmDelete')}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">{t('knowledgeBase')}</h2>
        
        <div className="flex flex-1 sm:flex-none gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
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
                <div className="flex items-center gap-2">
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
                  <button 
                    onClick={() => handleDelete(entry.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title={t('delete')}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
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
