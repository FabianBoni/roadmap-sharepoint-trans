import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const KonfigurationDocsPage: React.FC = () => {
    return (
        <DocsLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">⚙️ Roadmap personalisieren</h1>

                <div className="prose prose-invert max-w-none">
                    <p className="text-lg text-gray-300">
                        Erfahren Sie, wie Sie JSDoIT Roadmap an Ihre Bedürfnisse anpassen und optimal nutzen können.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Browser-Einstellungen optimieren</h2>

                    <div className="bg-blue-900/30 p-6 rounded-lg my-6">
                        <h3 className="text-lg font-semibold text-blue-300 mb-3">🌐 Für die beste Nutzererfahrung</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Lesezeichen setzen</strong>: Speichern Sie die Roadmap-URL für schnellen Zugriff</li>
                            <li><strong>Vollbildmodus</strong>: Drücken Sie F11 für eine größere Darstellung</li>
                            <li><strong>Zoom anpassen</strong>: Verwenden Sie Strg + / Strg - für die optimale Schriftgröße</li>
                            <li><strong>Browser aktuell halten</strong>: Nutzen Sie eine aktuelle Browser-Version</li>
                        </ul>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Filter und Ansichten anpassen</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">🏷️ Kategorie-Filter</h3>
                    <p>
                        Passen Sie die Filter an Ihre Arbeitsweise an:
                    </p>
                    <ul className="list-disc pl-6 my-4">
                        <li><strong>Häufig genutzte Filter</strong>: Merken Sie sich Ihre wichtigsten Kategorien</li>
                        <li><strong>Kombinationen</strong>: Nutzen Sie mehrere Filter gleichzeitig für präzise Ergebnisse</li>
                        <li><strong>Filter zurücksetzen</strong>: Klicken Sie auf "Alle Filter zurücksetzen" für eine saubere Ansicht</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-6 mb-3">📊 Anzeigeoptionen</h3>
                    <p>
                        Wählen Sie die für Sie passende Darstellung:
                    </p>
                    <ul className="list-disc pl-6 my-4">
                        <li><strong>Kompakte Ansicht</strong>: Mehr Projekte auf einen Blick</li>
                        <li><strong>Detaillierte Ansicht</strong>: Ausführlichere Informationen pro Projekt</li>
                        <li><strong>Gruppierte Ansicht</strong>: Projekte nach Kategorien sortiert</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Arbeitsabläufe optimieren</h2>

                    <div className="bg-green-900/30 p-6 rounded-lg my-6">
                        <h3 className="text-lg font-semibold text-green-300 mb-3">💡 Produktivitäts-Tipps</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Regelmäßige Updates</strong>: Schauen Sie wöchentlich nach neuen Projekten</li>
                            <li><strong>Direktlinks teilen</strong>: Versenden Sie Links zu spezifischen Projekten</li>
                            <li><strong>Mobile Nutzung</strong>: Nutzen Sie die Roadmap auch unterwegs am Smartphone</li>
                            <li><strong>Screenshots erstellen</strong>: Machen Sie Aufnahmen für Präsentationen</li>
                        </ul>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Keyboard-Shortcuts</h2>

                    <div className="bg-gray-800/50 p-6 rounded-lg my-6">
                        <h3 className="text-lg font-semibold text-gray-300 mb-4">⌨️ Tastenkombinationen</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="font-semibold text-blue-300">Navigation</div>
                                <ul className="list-none space-y-1 text-sm">
                                    <li><code className="bg-gray-700 px-2 py-1 rounded">←/→</code> Zeitperioden wechseln</li>
                                    <li><code className="bg-gray-700 px-2 py-1 rounded">↑/↓</code> Projekte durchblättern</li>
                                    <li><code className="bg-gray-700 px-2 py-1 rounded">Enter</code> Projekt öffnen</li>
                                </ul>
                            </div>
                            <div>
                                <div className="font-semibold text-blue-300">Suche & Filter</div>
                                <ul className="list-none space-y-1 text-sm">
                                    <li><code className="bg-gray-700 px-2 py-1 rounded">Ctrl+F</code> Suche öffnen</li>
                                    <li><code className="bg-gray-700 px-2 py-1 rounded">Esc</code> Filter schließen</li>
                                    <li><code className="bg-gray-700 px-2 py-1 rounded">Ctrl+R</code> Filter zurücksetzen</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Mobile Nutzung</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">📱 Smartphone & Tablet</h3>
                    <p>
                        JSDoIT Roadmap ist für mobile Geräte optimiert:
                    </p>
                    <ul className="list-disc pl-6 my-4">
                        <li><strong>Touch-Navigation</strong>: Wischen Sie horizontal für Zeitnavigation</li>
                        <li><strong>Pinch-to-Zoom</strong>: Zoomen Sie für bessere Lesbarkeit</li>
                        <li><strong>Hochformat</strong>: Drehen Sie das Gerät für eine andere Ansicht</li>
                        <li><strong>Home-Screen</strong>: Fügen Sie die Roadmap zu Ihrem Home-Screen hinzu</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Benachrichtigungen & Updates</h2>

                    <div className="bg-yellow-900/30 p-6 rounded-lg my-6">
                        <h3 className="text-lg font-semibold text-yellow-300 mb-3">🔔 Informiert bleiben</h3>
                        <p className="mb-4">So verpassen Sie keine wichtigen Updates:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Browser-Lesezeichen</strong>: Regelmäßig die Roadmap besuchen</li>
                            <li><strong>Team-Communication</strong>: Newsletter oder Team-Updates abonnieren</li>
                            <li><strong>Change-Log</strong>: Achten Sie auf Hinweise zu neuen Funktionen</li>
                        </ul>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Fehlerbehebung</h2>

                    <div className="space-y-4">
                        <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h3 className="font-bold text-blue-300 mb-2">Die Roadmap lädt nicht</h3>
                            <p>Aktualisieren Sie die Seite (F5) oder leeren Sie den Browser-Cache (Strg + Shift + R).</p>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h3 className="font-bold text-blue-300 mb-2">Filter funktionieren nicht</h3>
                            <p>Setzen Sie alle Filter zurück und versuchen Sie es erneut. Überprüfen Sie auch Ihre Internetverbindung.</p>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h3 className="font-bold text-blue-300 mb-2">Mobile Ansicht ist verzerrt</h3>
                            <p>Rotieren Sie Ihr Gerät oder zoomen Sie heraus. Die Roadmap passt sich automatisch an die Bildschirmgröße an.</p>
                        </div>
                    </div>

                    <div className="bg-green-900/30 p-6 rounded-lg my-8">
                        <h3 className="text-lg font-semibold text-green-300 mb-3">🚀 Sie sind bereit!</h3>
                        <p className="mb-4">
                            Mit diesen Anpassungen holen Sie das Beste aus JSDoIT Roadmap heraus. 
                            Probieren Sie verschiedene Einstellungen aus und finden Sie Ihren optimalen Workflow.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/docs/funktionen/roadmap" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors">
                                📊 Roadmap-Funktionen
                            </Link>
                            <Link href="/docs/funktionen/projekte" className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors">
                                📋 Projekt-Details
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </DocsLayout>
    );
};

export default KonfigurationDocsPage;
