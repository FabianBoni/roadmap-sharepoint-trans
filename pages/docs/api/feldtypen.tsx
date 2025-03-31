import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const FeldtypenApiDocsPage: React.FC = () => {
    return (
        <DocsLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Feldtypen API</h1>

                <div className="prose prose-invert max-w-none">
                    <p>
                        Die Feldtypen-API ermöglicht es Ihnen, benutzerdefinierte Feldtypen im Roadmap JSD-System zu erstellen, zu lesen, zu aktualisieren und zu löschen.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Basis-URL</h2>

                    <p>
                        Alle API-Endpunkte sind relativ zu:
                    </p>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>/api/fieldTypes</code>
                    </pre>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Endpunkte</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">Alle Feldtypen abrufen</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>GET /api/fieldTypes</code>
                    </pre>

                    <p>
                        Ruft eine Liste aller Feldtypen ab.
                    </p>

                    <h4 className="text-lg font-bold mt-4 mb-2">Antwort</h4>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`[
  {
    "id": "1",
    "name": "Geschäftsprozess",
    "type": "PROCESS",
    "description": "Geschäftsprozesse, die vom Projekt betroffen sind"
  },
  {
    "id": "2",
    "name": "Technologie",
    "type": "TECHNOLOGY",
    "description": "Technologien, die im Projekt verwendet werden"
  },
  // ...weitere Feldtypen
]`}</code>
                    </pre>

                    <h3 className="text-xl font-bold mt-6 mb-3">Einen einzelnen Feldtyp abrufen</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>GET /api/fieldTypes/:id</code>
                    </pre>

                    <p>
                        Ruft einen bestimmten Feldtyp anhand der ID ab.
                    </p>

                    <h4 className="text-lg font-bold mt-4 mb-2">Parameter</h4>

                    <ul className="list-disc pl-6 my-4">
                        <li><code>id</code> (string, erforderlich): Die ID des abzurufenden Feldtyps</li>
                    </ul>

                    <h4 className="text-lg font-bold mt-4 mb-2">Antwort</h4>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`{
  "id": "1",
  "name": "Geschäftsprozess",
  "type": "PROCESS",
  "description": "Geschäftsprozesse, die vom Projekt betroffen sind"
}`}</code>
                    </pre>

                    <h3 className="text-xl font-bold mt-6 mb-3">Einen Feldtyp erstellen</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>POST /api/fieldTypes</code>
                    </pre>

                    <p>
                        Erstellt einen neuen Feldtyp.
                    </p>

                    <h4 className="text-lg font-bold mt-4 mb-2">Anforderungskörper</h4>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`{
  "name": "Neuer Feldtyp",
  "type": "SERVICE",
  "description": "Beschreibung des neuen Feldtyps"
}`}</code>
                    </pre>

                    <h4 className="text-lg font-bold mt-4 mb-2">Antwort</h4>

                    <p>
                        Gibt den erstellten Feldtyp mit einer zugewiesenen ID zurück.
                    </p>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`{
  "id": "5",
  "name": "Neuer Feldtyp",
  "type": "SERVICE",
  "description": "Beschreibung des neuen Feldtyps"
}`}</code>
                    </pre>

                    <h3 className="text-xl font-bold mt-6 mb-3">Einen Feldtyp aktualisieren</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>PUT /api/fieldTypes/:id</code>
                    </pre>

                    <p>
                        Aktualisiert einen bestehenden Feldtyp.
                    </p>

                    <h4 className="text-lg font-bold mt-4 mb-2">Parameter</h4>

                    <ul className="list-disc pl-6 my-4">
                        <li><code>id</code> (string, erforderlich): Die ID des zu aktualisierenden Feldtyps</li>
                    </ul>

                    <h4 className="text-lg font-bold mt-4 mb-2">Anforderungskörper</h4>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`{
  "name": "Aktualisierter Feldtyp",
  "type": "DATA",
  "description": "Aktualisierte Beschreibung"
}`}</code>
                    </pre>

                    <h4 className="text-lg font-bold mt-4 mb-2">Antwort</h4>

                    <p>
                        Gibt den aktualisierten Feldtyp zurück.
                    </p>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`{
  "id": "1",
  "name": "Aktualisierter Feldtyp",
  "type": "DATA",
  "description": "Aktualisierte Beschreibung"
}`}</code>
                    </pre>

                    <h3 className="text-xl font-bold mt-6 mb-3">Einen Feldtyp löschen</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>DELETE /api/fieldTypes/:id</code>
                    </pre>

                    <p>
                        Löscht einen Feldtyp.
                    </p>

                    <h4 className="text-lg font-bold mt-4 mb-2">Parameter</h4>

                    <ul className="list-disc pl-6 my-4">
                        <li><code>id</code> (string, erforderlich): Die ID des zu löschenden Feldtyps</li>
                    </ul>

                    <h4 className="text-lg font-bold mt-4 mb-2">Antwort</h4>

                    <p>
                        Gibt bei Erfolg einen 204 No Content-Status zurück.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Fehlerbehandlung</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">Häufige Fehlercodes</h3>

                    <ul className="list-disc pl-6 my-4">
                        <li><strong>400 Bad Request</strong>: Ungültige Anforderungsparameter oder -körper</li>
                        <li><strong>404 Not Found</strong>: Der angeforderte Feldtyp wurde nicht gefunden</li>
                        <li><strong>500 Internal Server Error</strong>: Serverfehler bei der Verarbeitung der Anfrage</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-6 mb-3">Beispiel für eine Fehlerantwort</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`{
  "error": "Feldtyp nicht gefunden"
}`}</code>
                    </pre>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Beispiele für die Verwendung</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">Beispiel: Alle Feldtypen abrufen</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`fetch('/api/fieldTypes')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Fehler:', error));`}</code>
                    </pre>

                    <h3 className="text-xl font-bold mt-6 mb-3">Beispiel: Einen neuen Feldtyp erstellen</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`const newFieldType = {
  name: "Neuer Feldtyp",
  type: "SERVICE",
  description: "Beschreibung des neuen Feldtyps"
};

fetch('/api/fieldTypes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(newFieldType),
})
  .then(response => response.json())
  .then(data => console.log('Feldtyp erstellt:', data))
  .catch(error => console.error('Fehler:', error));`}</code>
                    </pre>

                    <h3 className="text-xl font-bold mt-6 mb-3">Beispiel: Einen Feldtyp aktualisieren</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`const updatedFieldType = {
  name: "Aktualisierter Feldtyp",
  type: "DATA",
  description: "Aktualisierte Beschreibung"
};

fetch('/api/fieldTypes/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updatedFieldType),
})
  .then(response => response.json())
  .then(data => console.log('Feldtyp aktualisiert:', data))
  .catch(error => console.error('Fehler:', error));`}</code>
                    </pre>

                    <h3 className="text-xl font-bold mt-6 mb-3">Beispiel: Einen Feldtyp löschen</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`fetch('/api/fieldTypes/1', {
  method: 'DELETE',
})
  .then(response => {
    if (response.status === 204) {
      console.log('Feldtyp erfolgreich gelöscht');
    } else {
      throw new Error('Fehler beim Löschen des Feldtyps');
    }
  })
  .catch(error => console.error('Fehler:', error));`}</code>
                    </pre>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Feldtyp-Typen</h2>

                    <p>
                        Die folgenden Feldtyp-Typen werden vom System unterstützt:
                    </p>

                    <ul className="list-disc pl-6 my-4">
                        <li><strong>PROCESS</strong>: Geschäftsprozesse, die vom Projekt betroffen sind</li>
                        <li><strong>TECHNOLOGY</strong>: Technologien, die im Projekt verwendet werden</li>
                        <li><strong>SERVICE</strong>: Dienste, die das Projekt bereitstellt oder nutzt</li>
                        <li><strong>DATA</strong>: Datentypen, die im Projekt verarbeitet werden</li>
                    </ul>

                    <p>
                        Bei der Erstellung oder Aktualisierung eines Feldtyps muss einer dieser Typen angegeben werden.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Verwandte API-Dokumentation</h2>

                    <ul className="list-disc pl-6 my-4">
                        <li>
                            <Link href="/docs/api/projekte" className="text-blue-400 hover:text-blue-300">
                                Projekte API
                            </Link>
                        </li>
                        <li>
                            <Link href="/docs/api/kategorien" className="text-blue-400 hover:text-blue-300">
                                Kategorien API
                            </Link>
                        </li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Verwandte Funktionsdokumentation</h2>

                    <ul className="list-disc pl-6 my-4">
                        <li>
                            <Link href="/docs/funktionen/feldtypen" className="text-blue-400 hover:text-blue-300">
                                Feldtypen - Funktionsübersicht
                            </Link>
                        </li>
                        <li>
                            <Link href="/docs/admin" className="text-blue-400 hover:text-blue-300">
                                Admin-Anleitung - Feldtypen verwalten
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </DocsLayout>
    );
};

export default FeldtypenApiDocsPage;