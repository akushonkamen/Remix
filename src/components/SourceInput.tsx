import React, { useState, useRef } from 'react';
import { Plus, Loader2, Link as LinkIcon, FileText, UploadCloud } from 'lucide-react';
import { useKnowledge } from '../context';
import { useLanguage } from '../i18n';

export function SourceInput() {
  const [mode, setMode] = useState<'url' | 'file'>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { addEntry, addFileEntry, loading } = useKnowledge();
  const { t } = useLanguage();
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (mode === 'url') {
        if (!url) {
          setError(t('errorUrl'));
          return;
        }
        await addEntry(url);
        setUrl('');
      } else {
        if (!file) {
          setError(t('errorFile'));
          return;
        }
        await addFileEntry(file);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(t('failedProcess'));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
      <h2 className="text-lg font-semibold mb-4">{t('addSource')}</h2>
      
      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b border-gray-100">
        <button
          onClick={() => setMode('url')}
          className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
            mode === 'url' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <LinkIcon size={16} /> URL
          </span>
          {mode === 'url' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setMode('file')}
          className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
            mode === 'file' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <FileText size={16} /> File
          </span>
          {mode === 'file' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-4 items-start">
        {mode === 'url' ? (
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('pasteUrl')}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            disabled={loading}
          />
        ) : (
          <div className="flex-1">
            <div 
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                file ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.docx,.doc,.pptx,.ppt,.txt"
              />
              <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                {file ? (
                  <>
                    <FileText className="text-indigo-600" size={24} />
                    <span className="text-sm font-medium text-indigo-700">{file.name}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={24} />
                    <span className="text-sm">{t('uploadFile')}</span>
                    <span className="text-xs text-gray-400">{t('dragDrop')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed h-[50px]"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
          {loading ? t('processing') : t('add')}
        </button>
      </form>
      {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
    </div>
  );
}
