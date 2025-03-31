import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const ProjekteDocsPage: React.FC = () => {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Projekte</h1>
        
        <div className="prose prose-invert max-w-none">
          <p>
            Projekte sind die Hauptelemente in der Roadmap JSD-Anwendung. Sie repräsentieren Initiativen, Aufgaben oder Entwicklungen, die auf der Roadmap visualisiert werden.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Projektstruktur</h2>
          
          <p>
            Jedes Projekt besteht aus folgenden Hauptelementen:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li><strong>Titel</strong>: Der Name des Projekts</li>
            <li><strong>Kategorie</strong>: Die Zuordnung zu einer vordefinierten Kategorie</li>
            <li><strong>Zeitplan</strong>: Start- und Endquartal des Projekts</li>
            <li><strong>Beschreibung</strong>: Eine detaillierte Beschreibung des Projekts</li>
            <li><strong>Status</strong>: Der aktuelle Zustand des Projekts (geplant, in Bearbeitung, abgeschlossen)</li>
            <li><strong>Teammitglieder</strong>: Die am Projekt beteiligten Personen</li>
            <li><strong>Benutzerdefinierte Felder</strong>: Zusätzliche Informationen, die nach Feldtypen gruppiert sind</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Projektstatus</h2>
          
          <p>
            Projekte können einen der folgenden Status haben:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li><strong>Geplant</strong>: Das Projekt ist für die Zukunft geplant, aber die Arbeit hat noch nicht begonnen</li>
            <li><strong>In Bearbeitung</strong>: Das Projekt wird aktiv bearbeitet</li>
            <li><strong>Abgeschlossen</strong>: Das Projekt wurde erfolgreich abgeschlossen</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Projekte auf der Roadmap</h2>
          
          <p>
            Auf der Roadmap werden Projekte als Karten auf einem Zeitstrahl dargestellt. Die Position einer Projektkarte auf dem Zeitstrahl wird durch das Start- und Endquartal bestimmt.
          </p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Farbcodierung</h3>
          
          <p>
            Projekte werden entsprechend ihrer Kategorie farbcodiert, was eine schnelle visuelle Identifizierung ermöglicht.
          </p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Filterung</h3>
          
          <p>
            Benutzer können Projekte nach Kategorien filtern, um nur die für sie relevanten Projekte anzuzeigen.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Projektdetails anzeigen</h2>
          
          <p>
            Um detaillierte Informationen zu einem Projekt anzuzeigen:
          </p>
          
          <ol className="list-decimal pl-6 my-4">
            <li>Klicken Sie auf eine Projektkarte auf der Roadmap</li>
            <li>Ein Detailbereich wird geöffnet, der alle Projektinformationen anzeigt, einschließlich:
              <ul className="list-disc pl-6 my-2">
                <li>Beschreibung</li>
                <li>Teammitglieder</li>
                <li>Benutzerdefinierte Felder (Prozesse, Technologien, Services, Daten)</li>
                <li>Status und Zeitplan</li>
              </ul>
            </li>
          </ol>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Beispiel für ein Projekt</h2>
          
          <p>
            Hier ist ein Beispiel für ein typisches Projekt in Roadmap JSD:
          </p>
          
          <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
            <code>{`{
  "id": "1",
  "title": "Einführung eines neuen CRM-Systems",
  "category": "Digital Workplace",
  "startQuarter": "Q1 2023",
  "endQuarter": "Q3 2023",
  "description": "Implementierung eines neuen CRM-Systems zur Verbesserung der Kundenverwaltung und Vertriebsprozesse.",
  "status": "in-progress",
  "teamMembers": ["Max Mustermann", "Erika Musterfrau"],
  "fields": {
    "process": ["Vertriebsprozess", "Kundenbetreuung"],
    "technology": ["Salesforce", "API-Integration"],
    "service": ["CRM-Dienst"],
    "data": ["Kundendaten", "Vertriebsdaten"]
  }
}`}</code>
          </pre>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Verwaltung von Projekten</h2>
          
          <p>
            Administratoren können Projekte über das Admin-Dashboard verwalten. Weitere Informationen finden Sie in der <Link href="/docs/admin" className="text-blue-400 hover:text-blue-300">Admin-Anleitung</Link>.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Verwandte Themen</h2>
          
          <ul className="list-disc pl-6 my-4">
            <li>
              <Link href="/docs/funktionen/kategorien" className="text-blue-400 hover:text-blue-300">
                Kategorien
              </Link>
            </li>
            <li>
              <Link href="/docs/funktionen/feldtypen" className="text-blue-400 hover:text-blue-300">
                Feldtypen
              </Link>
            </li>
            <li>
              <Link href="/docs/funktionen/roadmap" className="text-blue-400 hover:text-blue-300">
                Roadmap-Visualisierung
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </DocsLayout>
  );
};

export default ProjekteDocsPage;
