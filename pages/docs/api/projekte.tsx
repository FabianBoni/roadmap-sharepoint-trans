import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const ProjekteApiDocsPage: React.FC = () => {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Projekte API</h1>
        
        <div className="prose prose-invert max-w-none">
          <p>
            Die Projekte-API ermöglicht es Ihnen, Projekte im Roadmap JSD-System zu erstellen, zu lesen, zu aktualisieren und zu löschen.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Basis-URL</h2>
          
          <p>
            Alle API-Endpunkte sind relativ zu:
          </p>
          
          <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
            <code>/api/projects</code>
          </pre>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Endpunkte</h2>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Alle Projekte abrufen</h3>
          
          <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
            <code>GET /api/projects</code>
          </pre>
          
          <p>
            Ruft eine Liste aller Projekte ab.
          </p>
          
          <h4 className="text-lg font-bold mt-4 mb-2">Antwort</h4>
          
          <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
            <code>{`[
  {
    "id": "1",
    "title": "Projekttitel",
    "category": "cat1",
    "startQuarter": "Q1 2023",
    "endQuarter": "Q3 2023",
    "description": "Projektbeschreibung",
    "status": "in-progress",
    "teamMembers": ["Max Mustermann", "Erika Musterfrau"],
    "fields": {
      "process": ["Prozess 1", "Prozess 2"],
      "technology": ["Technologie 1", "Technologie 2"],
      "service": ["Service 1"],
      "data": ["Daten 1"]
    }
  },
  // ...weitere Projekte
]`}</code>
          </pre>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Ein einzelnes Projekt abrufen</h3>
          
          <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
            <code>GET /api/projects/:id</code>
          </pre>
          
          <p>
            Ruft ein bestimmtes Projekt anhand der ID ab.
          </p>
          
          <h4 className="text-lg font-bold mt-4 mb-2">Parameter</h4>
          
          <ul className="list-disc pl-6 my-4">
            <li><code>id</code> (string, erforderlich): Die ID des abzurufenden Projekts</li>
          </ul>
          
          <h4 className="text-lg font-bold mt-4 mb-2">Antwort</h4>
          
          <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
            <code>{`{
  "id": "1",
  "title": "Projekttitel",
  "category": "cat1",
  "startQuarter": "Q1 2023",
  "endQuarter": "Q3 2023",
  "description": "Projektbeschreibung",
  "status": "in-progress",
  "teamMembers": ["Max Mustermann", "Erika Musterfrau"],
  "fields": {
    "process": ["Prozess 1", "Prozess 2"],
    "technology": ["Technologie 1", "Technologie 2"],
    "service": ["Service 1"],
    "data": ["Daten 1"]
  }
}`}</code>
          </pre>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Ein Projekt erstellen</h3>
          
          <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
            <code>POST /api/projects</code>
          </pre>
          
          <p>
            Erstellt ein neues Projekt.
          </p>
          
          <h4 className="text-lg font-bold mt-4 mb-2">Anforderungskörper</h4>
          
          <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
            <code>{`{
  "title": "Neues Projekt",
  "category": "cat1",
  "startQuarter": "Q1 2023",
  "endQuarter": "Q3 2023",
  "description": "Projektbeschreibung",
  "status": "planned",
  "teamMembers": ["Max Mustermann", "Erika Musterfrau"],
  "fields": {
    "process": ["Prozess 1", "Prozess 2"],
    "technology": ["Technologie 1", "Technologie 2"],
    "service": ["Service 1"],
    "data": ["Daten 1"]
  }
}`}</code>
          </pre>
          
          <h4 className="text-lg font-bold mt-4 mb-2">Antwort</h4>
          
          <p>
            Gibt das erstellte Projekt mit einer zugewiesenen ID zurück.
          </p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Ein Projekt aktualisieren</h3>
          
          <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
            <code>PUT /api/projects/:id</code>
          </pre>
          
          <p>
            Aktualisiert ein bestehendes Projekt.
          </p>
          
          <h4 className="text-lg font-bold mt-4 mb-2">Parameter</h4>
          
          <ul className="list-disc pl-6 my-4">
            <li><code>id</code> (string, erforderlich): Die ID des zu aktualisierenden Projekts</li>
          </ul>
          
          <h4 className="text-lg font-bold mt-4 mb-2">Anforderungskörper</h4>
          
          <p>
            Gleich wie beim Erstellen eines Projekts.
          </p>
          
          <h4 className="text-lg font-bold mt-4 mb-2">Antwort</h4>
          
          <p>
            Gibt das aktualisierte Projekt zurück.
          </p>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Ein Projekt löschen</h3>
          
          <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
            <code>DELETE /api/projects/:id</code>
          </pre>
          
          <p>
            Löscht ein Projekt.
          </p>
          
          <h4 className="text-lg font-bold mt-4 mb-2">Parameter</h4>
          
          <ul className="list-disc pl-6 my-4">
            <li><code>id</code> (string, erforderlich): Die ID des zu löschenden Projekts</li>
          </ul>
          
          <h4 className="text-lg font-bold mt-4 mb-2">Antwort</h4>
          
          <p>
            Gibt bei Erfolg einen 204 No Content-Status zurück.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Beispiele für die Verwendung</h2>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Beispiel: Alle Projekte abrufen</h3>
          
          <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
            <code>{`fetch('/api/projects')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Fehler:', error));`}</code>
          </pre>
          
          <h3 className="text-xl font-bold mt-6 mb-3">Beispiel: Ein neues Projekt erstellen</h3>
          
          <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
            <code>{`const newProject = {
  title: "Neues Projekt",
  category: "cat1",
  startQuarter: "Q1 2023",
  endQuarter: "Q3 2023",
  description: "Beschreibung des neuen Projekts",
  status: "planned",
  teamMembers: ["Max Mustermann"],
  fields: {
    process: ["Prozess 1"],
    technology: ["Technologie 1"],
    service: [],
    data: []
  }
};

fetch('/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(newProject),
})
  .then(response => response.json())
  .then(data => console.log('Projekt erstellt:', data))
  .catch(error => console.error('Fehler:', error));`}</code>
          </pre>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Verwandte API-Dokumentation</h2>
          
          <ul className="list-disc pl-6 my-4">
            <li>
              <Link href="/docs/api/kategorien" className="text-blue-400 hover:text-blue-300">
                Kategorien API
              </Link>
            </li>
            <li>
              <Link href="/docs/api/feldtypen" className="text-blue-400 hover:text-blue-300">
                Feldtypen API
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </DocsLayout>
  );
};

export default ProjekteApiDocsPage;
