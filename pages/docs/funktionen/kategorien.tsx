import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const KategorienDocsPage: React.FC = () => {
    return (
        <DocsLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">🏷️ Kategorien und Filter nutzen</h1>

                <div className="prose prose-invert max-w-none">
                    <p className="text-lg text-gray-300">
                        Kategorien sind Ihr Schlüssel zur effizienten Navigation in JSDoIT Roadmap. 
                        Lernen Sie, wie Sie Filter optimal einsetzen, um schnell die relevanten Projekte zu finden.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Was sind Kategorien?</h2>

                    <p>
                        Kategorien organisieren Projekte nach Themenbereichen, Abteilungen oder Projekttypen. 
                        Jede Kategorie hat ihre eigene Farbe und ihr eigenes Symbol für eine bessere visuelle Unterscheidung.
                    </p>

                    <div className="bg-blue-900/30 p-6 rounded-lg my-6">
                        <h3 className="text-lg font-semibold text-blue-300 mb-3">🎨 Visuelle Gestaltung</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Farbkodierung</strong>: Jede Kategorie hat eine eindeutige Farbe</li>
                            <li><strong>Symbole</strong>: Icons helfen bei der schnellen Erkennung</li>
                            <li><strong>Konsistenz</strong>: Gleiche Farben und Symbole in der gesamten Anwendung</li>
                        </ul>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Typische Kategorien</h2>

                    <p>
                        In JSDoIT Roadmap finden Sie üblicherweise folgende Kategorien:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                        <div className="bg-purple-900/30 p-4 rounded-lg border-l-4 border-purple-500">
                            <h3 className="font-bold text-purple-300">💻 Digital Workplace</h3>
                            <p className="text-sm">Projekte zur Digitalisierung von Arbeitsplätzen und -prozessen</p>
                        </div>
                        
                        <div className="bg-green-900/30 p-4 rounded-lg border-l-4 border-green-500">
                            <h3 className="font-bold text-green-300">🏗️ Infrastruktur</h3>
                            <p className="text-sm">IT-Infrastruktur, Server, Netzwerk und Hardware-Projekte</p>
                        </div>
                        
                        <div className="bg-red-900/30 p-4 rounded-lg border-l-4 border-red-500">
                            <h3 className="font-bold text-red-300">🔒 Sicherheit</h3>
                            <p className="text-sm">Cybersecurity, Datenschutz und Compliance-Projekte</p>
                        </div>
                        
                        <div className="bg-yellow-900/30 p-4 rounded-lg border-l-4 border-yellow-500">
                            <h3 className="font-bold text-yellow-300">⚙️ Entwicklung</h3>
                            <p className="text-sm">Software-Entwicklung und Anwendungsprojekte</p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Filter effektiv nutzen</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">🔍 Einzelne Kategorien auswählen</h3>
                    <p>
                        So filtern Sie nach einer bestimmten Kategorie:
                    </p>
                    <ol className="list-decimal pl-6 my-4">
                        <li>Klicken Sie auf das Filter-Symbol in der Sidebar</li>
                        <li>Wählen Sie die gewünschte Kategorie aus</li>
                        <li>Die Roadmap zeigt nur noch Projekte dieser Kategorie</li>
                        <li>Zum Zurücksetzen klicken Sie auf &quot;Filter löschen&quot;</li>
                    </ol>

                    <h3 className="text-xl font-bold mt-6 mb-3">🎯 Multiple Filter kombinieren</h3>
                    <p>
                        Für präzisere Ergebnisse können Sie mehrere Kategorien gleichzeitig auswählen:
                    </p>
                    <ul className="list-disc pl-6 my-4">
                        <li>Halten Sie Strg/Cmd gedrückt und klicken Sie auf mehrere Kategorien</li>
                        <li>Die Roadmap zeigt Projekte aller ausgewählten Kategorien</li>
                        <li>Besonders nützlich für verwandte Themenbereiche</li>
                    </ul>

                    <div className="bg-green-900/30 p-6 rounded-lg my-6">
                        <h3 className="text-lg font-semibold text-green-300 mb-3">💡 Filter-Strategien</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Abteilungs-Filter</strong>: Zeigen Sie nur Projekte Ihres Bereichs</li>
                            <li><strong>Themen-Filter</strong>: Fokussieren Sie sich auf spezifische Technologien</li>
                            <li><strong>Zeit-Filter</strong>: Kombinieren Sie Kategorien mit Zeiträumen</li>
                            <li><strong>Status-Filter</strong>: Sehen Sie nur aktive oder geplante Projekte</li>
                        </ul>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Praktische Anwendungsfälle</h2>

                    <div className="space-y-4 my-6">
                        <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h3 className="font-bold text-blue-300 mb-2">🎯 Szenario: IT-Sicherheit verfolgen</h3>
                            <p>Filtern Sie nach &quot;Sicherheit&quot; um alle laufenden Cybersecurity-Projekte zu überblicken und Überschneidungen zu identifizieren.</p>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h3 className="font-bold text-blue-300 mb-2">📊 Szenario: Quartalspräsentation</h3>
                            <p>Kombinieren Sie Kategorien-Filter mit Zeiträumen, um für Präsentationen relevante Projekte zusammenzustellen.</p>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h3 className="font-bold text-blue-300 mb-2">🔄 Szenario: Ressourcenplanung</h3>
                            <p>Filtern Sie nach Ihrem Fachbereich um zu sehen, welche Projekte Ihre Expertise erfordern könnten.</p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Häufige Filter-Fragen</h2>

                    <div className="space-y-4">
                        <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h3 className="font-bold text-blue-300 mb-2">Warum sehe ich keine Projekte nach dem Filtern?</h3>
                            <p>Möglicherweise gibt es keine Projekte in der gewählten Kategorie für den aktuellen Zeitraum. Prüfen Sie andere Zeitperioden oder erweitern Sie die Filter.</p>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h3 className="font-bold text-blue-300 mb-2">Wie kann ich alle Filter schnell zurücksetzen?</h3>
                            <p>Klicken Sie auf den &quot;Alle Filter zurücksetzen&quot; Button oder verwenden Sie die Tastenkombination Strg+R.</p>
                        </div>

                        <div className="bg-gray-800/50 p-4 rounded-lg">
                            <h3 className="font-bold text-blue-300 mb-2">Können Filter-Einstellungen gespeichert werden?</h3>
                            <p>Aktuelle Filter werden in der Browser-Session gespeichert. Für permanente Einstellungen setzen Sie Lesezeichen mit Ihren bevorzugten Filtern.</p>
                        </div>
                    </div>

                    <div className="bg-yellow-900/30 p-6 rounded-lg my-8">
                        <h3 className="text-lg font-semibold text-yellow-300 mb-3">🚀 Expertentipp</h3>
                        <p className="mb-4">
                            Nutzen Sie Kategorien nicht nur zum Filtern, sondern auch zum Verstehen der Organisationsstruktur. 
                            Die Farbcodierung hilft Ihnen dabei, Muster und Schwerpunkte in der Projektlandschaft zu erkennen.
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Beobachten Sie Trends: Welche Kategorien sind besonders aktiv?</li>
                            <li>Identifizieren Sie Lücken: Welche Bereiche haben wenige Projekte?</li>
                            <li>Planen Sie voraus: Welche Kategorien werden in Zukunft wichtiger?</li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                        <Link href="/docs/funktionen/roadmap" className="block p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors">
                            <div className="font-semibold text-blue-300">📊 Roadmap Navigation</div>
                            <div className="text-sm text-gray-400">Lernen Sie die Basis-Navigation der Roadmap</div>
                        </Link>
                        <Link href="/docs/funktionen/projekte" className="block p-4 bg-green-600/20 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-colors">
                            <div className="font-semibold text-green-300">📋 Projektdetails</div>
                            <div className="text-sm text-gray-400">Verstehen Sie alle Projektinformationen</div>
                        </Link>
                    </div>
                </div>
            </div>
        </DocsLayout>
    );
};

export default KategorienDocsPage;