import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const UebersichtDocsPage: React.FC = () => {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Übersicht über Roadmap JSD</h1>
        
        <div className="prose prose-invert max-w-none">
          <p>
            Diese Übersicht bietet einen Einblick in die Struktur und Funktionsweise von Roadmap JSD, damit Sie ein grundlegendes Verständnis der Anwendung erhalten.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Was ist Roadmap JSD?</h2>
          
          <p>
            Roadmap JSD ist eine Anwendung zur Visualisierung und Verwaltung von Projekten auf einer Roadmap. Sie wurde entwickelt, um Teams bei der Planung, Verfolgung und Kommunikation von Projektzeitplänen zu unterstützen.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Architektur</h2>
          
          <p>
            Roadmap JSD basiert auf folgenden Technologien:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li><strong>Frontend</strong>: Next.js mit React und Tailwind CSS</li>
            <li><strong>Backend</strong>: Next.js API-Routen</li>
            <li><strong>Datenbank</strong>: Relationale Datenbank (PostgreSQL empfohlen) mit Prisma ORM</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Hauptkomponenten</h2>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Roadmap-Ansicht</h3>
          
          <p>
            Die Hauptansicht der Anwendung zeigt eine Roadmap mit allen Projekten, die nach Quartalen organisiert sind. Benutzer können:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li>Projekte nach Kategorien filtern</li>
            <li>Auf Projekte klicken, um Details anzuzeigen</li>
            <li>Die Zeitachse navigieren</li>
          </ul>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Admin-Dashboard</h3>
          
          <p>
            Das Admin-Dashboard ermöglicht die Verwaltung aller Aspekte der Anwendung:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li>Projekte erstellen, bearbeiten und löschen</li>
            <li>Kategorien verwalten</li>
            <li>Feldtypen definieren</li>
          </ul>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Projektdetails</h3>
          
          <p>
            Jedes Projekt enthält detaillierte Informationen:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li>Titel und Beschreibung</li>
            <li>Kategorie</li>
            <li>Zeitraum (Start- und Endquartal)</li>
            <li>Status</li>
            <li>Teammitglieder</li>
            <li>Benutzerdefinierte Felder (Prozesse, Technologien, Services, Daten)</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Datenmodell</h2>
          
          <p>
            Das Datenmodell von Roadmap JSD besteht aus folgenden Hauptentitäten:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li><strong>Projekte</strong>: Die Hauptelemente der Roadmap</li>
            <li><strong>Kategorien</strong>: Gruppierungen für Projekte</li>
            <li><strong>Feldtypen</strong>: Definitionen für benutzerdefinierte Projektfelder</li>
            <li><strong>Benutzer</strong>: Administratoren und andere Benutzer des Systems</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Workflow</h2>
          
          <p>
            Der typische Workflow in Roadmap JSD sieht wie folgt aus:
          </p>
          
          <ol className="list-decimal pl-6 my-4">
            <li>Administrator richtet Kategorien und Feldtypen ein</li>
            <li>Administrator erstellt Projekte und weist ihnen Kategorien, Zeiträume und andere Attribute zu</li>
            <li>Benutzer sehen die Roadmap und können Projekte nach Kategorien filtern</li>
            <li>Benutzer können auf Projekte klicken, um detaillierte Informationen anzuzeigen</li>
            <li>Administrator aktualisiert Projekte bei Bedarf</li>
          </ol>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Nächste Schritte</h2>
          
          <p>
            Nachdem Sie einen Überblick über Roadmap JSD erhalten haben, können Sie:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li>
              <Link href="/docs/erste-schritte/installation" className="text-blue-400 hover:text-blue-300">
                Die Anwendung installieren
              </Link>
            </li>
            <li>
              <Link href="/docs/erste-schritte/konfiguration" className="text-blue-400 hover:text-blue-300">
                Die Konfiguration anpassen
              </Link>
            </li>
            <li>
              <Link href="/docs/funktionen" className="text-blue-400 hover:text-blue-300">
                Die Funktionen im Detail erkunden
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </DocsLayout>
  );
};

export default UebersichtDocsPage;
