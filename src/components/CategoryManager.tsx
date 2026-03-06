import React, { useState } from 'react';
import { useKnowledge } from '../context';
import { useLanguage } from '../i18n';
import { Plus, X } from 'lucide-react';

export function CategoryManager() {
  const { categories, addCategory, deleteCategory } = useKnowledge();
  const { t } = useLanguage();
  const [newCategory, setNewCategory] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    await addCategory(newCategory);
    setNewCategory('');
    setIsAdding(false);
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmation(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmation !== null) {
      await deleteCategory(deleteConfirmation);
      setDeleteConfirmation(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
      {deleteConfirmation !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">{t('delete')}</h3>
            <p className="text-gray-600 mb-6">{t('confirmDeleteCategory')}</p>
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
            className="group px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 text-sm border border-gray-100 flex items-center gap-2"
          >
            {c.name}
            <button
              onClick={() => handleDelete(c.id)}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title={t('delete')}
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
