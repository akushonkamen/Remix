import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'zh';

interface Translations {
  [key: string]: {
    en: string;
    zh: string;
  };
}

const translations: Translations = {
  // Navigation
  dashboard: { en: 'Dashboard', zh: '仪表盘' },
  settings: { en: 'Settings', zh: '设置' },
  
  // Source Input
  addSource: { en: 'Add New Knowledge Source', zh: '添加新知识来源' },
  pasteUrl: { en: 'Paste a URL here (e.g. https://example.com/article)', zh: '在此粘贴网址（例如 https://example.com/article）' },
  uploadFile: { en: 'Upload File (PDF, DOCX, PPTX)', zh: '上传文件 (PDF, DOCX, PPTX)' },
  processing: { en: 'Processing...', zh: '处理中...' },
  add: { en: 'Add Source', zh: '添加来源' },
  or: { en: 'or', zh: '或' },
  dragDrop: { en: 'Drag and drop a file here, or click to select', zh: '拖放文件到此处，或点击选择' },
  
  // Table
  knowledgeBase: { en: 'Knowledge Base', zh: '知识库' },
  allCategories: { en: 'All Categories', zh: '所有分类' },
  noEntries: { en: 'No entries found.', zh: '未找到条目。' },
  untitled: { en: 'Untitled', zh: '无标题' },
  
  // Categories
  categories: { en: 'Categories', zh: '分类' },
  newCategory: { en: 'New Category', zh: '新建分类' },
  categoryName: { en: 'Category name...', zh: '分类名称...' },
  addBtn: { en: 'Add', zh: '添加' },
  
  // Errors
  errorUrl: { en: 'URL is required', zh: '请输入网址' },
  errorFile: { en: 'Please select a file', zh: '请选择文件' },
  failedProcess: { en: 'Failed to process source. Please try again.', zh: '处理失败，请重试。' },
  
  // Actions
  delete: { en: 'Delete', zh: '删除' },
  cancel: { en: 'Cancel', zh: '取消' },
  confirm: { en: 'Confirm', zh: '确认' },
  confirmDelete: { en: 'Are you sure you want to delete this item?', zh: '确定要删除此项吗？' },
  confirmDeleteCategory: { en: 'Are you sure you want to delete this category? All entries in this category will become uncategorized.', zh: '确定要删除此分类吗？该分类下的所有条目将变为未分类。' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
