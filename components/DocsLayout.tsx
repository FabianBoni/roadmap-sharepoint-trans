import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Footer from './Footer';

interface DocsLayoutProps {
  children: ReactNode;
}

const DocsLayout: React.FC<DocsLayoutProps> = ({ children }) => {
  const router = useRouter();

  const isActive = (path: string) => {
    return router.pathname.startsWith(path) ? 'text-blue-400 font-medium' : 'text-gray-300 hover:text-white';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 py-4 px-6 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Roadmap JSD Dokumentation</h1>
          <Link href="/">
            <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-colors">
              Zurück zur Roadmap
            </button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex">
        {/* Sidebar Navigation */}
        <div className="w-64 pr-8 border-r border-gray-700">
          <nav className="space-y-6">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
                Erste Schritte
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs/erste-schritte">
                    <span className={`block py-1 ${isActive('/docs/pages')}`}>
                      Übersicht
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/docs/erste-schritte/installation">
                    <span className={`block py-1 ${isActive('/docs/erste-schritte/installation')}`}>
                      Installation
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/docs/erste-schritte/konfiguration">
                    <span className={`block py-1 ${isActive('/docs/erste-schritte/konfiguration')}`}>
                      Konfiguration
                    </span>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
                Funktionen
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs/funktionen">
                    <span className={`block py-1 ${isActive('/docs/funktionen/index')}`}>
                      Übersicht
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/docs/funktionen/projekte">
                    <span className={`block py-1 ${isActive('/docs/funktionen/projekte')}`}>
                      Projekte
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/docs/funktionen/kategorien">
                    <span className={`block py-1 ${isActive('/docs/funktionen/kategorien')}`}>
                      Kategorien
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/docs/funktionen/feldtypen">
                    <span className={`block py-1 ${isActive('/docs/funktionen/feldtypen')}`}>
                      Feldtypen
                    </span>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
                API-Referenz
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs/api">
                    <span className={`block py-1 ${isActive('/docs/api/index')}`}>
                      Übersicht
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/docs/api/projekte">
                    <span className={`block py-1 ${isActive('/docs/api/projekte')}`}>
                      Projekte API
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/docs/api/kategorien">
                    <span className={`block py-1 ${isActive('/docs/api/kategorien')}`}>
                      Kategorien API
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/docs/api/feldtypen">
                    <span className={`block py-1 ${isActive('/docs/api/feldtypen')}`}>
                      Feldtypen API
                    </span>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
                Admin
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs/admin">
                    <span className={`block py-1 ${isActive('/docs/admin/index')}`}>
                      Übersicht
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/docs/admin/dashboard">
                    <span className={`block py-1 ${isActive('/docs/admin/dashboard')}`}>
                      Dashboard
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 pl-8">
          <div className="prose prose-invert max-w-none">
            {children}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DocsLayout;