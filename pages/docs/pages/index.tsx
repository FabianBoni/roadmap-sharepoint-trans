import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const DocsPage: React.FC = () => {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Roadmap JSD Benutzerhandbuch</h1>
        
        <div className="prose prose-invert max-w-none">        
          <p>Willkommen zur offiziellen Dokumentation der Roadmap JSD Anwendung. Hier finden Sie alle Informationen, die Sie für die effektive Nutzung der Roadmap benötigen.</p>
          
          <h2 className='text-2xl font-bold my-2'>Was ist die Roadmap JSD?</h2>
          
          <p>Die Roadmap JSD ist ein interaktives Tool zur Darstellung und Verwaltung von IT-Projekten im Justiz- und Sicherheitsdepartement Basel-Stadt. Sie ermöglicht es Ihnen, den aktuellen Stand und die Planung aller IT-Projekte auf einen Blick zu erfassen.</p>
          
          <h2 className='text-2xl font-bold my-2'>Was können Sie mit der Roadmap machen?</h2>
          
          <ul>
            <li><strong>Projekte anzeigen</strong>: Verschaffen Sie sich einen Überblick über alle laufenden und geplanten Projekte</li>
            <li><strong>Nach Kategorien filtern</strong>: Finden Sie schnell Projekte bestimmter Bereiche (Digital Workplace, Infrastruktur, etc.)</li>
            <li><strong>Projektdetails einsehen</strong>: Erhalten Sie detaillierte Informationen zu jedem Projekt</li>
            <li><strong>Status verfolgen</strong>: Sehen Sie den aktuellen Fortschritt und Status aller Projekte</li>
            <li><strong>Zeiträume verstehen</strong>: Erkennen Sie wann Projekte starten und abgeschlossen werden</li>
          </ul>
          
          <h2 className='text-2xl font-bold my-2'>Schnellstart</h2>
          
          <p>Beginnen Sie mit dem <Link href="/docs/funktionen/roadmap" className="text-blue-400 hover:text-blue-300">Roadmap-Überblick</Link> um zu lernen, wie Sie die Hauptansicht verwenden, oder erkunden Sie die <Link href="/docs/funktionen" className="text-blue-400 hover:text-blue-300">einzelnen Funktionen</Link> im Detail.</p>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">🗺️ Roadmap verwenden</h2>
            <p className="text-gray-300 mb-4">
              Lernen Sie, wie Sie die Roadmap navigieren, Projekte finden und Informationen abrufen.
            </p>
            <Link href="/docs/funktionen/roadmap">
              <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors">
                Roadmap erkunden
              </button>
            </Link>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">📊 Projekte verstehen</h2>
            <p className="text-gray-300 mb-4">
              Erfahren Sie, wie Projekte strukturiert sind und welche Informationen verfügbar sind.
            </p>
            <Link href="/docs/funktionen">
              <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors">
                Mehr erfahren
              </button>
            </Link>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">API-Referenz</h2>
            <p className="text-gray-300 mb-4">
              Vollständige Dokumentation der API-Endpunkte für Entwickler.
            </p>
            <Link href="/docs/api">
              <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors">
                Mehr erfahren
              </button>
            </Link>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Admin-Anleitung</h2>
            <p className="text-gray-300 mb-4">
              Umfassende Anleitung für Administratoren zur Verwaltung des Systems.
            </p>
            <Link href="/docs/admin">
              <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors">
                Mehr erfahren
              </button>
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
};

export default DocsPage;