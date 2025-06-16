import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const FunktionenDocsPage: React.FC = () => {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Funktionen der Roadmap</h1>
        
        <div className="prose prose-invert max-w-none">
          <p>
            Die Roadmap JSD bietet verschiedene Funktionen, um Ihnen einen optimalen Überblick über alle IT-Projekte zu verschaffen. Hier erfahren Sie, wie Sie alle Features effektiv nutzen.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Hauptfunktionen für Benutzer</h2>
          
          <h3 className="text-xl font-bold mt-6 mb-3">🗺️ Roadmap-Ansicht</h3>
          
          <p>
            Die Hauptansicht zeigt alle Projekte auf einer übersichtlichen Zeitachse:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li>Quartalweise Darstellung aller Projekte</li>
            <li>Farbkodierung nach Projektbereichen</li>
            <li>Schnelle Filterung nach Kategorien</li>
            <li>Klickbare Projektkarten für Details</li>
            <li>Statusanzeige für jeden Projektfortschritt</li>
          </ul>
          
          <p>
            <Link href="/docs/funktionen/roadmap" className="text-blue-400 hover:text-blue-300">
              → Wie Sie die Roadmap-Ansicht verwenden
            </Link>
          </p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">📊 Projektinformationen</h3>
          
          <p>
            Erhalten Sie detaillierte Informationen zu jedem Projekt:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li>Projektbeschreibung und Ziele</li>
            <li>Verantwortliche Projektleitung</li>
            <li>Aktueller Status und Fortschritt</li>
            <li>Zeitplan und Meilensteine</li>
            <li>Budget und Ressourceninformationen</li>
            <li>Links zu weiteren Dokumenten</li>
          </ul>
          
          <p>
            <Link href="/docs/funktionen/projekte" className="text-blue-400 hover:text-blue-300">
              Mehr über Projektmanagement erfahren →
            </Link>
          </p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Kategorisierung</h3>
          
          <p>
            Organisieren Sie Projekte mit anpassbaren Kategorien:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li>Farbcodierung für visuelle Unterscheidung</li>
            <li>Symbolzuweisung für schnelle Erkennung</li>
            <li>Filterung der Roadmap nach Kategorien</li>
          </ul>
          
          <p>
            <Link href="/docs/funktionen/kategorien" className="text-blue-400 hover:text-blue-300">
              Mehr über Kategorien erfahren →
            </Link>
          </p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Benutzerdefinierte Felder</h3>
          
          <p>
            Erweitern Sie Projektinformationen mit strukturierten Daten:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li>Vordefinierte Feldtypen (Prozesse, Technologien, Services, Daten)</li>
            <li>Gruppierung verwandter Informationen</li>
            <li>Flexible Erweiterbarkeit</li>
          </ul>
          
          <p>
            <Link href="/docs/funktionen/feldtypen" className="text-blue-400 hover:text-blue-300">
              Mehr über Feldtypen erfahren →
            </Link>
          </p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Admin-Dashboard</h3>
          
          <p>
            Umfassende Verwaltungsoberfläche:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li>Projektverwaltung</li>
            <li>Kategorieverwaltung</li>
            <li>Feldtypenverwaltung</li>
            <li>Benutzerauthentifizierung</li>
          </ul>
          
          <p>
            <Link href="/docs/admin" className="text-blue-400 hover:text-blue-300">
              Mehr über das Admin-Dashboard erfahren →
            </Link>
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Funktionsübersicht</h2>
          
          <div className="bg-gray-800 p-4 rounded-md my-4">
            <h3 className="text-lg font-bold mb-2">Roadmap-Visualisierung</h3>
            <p>Visualisieren Sie Projekte auf einem quartalsbasierten Zeitstrahl mit farbcodierten Karten und interaktiven Details.</p>
            <p className="mt-2">
              <Link href="/docs/funktionen/roadmap" className="text-blue-400 hover:text-blue-300">
                Details →
              </Link>
            </p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-md my-4">
            <h3 className="text-lg font-bold mb-2">Projekte</h3>
            <p>Verwalten Sie Projekte mit detaillierten Informationen, Zeitplänen, Status und benutzerdefinierten Feldern.</p>
            <p className="mt-2">
              <Link href="/docs/funktionen/projekte" className="text-blue-400 hover:text-blue-300">
                Details →
              </Link>
            </p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-md my-4">
            <h3 className="text-lg font-bold mb-2">Kategorien</h3>
            <p>Organisieren Sie Projekte in farbcodierte Kategorien für bessere Übersicht und Filterung.</p>
            <p className="mt-2">
              <Link href="/docs/funktionen/kategorien" className="text-blue-400 hover:text-blue-300">
                Details →
              </Link>
            </p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-md my-4">
            <h3 className="text-lg font-bold mb-2">Feldtypen</h3>
            <p>Erweitern Sie Projektinformationen mit strukturierten, benutzerdefinierten Feldern für Prozesse, Technologien, Services und Daten.</p>
            <p className="mt-2">
              <Link href="/docs/funktionen/feldtypen" className="text-blue-400 hover:text-blue-300">
                Details →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
};

export default FunktionenDocsPage;