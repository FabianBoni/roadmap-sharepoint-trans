import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const InstallationDocsPage: React.FC = () => {
    return (
        <DocsLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">🚀 So starten Sie mit JSDoIT Roadmap</h1>

                <div className="prose prose-invert max-w-none">
                    <p className="text-lg text-gray-300">
                        Eine einfache Anleitung, um schnell mit JSDoIT Roadmap zu beginnen und das Beste aus der Anwendung herauszuholen.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Schritt 1: Zugang zur Roadmap</h2>

                    <div className="bg-blue-900/30 p-6 rounded-lg my-6">
                        <p className="mb-4">
                            JSDoIT Roadmap ist direkt über Ihren Webbrowser verfügbar. Sie benötigen keine separate Installation.
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Öffnen Sie Ihren bevorzugten Webbrowser</li>
                            <li>Navigieren Sie zur Roadmap-URL (wird von Ihrem Administrator bereitgestellt)</li>
                            <li>Die Anwendung lädt automatisch und zeigt die aktuelle Roadmap an</li>
                        </ul>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Schritt 2: Erste Orientierung</h2>

                    <p>
                        Wenn Sie die Roadmap zum ersten Mal öffnen, sehen Sie:
                    </p>

                    <ul className="list-disc pl-6 my-4">
                        <li><strong>Projektübersicht</strong>: Alle Projekte chronologisch angeordnet</li>
                        <li><strong>Zeitachse</strong>: Quartale und Jahre zur Navigation</li>
                        <li><strong>Filter</strong>: Kategorien zur gezielten Projektsuche</li>
                        <li><strong>Suchfunktion</strong>: Schnelle Suche nach spezifischen Projekten</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Schritt 3: Navigation lernen</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">📅 Zeitnavigation</h3>
                    <p>
                        Nutzen Sie die Jahres- und Quartalsnavigation, um verschiedene Zeiträume zu erkunden:
                    </p>
                    <ul className="list-disc pl-6 my-4">
                        <li>Klicken Sie auf ein Jahr, um zu diesem Zeitraum zu springen</li>
                        <li>Verwenden Sie die Pfeiltasten für chronologische Navigation</li>
                        <li>Der &quot;Heute&quot;-Button bringt Sie zurück zum aktuellen Zeitraum</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-6 mb-3">🏷️ Filter verwenden</h3>
                    <p>
                        Filtern Sie Projekte nach Ihren Interessen:
                    </p>
                    <ul className="list-disc pl-6 my-4">
                        <li>Wählen Sie Kategorien aus, die Sie interessieren</li>
                        <li>Kombinieren Sie mehrere Filter für genauere Ergebnisse</li>
                        <li>Nutzen Sie die Suchleiste für spezifische Begriffe</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Schritt 4: Projekte erkunden</h2>

                    <div className="bg-green-900/30 p-6 rounded-lg my-6">
                        <h3 className="text-lg font-semibold text-green-300 mb-3">💡 Interaktion mit Projekten</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Überblick</strong>: Schweben Sie über ein Projekt für eine Kurzbeschreibung</li>
                            <li><strong>Details</strong>: Klicken Sie auf ein Projekt für vollständige Informationen</li>
                            <li><strong>Status</strong>: Farbcodes zeigen den aktuellen Projektstatus an</li>
                            <li><strong>Team</strong>: Sehen Sie beteiligte Personen und Verantwortliche</li>
                        </ul>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Schritt 5: Tipps für den Alltag</h2>

                    <div className="bg-yellow-900/30 p-6 rounded-lg my-6">
                        <h3 className="text-lg font-semibold text-yellow-300 mb-3">📌 Nützliche Funktionen</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Direktlinks</strong>: Jedes Projekt hat eine eindeutige URL, die Sie teilen können</li>
                            <li><strong>Responsive Design</strong>: Die Roadmap funktioniert auf Desktop, Tablet und Smartphone</li>
                            <li><strong>Echtzeit-Updates</strong>: Änderungen werden automatisch angezeigt</li>
                            <li><strong>Keyboard-Navigation</strong>: Verwenden Sie Pfeiltasten zur schnellen Navigation</li>
                        </ul>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Häufige Fragen</h2>

                    <div className="space-y-4">
                        <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h3 className="font-bold text-blue-300 mb-2">Wie oft wird die Roadmap aktualisiert?</h3>
                            <p>Die Roadmap wird kontinuierlich aktualisiert. Neue Projekte und Änderungen werden regelmäßig hinzugefügt.</p>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h3 className="font-bold text-blue-300 mb-2">Kann ich Projekte bearbeiten?</h3>
                            <p>Als regulärer Benutzer können Sie Projekte anzeigen und durchsuchen. Für Änderungen wenden Sie sich an Ihren Administrator.</p>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h3 className="font-bold text-blue-300 mb-2">Funktioniert die Roadmap offline?</h3>
                            <p>Die Roadmap benötigt eine Internetverbindung für aktuelle Daten. Einige Inhalte können kurzzeitig im Browser zwischengespeichert werden.</p>
                        </div>
                    </div>

                    <div className="bg-green-900/30 p-6 rounded-lg my-8">
                        <h3 className="text-lg font-semibold text-green-300 mb-3">🎉 Fertig!</h3>
                        <p className="mb-4">
                            Sie sind jetzt bereit, JSDoIT Roadmap effektiv zu nutzen. Beginnen Sie mit der Erkundung der verfügbaren Projekte 
                            und entdecken Sie, wie die Roadmap Ihnen bei der Projektplanung hilft.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors">
                                🚀 Zur Roadmap
                            </Link>
                            <Link href="/docs/funktionen" className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors">
                                📚 Weitere Funktionen
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </DocsLayout>
    );
};

export default InstallationDocsPage;