import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const AdminDashboardDocsPage: React.FC = () => {
    return (
        <DocsLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Admin-Dashboard-Anleitung</h1>

                <div className="prose prose-invert max-w-none">
                    <p>
                        Das Admin-Dashboard ist die zentrale Anlaufstelle für die Verwaltung aller Aspekte der Roadmap JSD-Anwendung. Diese Anleitung führt Sie durch die verschiedenen Funktionen und Möglichkeiten, die im Dashboard verfügbar sind.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Zugriff auf das Admin-Dashboard</h2>

                    <p>
                        Um auf das Admin-Dashboard zuzugreifen, navigieren Sie zu <code>/admin</code> in Ihrem Browser. Sie müssen sich mit Admin-Anmeldedaten anmelden:
                    </p>

                    <ul className="list-disc pl-6 my-4">
                        <li>E-Mail: admin@jsd.bs.ch</li>
                        <li>Passwort: admin123</li>
                    </ul>

                    <div className="bg-gray-800 p-4 rounded-md my-4">
                        <p className="font-bold">Sicherheitshinweis</p>
                        <p className="mt-2">Ändern Sie das Standard-Admin-Passwort nach der ersten Anmeldung, um die Sicherheit Ihrer Anwendung zu gewährleisten.</p>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Dashboard-Übersicht</h2>

                    <p>
                        Das Admin-Dashboard ist in drei Hauptbereiche unterteilt:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li><strong>Projekte</strong>: Verwalten Sie alle Projekte im System</li>
                        <li><strong>Kategorien</strong>: Verwalten Sie Projektkategorien</li>
                        <li><strong>Feldtypen</strong>: Verwalten Sie benutzerdefinierte Feldtypen</li>
                    </ol>

                    <p>
                        Sie können zwischen diesen Bereichen über die Registerkarten am oberen Rand des Dashboards wechseln.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Projekte verwalten</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">Projekte anzeigen</h3>

                    <p>
                        Die Registerkarte "Projekte" zeigt eine Tabelle aller Projekte im System, einschließlich:
                    </p>

                    <ul className="list-disc pl-6 my-4">
                        <li>Titel</li>
                        <li>Kategorie</li>
                        <li>Zeitplan (Start- und Endquartal)</li>
                        <li>Status</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-6 mb-3">Ein neues Projekt erstellen</h3>

                    <p>
                        Um ein neues Projekt zu erstellen:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Klicken Sie auf die Schaltfläche "Neues Projekt" in der oberen rechten Ecke</li>
                        <li>Füllen Sie das Projektformular mit den erforderlichen Informationen aus:
                            <ul className="list-disc pl-6 my-2">
                                <li>Titel</li>
                                <li>Kategorie</li>
                                <li>Start- und Endquartal</li>
                                <li>Beschreibung</li>
                                <li>Status</li>
                                <li>Teammitglieder</li>
                                <li>Benutzerdefinierte Felder</li>
                            </ul>
                        </li>
                        <li>Klicken Sie auf "Projekt erstellen", um zu speichern</li>
                    </ol>

                    <h3 className="text-xl font-bold mt-6 mb-3">Ein Projekt bearbeiten</h3>

                    <p>
                        Um ein bestehendes Projekt zu bearbeiten:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Suchen Sie das Projekt in der Tabelle</li>
                        <li>Klicken Sie auf die Schaltfläche "Bearbeiten" in der Spalte "Aktionen"</li>
                        <li>Aktualisieren Sie die Projektinformationen im Formular</li>
                        <li>Klicken Sie auf "Projekt aktualisieren", um Änderungen zu speichern</li>
                    </ol>

                    <h3 className="text-xl font-bold mt-6 mb-3">Ein Projekt löschen</h3>

                    <p>
                        Um ein Projekt zu löschen:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Suchen Sie das Projekt in der Tabelle</li>
                        <li>Klicken Sie auf die Schaltfläche "Löschen" in der Spalte "Aktionen"</li>
                        <li>Bestätigen Sie die Löschung, indem Sie auf "Bestätigen" klicken, wenn Sie dazu aufgefordert werden</li>
                    </ol>

                    <div className="bg-gray-800 p-4 rounded-md my-4">
                        <p className="font-bold">Hinweis</p>
                        <p className="mt-2">Das Löschen eines Projekts ist endgültig und kann nicht rückgängig gemacht werden. Stellen Sie sicher, dass Sie das richtige Projekt löschen.</p>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Kategorien verwalten</h2>

                    <p>
                        Kategorien helfen dabei, Projekte in logische Gruppen zu organisieren. Jede Kategorie hat einen Namen, eine Farbe und ein Symbol.
                    </p>

                    <h3 className="text-xl font-bold mt-6 mb-3">Eine neue Kategorie erstellen</h3>

                    <p>
                        Um eine neue Kategorie zu erstellen:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Wechseln Sie zur Registerkarte "Kategorien"</li>
                        <li>Klicken Sie auf die Schaltfläche "Neue Kategorie"</li>
                        <li>Füllen Sie das Kategorieformular aus:
                            <ul className="list-disc pl-6 my-2">
                                <li>Name</li>
                                <li>Farbe (wählen Sie eine aus oder geben Sie einen Hex-Code ein)</li>
                                <li>Symbol (wählen Sie aus den verfügbaren Optionen)</li>
                            </ul>
                        </li>
                        <li>Klicken Sie auf "Kategorie erstellen", um zu speichern</li>
                    </ol>

                    <h3 className="text-xl font-bold mt-6 mb-3">Eine Kategorie bearbeiten</h3>

                    <p>
                        Um eine bestehende Kategorie zu bearbeiten:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Suchen Sie die Kategorie in der Tabelle</li>
                        <li>Klicken Sie auf die Schaltfläche "Bearbeiten"</li>
                        <li>Aktualisieren Sie die Kategorieinformationen</li>
                        <li>Klicken Sie auf "Kategorie aktualisieren", um Änderungen zu speichern</li>
                    </ol>

                    <h3 className="text-xl font-bold mt-6 mb-3">Eine Kategorie löschen</h3>

                    <p>
                        Um eine Kategorie zu löschen:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Suchen Sie die Kategorie in der Tabelle</li>
                        <li>Klicken Sie auf die Schaltfläche "Löschen"</li>
                        <li>Bestätigen Sie die Löschung</li>
                    </ol>

                    <div className="bg-gray-800 p-4 rounded-md my-4">
                        <p className="font-bold">Hinweis</p>
                        <p className="mt-2">Das Löschen einer Kategorie löscht nicht die zugehörigen Projekte, aber diese Projekte haben dann keine gültige Kategorie mehr zugewiesen.</p>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Feldtypen verwalten</h2>

                    <p>
                        Mit Feldtypen können Sie benutzerdefinierte Felder für Projekte definieren, wie Technologien, Prozesse, Dienste oder Datentypen.
                    </p>

                    <h3 className="text-xl font-bold mt-6 mb-3">Einen neuen Feldtyp erstellen</h3>

                    <p>
                        Um einen neuen Feldtyp zu erstellen:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Wechseln Sie zur Registerkarte "Feldtypen"</li>
                        <li>Klicken Sie auf die Schaltfläche "Neues Feld"</li>
                        <li>Füllen Sie das Feldtyp-Formular aus:
                            <ul className="list-disc pl-6 my-2">
                                <li>Name</li>
                                <li>Typ (PROCESS, TECHNOLOGY, SERVICE oder DATA)</li>
                                <li>Beschreibung</li>
                            </ul>
                        </li>
                        <li>Klicken Sie auf "Feldtyp erstellen", um zu speichern</li>
                    </ol>

                    <h3 className="text-xl font-bold mt-6 mb-3">Einen Feldtyp bearbeiten</h3>

                    <p>
                        Um einen bestehenden Feldtyp zu bearbeiten:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Suchen Sie den Feldtyp in der Tabelle</li>
                        <li>Klicken Sie auf die Schaltfläche "Bearbeiten"</li>
                        <li>Aktualisieren Sie die Feldtypinformationen</li>
                        <li>Klicken Sie auf "Feldtyp aktualisieren", um Änderungen zu speichern</li>
                    </ol>

                    <h3 className="text-xl font-bold mt-6 mb-3">Einen Feldtyp löschen</h3>

                    <p>
                        Um einen Feldtyp zu löschen:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Suchen Sie den Feldtyp in der Tabelle</li>
                        <li>Klicken Sie auf die Schaltfläche "Löschen"</li>
                        <li>Bestätigen Sie die Löschung</li>
                    </ol>

                    <div className="bg-gray-800 p-4 rounded-md my-4">
                        <p className="font-bold">Hinweis</p>
                        <p className="mt-2">Das Löschen eines Feldtyps wirkt sich auf alle Projekte aus, die diesen Feldtyp verwenden. Die entsprechenden Daten gehen verloren.</p>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Tipps für die effektive Nutzung des Admin-Dashboards</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">Organisation von Projekten</h3>

                    <ul className="list-disc pl-6 my-4">
                        <li>Verwenden Sie aussagekräftige Projekttitel, die den Zweck des Projekts klar kommunizieren</li>
                        <li>Weisen Sie Projekte konsistent Kategorien zu, um eine klare visuelle Unterscheidung auf der Roadmap zu ermöglichen</li>
                        <li>Setzen Sie realistische Start- und Endquartale für Projekte</li>
                        <li>Halten Sie Projektbeschreibungen kurz und prägnant, aber informativ</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-6 mb-3">Kategoriemanagement</h3>

                    <ul className="list-disc pl-6 my-4">
                        <li>Halten Sie die Anzahl der Kategorien überschaubar (idealerweise nicht mehr als 5-7)</li>
                        <li>Verwenden Sie kontrastierende Farben für verschiedene Kategorien, um sie leicht unterscheidbar zu machen</li>
                        <li>Wählen Sie Symbole, die den Zweck der Kategorie visuell darstellen</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-6 mb-3">Feldtypenmanagement</h3>

                    <ul className="list-disc pl-6 my-4">
                        <li>Erstellen Sie Feldtypen, die für Ihre Organisation relevant sind</li>
                        <li>Verwenden Sie klare, beschreibende Namen für Feldtypen</li>
                        <li>Fügen Sie aussagekräftige Beschreibungen hinzu, um Benutzern zu helfen, den Zweck des Feldtyps zu verstehen</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Fehlerbehebung</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">Häufige Probleme und Lösungen</h3>

                    <div className="bg-gray-800 p-4 rounded-md my-4">
                        <p className="font-bold">Problem: Kann mich nicht am Admin-Dashboard anmelden</p>
                        <p className="mt-2">Lösungen:</p>
                        <ul className="list-disc pl-6 mt-2">
                            <li>Überprüfen Sie, ob Sie die richtigen Anmeldedaten verwenden</li>
                            <li>Stellen Sie sicher, dass Ihre Datenbank läuft und zugänglich ist</li>
                            <li>Löschen Sie Browser-Cookies und versuchen Sie es erneut</li>
                            <li>Überprüfen Sie die Serverlogs auf Fehler</li>
                        </ul>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-md my-4">
                        <p className="font-bold">Problem: Änderungen werden nicht gespeichert</p>
                        <p className="mt-2">Lösungen:</p>
                        <ul className="list-disc pl-6 mt-2">
                            <li>Stellen Sie sicher, dass alle erforderlichen Felder ausgefüllt sind</li>
                            <li>Überprüfen Sie die Datenbankverbindung</li>
                            <li>Überprüfen Sie die Browserkonsole auf JavaScript-Fehler</li>
                            <li>Aktualisieren Sie die Seite und versuchen Sie es erneut</li>
                        </ul>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-md my-4">
                        <p className="font-bold">Problem: Formular zeigt Validierungsfehler</p>
                        <p className="mt-2">Lösungen:</p>
                        <ul className="list-disc pl-6 mt-2">
                            <li>Stellen Sie sicher, dass alle Felder im richtigen Format ausgefüllt sind</li>
                            <li>Überprüfen Sie, ob Start- und Endquartale in chronologischer Reihenfolge sind</li>
                            <li>Stellen Sie sicher, dass Farben im Hex-Format eingegeben werden (z.B. #4299E1)</li>
                        </ul>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Bewährte Praktiken für Administratoren</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">Sicherheit</h3>

                    <ul className="list-disc pl-6 my-4">
                        <li>Ändern Sie das Standard-Admin-Passwort nach der ersten Anmeldung</li>
                        <li>Melden Sie sich vom Admin-Dashboard ab, wenn Sie es nicht verwenden</li>
                        <li>Teilen Sie Admin-Anmeldedaten nicht mit unbefugten Personen</li>
                        <li>Überprüfen Sie regelmäßig die Zugriffsrechte</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-6 mb-3">Datenmanagement</h3>

                    <ul className="list-disc pl-6 my-4">
                        <li>Erstellen Sie regelmäßige Backups der Datenbank</li>
                        <li>Überprüfen Sie regelmäßig die Datenintegrität</li>
                        <li>Löschen Sie veraltete oder nicht mehr benötigte Projekte</li>
                        <li>Halten Sie Kategorien und Feldtypen aktuell</li>
                    </ul>

                    <h3 className="text-xl font-bold mt-6 mb-3">Benutzererfahrung</h3>

                    <ul className="list-disc pl-6 my-4">
                        <li>Stellen Sie sicher, dass die Roadmap übersichtlich bleibt und nicht überladen wird</li>
                        <li>Verwenden Sie konsistente Benennungskonventionen für Projekte, Kategorien und Feldtypen</li>
                        <li>Sammeln Sie Feedback von Benutzern zur Verbesserung der Anwendung</li>
                        <li>Dokumentieren Sie Änderungen an der Systemkonfiguration</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Systemwartung</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">Datenbank-Backup</h3>

                    <p>
                        Es wird empfohlen, regelmäßige Backups der Datenbank durchzuführen:
                    </p>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>{`# Für PostgreSQL
pg_dump -U benutzername -d roadmap_jsd > backup_$(date +%Y%m%d).sql

# Für MySQL
mysqldump -u benutzername -p roadmap_jsd > backup_$(date +%Y%m%d).sql`}</code>
                    </pre>

                    <h3 className="text-xl font-bold mt-6 mb-3">Anwendungsaktualisierung</h3>

                    <p>
                        Um die Anwendung auf die neueste Version zu aktualisieren:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Sichern Sie Ihre Datenbank</li>
                        <li>Ziehen Sie die neuesten Änderungen aus dem Repository:
                            <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto mt-2">
                                <code>git pull origin main</code>
                            </pre>
                        </li>
                        <li>Installieren Sie neue Abhängigkeiten:
                            <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto mt-2">
                                <code>{`npm install
# oder
yarn install`}</code>
                            </pre>
                        </li>
                        <li>Führen Sie Datenbankmigrationen aus:
                            <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto mt-2">
                                <code>npx prisma migrate deploy</code>
                            </pre>
                        </li>
                        <li>Erstellen Sie einen neuen Build und starten Sie die Anwendung neu:
                            <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto mt-2">
                                <code>{`npm run build && npm start
# oder
yarn build && yarn start`}</code>
                            </pre>
                        </li>
                    </ol>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Häufig gestellte Fragen</h2>

                    <div className="space-y-4 mt-4">
                        <div>
                            <h3 className="text-lg font-bold">Wie kann ich das Admin-Passwort zurücksetzen?</h3>
                            <p>
                                Derzeit muss das Admin-Passwort direkt in der Datenbank zurückgesetzt werden. In einer zukünftigen Version wird eine Funktion zum Zurücksetzen des Passworts über die Benutzeroberfläche hinzugefügt.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold">Kann ich mehrere Admin-Benutzer erstellen?</h3>
                            <p>
                                In der aktuellen Version gibt es nur einen Admin-Benutzer. Die Unterstützung für mehrere Admin-Benutzer ist für zukünftige Versionen geplant.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold">Wie kann ich die Roadmap-Ansicht anpassen?</h3>
                            <p>
                                Die Roadmap-Ansicht wird automatisch basierend auf den erstellten Projekten und Kategorien generiert. Sie können die Darstellung anpassen, indem Sie Kategorien bearbeiten und deren Farben ändern.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold">Gibt es eine Möglichkeit, Projekte zu archivieren statt zu löschen?</h3>
                            <p>
                                In der aktuellen Version können Projekte nur gelöscht, nicht archiviert werden. Die Archivierungsfunktion ist für zukünftige Versionen geplant.
                            </p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Verwandte Dokumentation</h2>

                    <ul className="list-disc pl-6 my-4">
                        <li>
                            <Link href="/docs/api" className="text-blue-400 hover:text-blue-300">
                                API-Referenz
                            </Link> - Für Entwickler, die programmatisch mit dem System interagieren möchten
                        </li>
                        <li>
                            <Link href="/docs/funktionen" className="text-blue-400 hover:text-blue-300">
                                Funktionen
                            </Link> - Detaillierte Beschreibungen der Hauptfunktionen
                        </li>
                        <li>
                            <Link href="/docs/erste-schritte/installation" className="text-blue-400 hover:text-blue-300">
                                Installation
                            </Link> - Anleitung zur Installation und Einrichtung des Systems
                        </li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Unterstützung und Hilfe</h2>

                    <p>
                        Wenn Sie weitere Unterstützung benötigen oder Fragen zur Administration von Roadmap JSD haben, wenden Sie sich an:
                    </p>

                    <ul className="list-disc pl-6 my-4">
                        <li><strong>E-Mail</strong>: support@jsd.bs.ch</li>
                        <li><strong>Dokumentation</strong>: Überprüfen Sie die neueste Version dieser Dokumentation</li>
                        <li><strong>GitHub</strong>: Besuchen Sie das <a href="https://github.com/FabianBoni/roadmap-jsd" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">GitHub-Repository</a> für Issues und Updates</li>
                    </ul>
                </div>
            </div>
        </DocsLayout>
    );
};

export default AdminDashboardDocsPage;