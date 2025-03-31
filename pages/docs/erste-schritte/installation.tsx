import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const InstallationDocsPage: React.FC = () => {
    return (
        <DocsLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8">Installationsanleitung</h1>

                <div className="prose prose-invert max-w-none">
                    <p>
                        Diese Anleitung führt Sie durch den Prozess der Einrichtung von Roadmap JSD in Ihrer lokalen Umgebung.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Voraussetzungen</h2>

                    <p>
                        Bevor Sie beginnen, stellen Sie sicher, dass Sie Folgendes installiert haben:
                    </p>

                    <ul className="list-disc pl-6 my-4">
                        <li>Node.js (v14 oder höher)</li>
                        <li>npm oder yarn</li>
                        <li>Git</li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Schritt 1: Repository klonen</h2>

                    <p>
                        Klonen Sie das Repository mit folgendem Befehl:
                    </p>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>git clone https://github.com/FabianBoni/roadmap-jsd.git
                            cd roadmap-jsd</code>
                    </pre>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Schritt 2: Abhängigkeiten installieren</h2>

                    <p>
                        Installieren Sie die erforderlichen Abhängigkeiten:
                    </p>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>npm install
                            # oder
                            yarn install</code>
                    </pre>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Schritt 3: Datenbank einrichten</h2>

                    <p>
                        Roadmap JSD verwendet Prisma mit einer Datenbank. Sie müssen Ihre Datenbankverbindung einrichten:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Erstellen Sie eine <code>.env</code>-Datei im Stammverzeichnis</li>
                        <li>Fügen Sie Ihren Datenbankverbindungsstring hinzu:
                            <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto mt-2">
                                <code>DATABASE_URL=&quot;postgresql://benutzername:passwort@localhost:5432/roadmap_jsd&quot;</code>
                            </pre>
                        </li>
                        <li>Führen Sie Prisma-Migrationen aus:
                            <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto mt-2">
                                <code>npx prisma migrate dev</code>
                            </pre>
                        </li>
                    </ol>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Schritt 4: Entwicklungsserver starten</h2>

                    <p>
                        Starten Sie den Entwicklungsserver:
                    </p>

                    <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto">
                        <code>npm run dev
                            # oder
                            yarn dev</code>
                    </pre>

                    <p className="mt-4">
                        Ihre Anwendung sollte jetzt unter <a href="http://localhost:3000" className="text-blue-400 hover:text-blue-300">http://localhost:3000</a> laufen.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Schritt 5: Admin-Zugang</h2>

                    <p>
                        Um auf das Admin-Dashboard zuzugreifen:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Navigieren Sie zu <a href="http://localhost:3000/admin" className="text-blue-400 hover:text-blue-300">http://localhost:3000/admin</a></li>
                        <li>Melden Sie sich mit den Standard-Admin-Anmeldedaten an:
                            <ul className="list-disc pl-6 my-2">
                                <li>E-Mail: admin@jsd.bs.ch</li>
                                <li>Passwort: admin123</li>
                            </ul>
                        </li>
                    </ol>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Nächste Schritte</h2>

                    <p>
                        Nach der Installation können Sie:
                    </p>

                    <ul className="list-disc pl-6 my-4">
                        <li>
                            <Link href="/docs/erste-schritte" className="text-blue-400 hover:text-blue-300">
                                Weitere erste Schritte
                            </Link> durchgehen
                        </li>
                        <li>Die
                            <Link href="/docs/funktionen" className="text-blue-400 hover:text-blue-300">
                                Funktionen
                            </Link> von Roadmap JSD erkunden
                        </li>
                        <li>Die
                            <Link href="/docs/admin" className="text-blue-400 hover:text-blue-300">
                                Admin-Anleitung
                            </Link> für Administratoren lesen
                        </li>
                    </ul>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Fehlerbehebung</h2>

                    <h3 className="text-xl font-bold mt-6 mb-3">Datenbankverbindungsprobleme</h3>

                    <p>
                        Wenn Sie Probleme mit der Datenbankverbindung haben:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Überprüfen Sie, ob Ihre Datenbank läuft</li>
                        <li>Stellen Sie sicher, dass die <code>DATABASE_URL</code> in der <code>.env</code>-Datei korrekt ist</li>
                        <li>Führen Sie <code>npx prisma db push</code> aus, um die Datenbankschema zu aktualisieren</li>
                    </ol>

                    <h3 className="text-xl font-bold mt-6 mb-3">Anwendungsfehler</h3>

                    <p>
                        Bei Anwendungsfehlern:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Überprüfen Sie die Konsolenausgabe auf Fehlermeldungen</li>
                        <li>Überprüfen Sie die Browserkonsole auf Frontend-Fehler</li>
                        <li>Stellen Sie sicher, dass alle Abhängigkeiten installiert sind (<code>npm install</code>)</li>
                    </ol>

                    <h3 className="text-xl font-bold mt-6 mb-3">Häufige Fehler</h3>

                    <div className="bg-gray-800 p-4 rounded-md my-4">
                        <p className="font-bold">Fehler: &quot;Prisma Client konnte nicht mit der Datenbank verbinden&quot;</p>
                        <p className="mt-2">Lösung: Überprüfen Sie Ihre Datenbankverbindung und stellen Sie sicher, dass die Datenbank läuft.</p>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-md my-4">
                        <p className="font-bold">Fehler: &quot;Module not found&quot;</p>
                        <p className="mt-2">Lösung: Führen Sie <code>npm install</code> aus, um sicherzustellen, dass alle Abhängigkeiten installiert sind.</p>
                    </div>

                    <h2 className="text-2xl font-bold mt-8 mb-4">Produktionsbereitstellung</h2>

                    <p>
                        Für die Bereitstellung in einer Produktionsumgebung:
                    </p>

                    <ol className="list-decimal pl-6 my-4">
                        <li>Erstellen Sie einen optimierten Build:
                            <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto mt-2">
                                <code>npm run build
                                    # oder
                                    yarn build</code>
                            </pre>
                        </li>
                        <li>Starten Sie den Produktionsserver:
                            <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto mt-2">
                                <code>npm start
                                    # oder
                                    yarn start</code>
                            </pre>
                        </li>
                    </ol>

                    <p className="mt-4">
                        Für detailliertere Informationen zur Bereitstellung besuchen Sie die <a href="https://nextjs.org/docs/deployment" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">Next.js-Bereitstellungsdokumentation</a>.
                    </p>
                </div>
            </div>
        </DocsLayout>
    );
};

export default InstallationDocsPage;