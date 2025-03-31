import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const FeldtypenDocsPage: React.FC = () => {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Feldtypen</h1>
        
        <div className="prose prose-invert max-w-none">
          <p>
            Feldtypen ermöglichen die Erweiterung von Projektinformationen mit benutzerdefinierten Daten. Sie bieten eine flexible Möglichkeit, zusätzliche Attribute zu Projekten hinzuzufügen und diese zu kategorisieren.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Arten von Feldtypen</h2>
          
          <p>
            Roadmap JSD unterstützt vier Haupttypen von Feldern:
          </p>
          
          <ol className="list-decimal pl-6 my-4">
            <li><strong>PROCESS</strong>: Geschäftsprozesse, die vom Projekt betroffen sind</li>
            <li><strong>TECHNOLOGY</strong>: Technologien, die im Projekt verwendet werden</li>
            <li><strong>SERVICE</strong>: Dienste, die das Projekt bereitstellt oder nutzt</li>
            <li><strong>DATA</strong>: Datentypen, die im Projekt verarbeitet werden</li>
          </ol>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Feldtyp-Struktur</h2>
          
          <p>
            Jeder Feldtyp besteht aus:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li><strong>Name</strong>: Ein beschreibender Name für den Feldtyp</li>
            <li><strong>Typ</strong>: Eine der vier Hauptkategorien (PROCESS, TECHNOLOGY, SERVICE, DATA)</li>
            <li><strong>Beschreibung</strong>: Eine Erläuterung des Zwecks und der Verwendung des Feldtyps</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Verwendung von Feldtypen in Projekten</h2>
          
          <p>
            Beim Erstellen oder Bearbeiten eines Projekts können Sie Werte für die verschiedenen Feldtypen angeben:
          </p>
          
          <ol className="list-decimal pl-6 my-4">
            <li>Im Projektformular finden Sie Abschnitte für jeden Feldtyp</li>
            <li>Sie können mehrere Werte für jeden Feldtyp hinzufügen</li>
            <li>Diese Werte werden dann in der Projektansicht nach Feldtypen gruppiert angezeigt</li>
          </ol>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Beispiele für Feldtypen</h2>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Prozesse (PROCESS)</h3>
          
          <ul className="list-disc pl-6 my-4">
            <li>Kundenakquise</li>
            <li>Bestellabwicklung</li>
            <li>Personaleinstellung</li>
            <li>Finanzberichterstattung</li>
          </ul>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Technologien (TECHNOLOGY)</h3>
          
          <ul className="list-disc pl-6 my-4">
            <li>Java</li>
            <li>React</li>
            <li>Docker</li>
            <li>AWS</li>
            <li>SAP</li>
          </ul>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Dienste (SERVICE)</h3>
          
          <ul className="list-disc pl-6 my-4">
            <li>E-Mail-Dienst</li>
            <li>Authentifizierungsdienst</li>
            <li>Zahlungsabwicklung</li>
            <li>Datenspeicherung</li>
          </ul>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Daten (DATA)</h3>
          
          <ul className="list-disc pl-6 my-4">
            <li>Kundendaten</li>
            <li>Produktdaten</li>
            <li>Transaktionsdaten</li>
            <li>Analysedaten</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Feldtypen verwalten</h2>
          
          <p>
            Administratoren können Feldtypen über das Admin-Dashboard verwalten:
          </p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Neuen Feldtyp erstellen</h3>
          
          <ol className="list-decimal pl-6 my-4">
            <li>Navigieren Sie zum Admin-Dashboard</li>
            <li>Wechseln Sie zur Registerkarte &quot;Feldtypen&quot;</li>
            <li>Klicken Sie auf &quot;Neues Feld&quot;</li>
            <li>Geben Sie einen Namen ein, wählen Sie einen Typ und fügen Sie eine Beschreibung hinzu</li>
            <li>Klicken Sie auf &quot;Feldtyp erstellen&quot;</li>
          </ol>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Feldtyp bearbeiten</h3>
          
          <ol className="list-decimal pl-6 my-4">
            <li>Suchen Sie den Feldtyp in der Tabelle</li>
            <li>Klicken Sie auf &quot;Bearbeiten&quot;</li>
            <li>Aktualisieren Sie die Informationen</li>
            <li>Klicken Sie auf &quot;Feldtyp aktualisieren&quot;</li>
          </ol>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Feldtyp löschen</h3>
          
          <ol className="list-decimal pl-6 my-4">
            <li>Suchen Sie den Feldtyp in der Tabelle</li>
            <li>Klicken Sie auf &quot;Löschen&quot;</li>
            <li>Bestätigen Sie die Löschung</li>
          </ol>
          
          <p className="mt-4">
            <strong>Hinweis</strong>: Das Löschen eines Feldtyps wirkt sich auf alle Projekte aus, die diesen Feldtyp verwenden. Die entsprechenden Daten gehen verloren.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Beispiel für die Verwendung von Feldtypen</h2>
          
          <p>
            Hier ist ein Beispiel, wie Feldtypen in einem Projekt verwendet werden können:
          </p>
          
          <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
            <code>{`{
  "title": "Einführung eines neuen CRM-Systems",
  "category": "Digital Workplace",
  "startQuarter": "Q1 2023",
  "endQuarter": "Q3 2023",
  "description": "Implementierung eines neuen CRM-Systems zur Verbesserung der Kundenverwaltung und Vertriebsprozesse.",
  "status": "in-progress",
  "fields": {
    "process": [
      "Kundenakquise",
      "Vertriebsprozess",
      "Kundenbetreuung"
    ],
    "technology": [
      "Salesforce",
      "REST API",
      "Single Sign-On"
    ],
    "service": [
      "CRM-Dienst",
      "Reporting-Dienst"
    ],
    "data": [
      "Kundendaten",
      "Vertriebsdaten",
      "Aktivitätsdaten"
    ]
  }
}`}</code>
          </pre>
          
          <p className="mt-4">
            In diesem Beispiel werden verschiedene Feldtypen verwendet, um zusätzliche Informationen über das Projekt zu erfassen. Diese strukturierte Darstellung ermöglicht eine bessere Organisation und Filterung von Projektinformationen.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Verwandte Themen</h2>
          
          <ul className="list-disc pl-6 my-4">
            <li>
              <Link href="/docs/funktionen/projekte" className="text-blue-400 hover:text-blue-300">
                Projekte
              </Link>
            </li>
            <li>
              <Link href="/docs/admin" className="text-blue-400 hover:text-blue-300">
                Admin-Anleitung
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </DocsLayout>
  );
};

export default FeldtypenDocsPage;