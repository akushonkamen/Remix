import { KnowledgeProvider } from './context';
import { LanguageProvider } from './i18n';
import { Layout } from './components/Layout';
import { SourceInput } from './components/SourceInput';
import { KnowledgeTable } from './components/KnowledgeTable';
import { CategoryManager } from './components/CategoryManager';

export default function App() {
  return (
    <LanguageProvider>
      <KnowledgeProvider>
        <Layout>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <SourceInput />
              <KnowledgeTable />
            </div>
            <div className="lg:col-span-1">
              <CategoryManager />
            </div>
          </div>
        </Layout>
      </KnowledgeProvider>
    </LanguageProvider>
  );
}
