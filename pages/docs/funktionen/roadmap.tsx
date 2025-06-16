import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const RoadmapDocsPage: React.FC = () => {
    return (
        <DocsLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">🗺️ So verwenden Sie die Roadmap</h1>

                <div className="prose prose-invert max-w-none">
                    <p>
                        Die Roadmap ist Ihre zentrale Anlaufstelle, um alle IT-Projekte des JSD auf einen Blick zu sehen. Hier erfahren Sie, wie Sie sie optimal nutzen.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Überblick verschaffen</h2>

                    <p>
                        Wenn Sie die Roadmap öffnen, sehen Sie alle Projekte zeitlich angeordnet von links nach rechts:
                    </p>

                    <ul className="list-disc pl-6 my-4">
                        <li><strong>Zeitachse</strong>: Die obere Leiste zeigt Quartale und Jahre (Q1 2024, Q2 2024, etc.)</li>
                        <li><strong>Projektkarten</strong>: Jedes Projekt erscheint als farbige Karte im entsprechenden Zeitraum</li>
                        <li><strong>Farben</strong>: Verschiedene Farben zeigen verschiedene Projektbereiche (z.B. Digital Workplace, Infrastruktur)</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Projekte finden</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">📍 Nach Bereichen filtern</h3>

                    <p>
                        Auf der linken Seite finden Sie die Bereichsfilter:
                    </p>

                    <ul className="list-disc pl-6 my-4">
                        <li>Klicken Sie auf einen Bereich (z.B. &quot;Digital Workplace&quot;), um nur diese Projekte anzuzeigen</li>
                        <li>Mehrere Bereiche können gleichzeitig ausgewählt werden</li>
                        <li>Klicken Sie erneut auf einen Bereich, um den Filter zu entfernen</li>
                        <li>Die Anzahl der Projekte wird neben jedem Bereich angezeigt</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-6 mb-3">🔍 Projektdetails anzeigen</h3>

                    <p>
                        So erhalten Sie mehr Informationen zu einem Projekt:
                    </p>

                    <ul className="list-disc pl-6 my-4">
                        <li><strong>Klicken Sie auf eine Projektkarte</strong> - eine Detailseite öffnet sich</li>
                        <li><strong>Projekttitel</strong> - zeigt den Namen des Projekts</li>
                        <li><strong>Zeitraum</strong> - die Breite der Karte zeigt die Projektdauer</li>
                        <li><strong>Status-Symbol</strong> - zeigt ob das Projekt läuft, geplant oder abgeschlossen ist</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Navigation</h2>

                    <ul className="list-disc pl-6 my-4">
                        <li>Kategoriefilter mit Checkboxen zum Ein- und Ausblenden von Projekten</li>
                        <li>Legende, die die Farbcodierung der Kategorien erklärt</li>
                        <li>Zusätzliche Filteroptionen (falls implementiert)</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Interaktion mit der Roadmap</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">Projekte filtern</h3>

                    <p>
                        Um Projekte nach Kategorien zu filtern:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Verwenden Sie die Checkboxen in der Seitenleiste</li>
                        <li>Aktivieren oder deaktivieren Sie Kategorien, um die entsprechenden Projekte ein- oder auszublenden</li>
                        <li>Die Roadmap wird automatisch aktualisiert, um nur die ausgewählten Kategorien anzuzeigen</li>
                    </ol>

                    <h3 className="text-xl font-bold mt-6 mb-3">Projektdetails anzeigen</h3>

                    <p>
                        Um detaillierte Informationen zu einem Projekt anzuzeigen:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Klicken Sie auf eine Projektkarte auf der Roadmap</li>
                        <li>Ein Detailbereich wird geöffnet, der alle Projektinformationen anzeigt</li>
                        <li>Klicken Sie außerhalb des Detailbereichs oder auf die Schließen-Schaltfläche, um ihn zu schließen</li>
                    </ol>

                    <h3 className="text-xl font-bold mt-6 mb-3">Navigation auf der Zeitachse</h3>

                    <p>
                        Um auf der Zeitachse zu navigieren:
                    </p>

                    <ul className="list-disc pl-6 my-4">
                        <li>Scrollen Sie horizontal, um weitere Quartale anzuzeigen</li>
                        <li>Verwenden Sie die Zoom-Steuerelemente (falls implementiert), um den Zeitraum zu vergrößern oder zu verkleinern</li>
                        <li>Klicken Sie auf Quartalsbeschriftungen, um direkt zu diesem Zeitraum zu springen</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Anpassung der Roadmap-Ansicht</h2>

                    <p>
                        Die Roadmap-Ansicht kann auf verschiedene Weise angepasst werden:
                    </p>

                    <h3 className="text-xl font-bold mt-6 mb-3">Zeitraum anpassen</h3>

                    <p>
                        Standardmäßig zeigt die Roadmap alle Quartale an, in denen Projekte geplant sind. Administratoren können den angezeigten Zeitraum in den Einstellungen anpassen.
                    </p>

                    <h3 className="text-xl font-bold mt-6 mb-3">Kategoriefarben</h3>

                    <p>
                        Die Farben der Kategorien können im Admin-Dashboard angepasst werden. Diese Änderungen wirken sich direkt auf die Farbcodierung der Projektkarten in der Roadmap aus.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Beispiel für die Roadmap-Visualisierung</h2>

                    <p>
                        Eine typische Roadmap-Ansicht könnte wie folgt aussehen:
                    </p>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`
+------+------+------+------+------+------+------+------+
| 2023 Q1     | 2023 Q2     | 2023 Q3     | 2023 Q4     |
+------+------+------+------+------+------+------+------+
|                                                       |
| [Projekt A - Digital Workplace]                       |
|                                                       |
+------+------+------+------+------+------+------+------+
|                                   |                   |
|                                   | [Projekt C - Sich]|
|                                   |                   |
+------+------+------+------+------+------+------+------+
|               |                                       |
|               | [Projekt B - Infrastruktur]           |
|               |                                       |
+------+------+------+------+------+------+------+------+
            `}</code>
                    </pre>

                    <p className="mt-4">
                        In diesem Beispiel:
                    </p>

                    <ul className="list-disc pl-6 my-4">
                        <li>Projekt A (Digital Workplace) erstreckt sich über alle vier Quartale von 2023</li>
                        <li>Projekt B (Infrastruktur) beginnt in Q2 2023 und endet in Q4 2023</li>
                        <li>Projekt C (Sicherheit) läuft in Q3 und Q4 2023</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Tipps für die effektive Nutzung der Roadmap</h2>

                    <ul className="list-disc pl-6 my-4">
                        <li><strong>Kategorien sinnvoll nutzen</strong>: Verwenden Sie Kategorien konsistent, um eine klare visuelle Unterscheidung zu ermöglichen</li>
                        <li><strong>Zeiträume realistisch planen</strong>: Setzen Sie realistische Start- und Endquartale für Projekte, um eine aussagekräftige Roadmap zu erstellen</li>
                        <li><strong>Filterung verwenden</strong>: Nutzen Sie die Filterfunktion, um sich auf relevante Projekte zu konzentrieren</li>
                        <li><strong>Detailansicht erkunden</strong>: Klicken Sie auf Projekte, um alle Informationen zu sehen, nicht nur die auf der Karte sichtbaren</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Verwandte Themen</h2>

                    <ul className="list-disc pl-6 my-4">
                        <li>
                            <Link href="/docs/funktionen/projekte" className="text-blue-400 hover:text-blue-300">
                                Projekte
                            </Link>
                        </li>
                        <li>
                            <Link href="/docs/funktionen/kategorien" className="text-blue-400 hover:text-blue-300">
                                Kategorien
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

export default RoadmapDocsPage;