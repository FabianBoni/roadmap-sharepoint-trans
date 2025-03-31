import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const RoadmapDocsPage: React.FC = () => {
    return (
        <DocsLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Roadmap-Visualisierung</h1>

                <div className="prose prose-invert max-w-none">
                    <p>
                        Die Roadmap-Visualisierung ist die zentrale Funktion von Roadmap JSD. Sie bietet eine übersichtliche, zeitbasierte Darstellung aller Projekte und ermöglicht es Benutzern, den Projektzeitplan auf einen Blick zu erfassen.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Hauptmerkmale der Roadmap</h2>

                    <ul className="list-disc pl-6 my-4">
                        <li><strong>Quartalsbasierte Zeitachse</strong>: Projekte werden auf einer Zeitachse angeordnet, die in Quartale unterteilt ist</li>
                        <li><strong>Farbcodierte Projektkarten</strong>: Jedes Projekt wird als Karte dargestellt, deren Farbe der zugewiesenen Kategorie entspricht</li>
                        <li><strong>Interaktive Elemente</strong>: Klicken auf Projektkarten zeigt detaillierte Informationen an</li>
                        <li><strong>Filterung</strong>: Möglichkeit, Projekte nach Kategorien zu filtern</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Aufbau der Roadmap</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">Zeitachse</h3>

                    <p>
                        Die horizontale Achse der Roadmap repräsentiert die Zeit, unterteilt in Quartale (Q1, Q2, Q3, Q4) und Jahre. Die Zeitachse beginnt mit dem frühesten Projektquartal und erstreckt sich bis zum spätesten Projektquartal.
                    </p>

                    <h3 className="text-xl font-bold mt-6 mb-3">Projektkarten</h3>

                    <p>
                        Jedes Projekt wird als Karte dargestellt, die folgende Informationen enthält:
                    </p>

                    <ul className="list-disc pl-6 my-4">
                        <li>Projekttitel</li>
                        <li>Kategorie (durch Farbe und ggf. Symbol dargestellt)</li>
                        <li>Zeitraum (visuell durch die Breite und Position der Karte dargestellt)</li>
                        <li>Status (optional durch ein Symbol oder Farbakzent dargestellt)</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-6 mb-3">Seitenleiste</h3>

                    <p>
                        Die Seitenleiste auf der linken Seite der Roadmap enthält:
                    </p>

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