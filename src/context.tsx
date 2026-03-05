import React, { createContext, useContext, useState, useEffect } from 'react';
import { Category, Entry } from './types';
import { useLanguage } from './i18n';

interface KnowledgeContextType {
  entries: Entry[];
  categories: Category[];
  loading: boolean;
  addEntry: (url: string) => Promise<void>;
  addFileEntry: (file: File) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  updateEntryCategory: (id: number, categoryName: string) => Promise<void>;
  refreshData: (query?: string) => Promise<void>;
}

const KnowledgeContext = createContext<KnowledgeContextType | undefined>(undefined);

export function KnowledgeProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();

  const refreshData = async (query: string = '') => {
    // setLoading(true); // Don't block UI on refresh
    try {
      const [entriesRes, categoriesRes] = await Promise.all([
        fetch(`/api/entries?q=${encodeURIComponent(query)}`),
        fetch('/api/categories')
      ]);
      const entriesData = await entriesRes.json();
      const categoriesData = await categoriesRes.json();
      setEntries(entriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      // setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    refreshData().finally(() => setLoading(false));
  }, []);

  const addEntry = async (url: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, language })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to process URL');
      }
      await refreshData();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addFileEntry = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload file');
      }
      await refreshData();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (name: string) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error('Failed to create category');
      await refreshData();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const updateEntryCategory = async (id: number, categoryName: string) => {
    try {
      const res = await fetch(`/api/entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_name: categoryName })
      });
      if (!res.ok) throw new Error('Failed to update entry');
      await refreshData();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return (
    <KnowledgeContext.Provider value={{ entries, categories, loading, addEntry, addFileEntry, addCategory, updateEntryCategory, refreshData }}>
      {children}
    </KnowledgeContext.Provider>
  );
}

export function useKnowledge() {
  const context = useContext(KnowledgeContext);
  if (context === undefined) {
    throw new Error('useKnowledge must be used within a KnowledgeProvider');
  }
  return context;
}
