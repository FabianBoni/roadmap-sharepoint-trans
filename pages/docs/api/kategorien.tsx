import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const KategorienApiDocsPage: React.FC = () => {
    return (
        <DocsLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Kategorien API</h1>

                <div className="prose prose-invert max-w-none">
                    <p>
                        Die Kategorien-API ermöglicht es Ihnen, Projektkategorien im Roadmap JSD-System zu erstellen, zu lesen, zu aktualisieren und zu löschen.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Basis-URL</h2>

                    <p>
                        Alle API-Endpunkte sind relativ zu:
                    </p>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>/api/categories</code>
                    </pre>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Endpunkte</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">Alle Kategorien abrufen</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>GET /api/categories</code>
                    </pre>

                    <p>
                        Ruft eine Liste aller Kategorien ab.
                    </p>

                    <h4 className="text-lg font-bold mt-4 mb-2">Antwort</h4>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`[
  {
    "id": "cat1",
    "name": "Digital Workplace",
    "color": "#4299E1",
    "icon": "ComputerIcon"
  },
  {
    "id": "cat2",
    "name": "Infrastruktur",
    "color": "#48BB78",
    "icon": "ServerIcon"
  },
  // ...weitere Kategorien
]`}</code>
                    </pre>

                    <h3 className="text-xl font-bold mt-6 mb-3">Eine einzelne Kategorie abrufen</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>GET /api/categories/:id</code>
                    </pre>

                    <p>
                        Ruft eine bestimmte Kategorie anhand der ID ab.
                    </p>

                    <h4 className="text-lg font-bold mt-4 mb-2">Parameter</h4>

                    <ul className="list-disc pl-6 my-4">
                        <li><code>id</code> (string, erforderlich): Die ID der abzurufenden Kategorie</li>
                    </ul>

                    <h4 className="text-lg font-bold mt-4 mb-2">Antwort</h4>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`{
  "id": "cat1",
  "name": "Digital Workplace",
  "color": "#4299E1",
  "icon": "ComputerIcon"
}`}</code>
                    </pre>

                    <h3 className="text-xl font-bold mt-6 mb-3">Eine Kategorie erstellen</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>POST /api/categories</code>
                    </pre>

                    <p>
                        Erstellt eine neue Kategorie.
                    </p>

                    <h4 className="text-lg font-bold mt-4 mb-2">Anforderungskörper</h4>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`{
  "name": "Neue Kategorie",
  "color": "#9F7AEA",
  "icon": "CloudIcon"
}`}</code>
                    </pre>

                    <h4 className="text-lg font-bold mt-4 mb-2">Antwort</h4>

                    <p>
                        Gibt die erstellte Kategorie mit einer zugewiesenen ID zurück.
                    </p>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`{
  "id": "cat3",
  "name": "Neue Kategorie",
  "color": "#9F7AEA",
  "icon": "CloudIcon"
}`}</code>
                    </pre>

                    <h3 className="text-xl font-bold mt-6 mb-3">Eine Kategorie aktualisieren</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>PUT /api/categories/:id</code>
                    </pre>

                    <p>
                        Aktualisiert eine bestehende Kategorie.
                    </p>

                    <h4 className="text-lg font-bold mt-4 mb-2">Parameter</h4>

                    <ul className="list-disc pl-6 my-4">
                        <li><code>id</code> (string, erforderlich): Die ID der zu aktualisierenden Kategorie</li>
                    </ul>

                    <h4 className="text-lg font-bold mt-4 mb-2">Anforderungskörper</h4>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`{
  "name": "Aktualisierte Kategorie",
  "color": "#ED8936",
  "icon": "ShieldIcon"
}`}</code>
                    </pre>

                    <h4 className="text-lg font-bold mt-4 mb-2">Antwort</h4>

                    <p>
                        Gibt die aktualisierte Kategorie zurück.
                    </p>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`{
  "id": "cat1",
  "name": "Aktualisierte Kategorie",
  "color": "#ED8936",
  "icon": "ShieldIcon"
}`}</code>
                    </pre>

                    <h3 className="text-xl font-bold mt-6 mb-3">Eine Kategorie löschen</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>DELETE /api/categories/:id</code>
                    </pre>

                    <p>
                        Löscht eine Kategorie.
                    </p>

                    <h4 className="text-lg font-bold mt-4 mb-2">Parameter</h4>

                    <ul className="list-disc pl-6 my-4">
                        <li><code>id</code> (string, erforderlich): Die ID der zu löschenden Kategorie</li>
                    </ul>

                    <h4 className="text-lg font-bold mt-4 mb-2">Antwort</h4>

                    <p>
                        Gibt bei Erfolg einen 204 No Content-Status zurück.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Fehlerbehandlung</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">Häufige Fehlercodes</h3>

                    <ul className="list-disc pl-6 my-4">
                        <li><strong>400 Bad Request</strong>: Ungültige Anforderungsparameter oder -körper</li>
                        <li><strong>404 Not Found</strong>: Die angeforderte Kategorie wurde nicht gefunden</li>
                        <li><strong>500 Internal Server Error</strong>: Serverfehler bei der Verarbeitung der Anfrage</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-6 mb-3">Beispiel für eine Fehlerantwort</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`{
  "error": "Kategorie nicht gefunden"
}`}</code>
                    </pre>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Beispiele für die Verwendung</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">Beispiel: Alle Kategorien abrufen</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`fetch('/api/categories')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Fehler:', error));`}</code>
                    </pre>

                    <h3 className="text-xl font-bold mt-6 mb-3">Beispiel: Eine neue Kategorie erstellen</h3>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`const newCategory = {
  name: "Neue Kategorie",
  color: "#9F7AEA",
  icon: "CloudIcon"
};

fetch('/api/categories', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(newCategory),
})
  .then(response => response.json())
  .then(data => console.log('Kategorie erstellt:', data))
  .catch(error => console.error('Fehler:', error));`}</code>
                    </pre>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Verwandte API-Dokumentation</h2>

                    <ul className="list-disc pl-6 my-4">
                        <li>
                            <Link href="/docs/api/projekte" className="text-blue-400 hover:text-blue-300">
                                Projekte API
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

export default KategorienApiDocsPage;