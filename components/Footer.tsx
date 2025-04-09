import Link from 'next/link';
import React from 'react';

interface FooterProps {
  version?: string;
}

const Footer: React.FC<FooterProps> = ({ version = 'Alpha' }) => {
  return (
    <footer className="py-6 px-10 border-t border-gray-700">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">IT + Digital Portfolio Roadmap</h3>
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Justiz- und Sicherheitsdepartement Basel-Stadt</p>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6">
            <div className="text-center md:text-left">
              <h4 className="text-sm font-medium text-gray-300 mb-1">Kontakt</h4>
              <Link href="mailto:info@jsd.bs.ch" className="text-xs text-gray-400 hover:text-yellow-400 transition-colors">
                fabian.boni@jsd.bs.ch
              </Link>
            </div>
            
            <div className="text-center md:text-left">
              <h4 className="text-sm font-medium text-gray-300 mb-1">Ressourcen</h4>
              <div className="flex flex-col space-y-1">
                <Link href="/admin" className="text-xs text-gray-400 hover:text-yellow-400 transition-colors">Admin</Link>
                <Link href="/docs/pages" className="text-xs text-gray-400 hover:text-yellow-400 transition-colors">Dokumentation</Link>
              </div>
            </div>
            
            <div className="text-center md:text-left">
              <h4 className="text-sm font-medium text-gray-300 mb-1">Version</h4>
              <span className="text-xs text-gray-400">{version}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-800 text-xs text-center text-gray-500">
          Diese Roadmap ist für interne Planungsprozesse. Zuletzt aktualisiert am: {new Date().toLocaleDateString()}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
