import React, { useState } from 'react';
import { useKnowledge } from '../context';
import { useLanguage } from '../i18n';
import { Plus, X } from 'lucide-react';

export function CategoryManager() {
  const { categories, addCategory } = useKnowledge();
  const { t } = useLanguage();
  const [newCategory, setNewCategory] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    await addCategory(newCategory);
    setNewCategory('');
    setIsAdding(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{t('categories')}</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
        >
          <Plus size={16} />
          {t('newCategory')}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder={t('categoryName')}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            autoFocus
          />
          <button 
            type="submit"
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            {t('addBtn')}
          </button>
          <button 
            type="button"
            onClick={() => setIsAdding(false)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {categories.map(c => (
          <span 
            key={c.id} 
            className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 text-sm border border-gray-100"
          >
            {c.name}
          </span>
        ))}
      </div>
    </div>
  );
}
