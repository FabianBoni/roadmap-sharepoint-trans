import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const AdminDocsPage: React.FC = () => {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Admin-Anleitung</h1>
        
        <div className="prose prose-invert max-w-none">
          <p>
            Diese Anleitung bietet einen umfassenden Überblick über die Administrationsfunktionen von Roadmap JSD. Als Administrator haben Sie Zugriff auf erweiterte Funktionen zur Verwaltung von Projekten, Kategorien und Feldtypen.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Zugriff auf das Admin-Dashboard</h2>
          
          <p>
            Um auf das Admin-Dashboard zuzugreifen:
          </p>
          
          <ol className="list-decimal pl-6 my-4">
            <li>Navigieren Sie zu <code>/admin</code> in Ihrem Browser</li>
            <li>Melden Sie sich mit Ihren Admin-Anmeldedaten an:
              <ul className="list-disc pl-6 my-2">
                <li>E-Mail: admin@jsd.bs.ch</li>
                <li>Passwort: admin123</li>
              </ul>
            </li>
          </ol>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Überblick über das Admin-Dashboard</h2>
          
          <p>
            Das Admin-Dashboard ist in drei Hauptbereiche unterteilt:
          </p>
          
          <ol className="list-decimal pl-6 my-4">
            <li><strong>Projekte</strong>: Verwaltung aller Projekte im System</li>
            <li><strong>Kategorien</strong>: Verwaltung der Projektkategorien</li>
            <li><strong>Feldtypen</strong>: Verwaltung der benutzerdefinierten Feldtypen</li>
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
        </div>
      </div>
    </DocsLayout>
  );
};

export default AdminDocsPage;
