import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const FunktionenDocsPage: React.FC = () => {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Funktionen</h1>
        
        <div className="prose prose-invert max-w-none">
          <p>
            Roadmap JSD bietet eine Vielzahl von Funktionen zur Verwaltung und Visualisierung von Projekten auf einer Roadmap. Dieser Abschnitt gibt einen Überblick über die Hauptfunktionen der Anwendung.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Hauptfunktionen</h2>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Roadmap-Visualisierung</h3>
          
          <p>
            Die Kernfunktion von Roadmap JSD ist die visuelle Darstellung von Projekten auf einem Zeitstrahl. Die Roadmap bietet:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li>Quartalsbasierte Zeitachse</li>
            <li>Farbcodierte Projektkarten</li>
            <li>Filterung nach Kategorien</li>
            <li>Interaktive Projektdetails</li>
          </ul>
          
          <p>
            <Link href="/docs/funktionen/roadmap" className="text-blue-400 hover:text-blue-300">
              Mehr über die Roadmap-Visualisierung erfahren →
            </Link>
          </p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Projektmanagement</h3>
          
          <p>
            Umfassende Funktionen zur Verwaltung von Projekten:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li>Erstellen, Bearbeiten und Löschen von Projekten</li>
            <li>Zuweisung von Kategorien und Zeiträumen</li>
            <li>Statusverfolgung (geplant, in Bearbeitung, abgeschlossen)</li>
            <li>Verwaltung von Teammitgliedern</li>
            <li>Benutzerdefinierte Felder für zusätzliche Informationen</li>
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