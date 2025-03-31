import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const KategorienDocsPage: React.FC = () => {
    return (
        <DocsLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Kategorien</h1>

                <div className="prose prose-invert max-w-none">
                    <p>
                        Kategorien sind ein wesentliches Organisationselement in Roadmap JSD. Sie helfen dabei, Projekte in logische Gruppen zu unterteilen und ermöglichen eine visuelle Unterscheidung auf der Roadmap.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Kategoriestruktur</h2>

                    <p>
                        Jede Kategorie besteht aus folgenden Elementen:
                    </p>

                    <ul className="list-disc pl-6 my-4">
                        <li><strong>Name</strong>: Der Bezeichner der Kategorie</li>
                        <li><strong>Farbe</strong>: Ein Farbcode, der für die visuelle Darstellung verwendet wird</li>
                        <li><strong>Symbol</strong>: Ein Icon, das die Kategorie repräsentiert</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Standardkategorien</h2>

                    <p>
                        Roadmap JSD wird mit den folgenden Standardkategorien ausgeliefert:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li><strong>Digital Workplace</strong>: Projekte im Zusammenhang mit digitalen Arbeitsplatzlösungen</li>
                        <li><strong>Infrastruktur</strong>: Projekte im Zusammenhang mit IT-Infrastruktur</li>
                        <li><strong>Sicherheit</strong>: Projekte im Zusammenhang mit IT-Sicherheit und Datenschutz</li>
                    </ol>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Verwendung von Kategorien</h2>

                    <p>
                        Kategorien werden in Roadmap JSD auf verschiedene Weise verwendet:
                    </p>

                    <h3 className="text-xl font-bold mt-6 mb-3">Projektzuordnung</h3>

                    <p>
                        Beim Erstellen oder Bearbeiten eines Projekts wird eine Kategorie zugewiesen. Diese Zuordnung bestimmt:
                    </p>

                    <ul className="list-disc pl-6 my-4">
                        <li>Die Farbe des Projekts auf der Roadmap</li>
                        <li>Die Gruppierung in Filtern und Berichten</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-6 mb-3">Filterung</h3>

                    <p>
                        In der Roadmap-Ansicht können Benutzer Projekte nach Kategorien filtern:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Verwenden Sie die Kategorie-Seitenleiste auf der linken Seite</li>
                        <li>Aktivieren oder deaktivieren Sie Kategorien, um die entsprechenden Projekte ein- oder auszublenden</li>
                    </ol>

                    <h3 className="text-xl font-bold mt-6 mb-3">Visuelle Unterscheidung</h3>

                    <p>
                        Kategorien helfen bei der visuellen Unterscheidung von Projekten auf der Roadmap:
                    </p>

                    <ul className="list-disc pl-6 my-4">
                        <li>Jede Kategorie hat eine eindeutige Farbe</li>
                        <li>Projekte werden in der Farbe ihrer Kategorie dargestellt</li>
                        <li>Symbole der Kategorien werden in der Legende und auf Projektkarten angezeigt</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Kategorien verwalten</h2>

                    <p>
                        Administratoren können Kategorien über das Admin-Dashboard verwalten:
                    </p>

                    <h3 className="text-xl font-bold mt-6 mb-3">Neue Kategorie erstellen</h3>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Navigieren Sie zum Admin-Dashboard</li>
                        <li>Wechseln Sie zur Registerkarte "Kategorien"</li>
                        <li>Klicken Sie auf "Neue Kategorie"</li>
                        <li>Geben Sie einen Namen ein, wählen Sie eine Farbe und ein Symbol</li>
                        <li>Klicken Sie auf "Kategorie erstellen"</li>
                    </ol>

                    <h3 className="text-xl font-bold mt-6 mb-3">Kategorie bearbeiten</h3>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Suchen Sie die Kategorie in der Tabelle</li>
                        <li>Klicken Sie auf "Bearbeiten"</li>
                        <li>Aktualisieren Sie die Informationen</li>
                        <li>Klicken Sie auf "Kategorie aktualisieren"</li>
                    </ol>

                    <h3 className="text-xl font-bold mt-6 mb-3">Kategorie löschen</h3>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Suchen Sie die Kategorie in der Tabelle</li>
                        <li>Klicken Sie auf "Löschen"</li>
                        <li>Bestätigen Sie die Löschung</li>
                    </ol>

                    <p className="mt-4">
                        <strong>Hinweis</strong>: Das Löschen einer Kategorie wirkt sich auf alle zugehörigen Projekte aus. Diese Projekte verlieren ihre Kategoriezuordnung.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Verwandte Themen</h2>

                    <ul className="list-disc pl-6 my-4">
                        <li>
                            <Link href="/docs/funktionen/projekte" className="text-blue-400 hover:text-blue-300">
                                Projekte
                            </Link>
                        </li>
                        <li>
                            <Link href="/docs/funktionen/roadmap" className="text-blue-400 hover:text-blue-300">
                                Roadmap-Visualisierung
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

export default KategorienDocsPage;