import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const AdminDocsPage: React.FC = () => {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">👨‍💼 Administrator-Leitfaden</h1>

        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-gray-300">
            Als Administrator verwalten Sie die Inhalte von JSDoIT Roadmap und sorgen dafür, dass alle Benutzer 
            aktuelle und relevante Projektinformationen erhalten.
          </p>

          <div className="bg-yellow-900/30 p-6 rounded-lg my-6">
            <h3 className="text-lg font-semibold text-yellow-300 mb-3">⚠️ Administrator-Bereich</h3>
            <p>
              Dieser Bereich ist nur für Administratoren zugänglich. Sie benötigen entsprechende Anmeldedaten, 
              um auf diese Funktionen zuzugreifen.
            </p>
          </div>          <h2 className="text-2xl font-bold mt-8 mb-4">Zugang zum Admin-Bereich</h2>

          <div className="bg-yellow-900/30 p-6 rounded-lg my-6">
            <h3 className="text-lg font-semibold text-yellow-300 mb-3">⚠️ Administrator-Berechtigung erforderlich</h3>
            <p className="mb-4">
              Um administrative Aufgaben durchzuführen, müssen Sie vom Besitzer der Seite als Administrator hinzugefügt werden. 
              Der Admin-Zugang kann nicht selbst beantragt oder erstellt werden.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Wenden Sie sich an den Seiten-Administrator oder IT-Verantwortlichen</li>
              <li>Nach der Berechtigung erhalten Sie Zugang zum Admin-Dashboard</li>
              <li>Der Zugang wird über Ihr Benutzerkonto gewährt</li>
            </ul>
          </div>

          <p>
            Sobald Sie Administrator-Rechte haben:
          </p>

          <ol className="list-decimal pl-6 my-4">
            <li>Navigieren Sie zum Admin-Bereich über den entsprechenden Link</li>
            <li>Ihre Berechtigung wird automatisch überprüft</li>
            <li>Sie gelangen zum Admin-Dashboard mit allen Verwaltungsfunktionen</li>
          </ol>

          <h2 className="text-2xl font-bold mt-8 mb-4">Hauptaufgaben als Administrator</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div className="bg-blue-900/30 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-300 mb-3">📋 Projekt-Management</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Neue Projekte hinzufügen</li>
                <li>Bestehende Projekte bearbeiten</li>
                <li>Projektdetails aktualisieren</li>
                <li>Projekte archivieren oder löschen</li>
              </ul>
            </div>

            <div className="bg-green-900/30 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-300 mb-3">🏷️ Kategorien verwalten</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Neue Kategorien erstellen</li>
                <li>Kategorie-Namen ändern</li>
                <li>Farben und Symbole anpassen</li>
                <li>Kategorien organisieren</li>
              </ul>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4">Projekt-Verwaltung</h2>

          <h3 className="text-xl font-bold mt-6 mb-3">📝 Projekte hinzufügen</h3>
          <p>
            So erstellen Sie ein neues Projekt in der Roadmap:
          </p>
          <ol className="list-decimal pl-6 my-4">
            <li><strong>Grunddaten erfassen</strong>: Titel, Beschreibung und Ziele definieren</li>
            <li><strong>Zeitraum festlegen</strong>: Start- und Endquartale bestimmen</li>
            <li><strong>Kategorie zuweisen</strong>: Passende Kategorie für die Filterung wählen</li>
            <li><strong>Team benennen</strong>: Verantwortliche Personen und Mitwirkende hinzufügen</li>
            <li><strong>Status setzen</strong>: Aktuellen Projektstand angeben</li>
          </ol>

          <h3 className="text-xl font-bold mt-6 mb-3">✏️ Projekte bearbeiten</h3>
          <p>
            Bestehende Projekte können jederzeit angepasst werden:
          </p>
          <ul className="list-disc pl-6 my-4">
            <li><strong>Status-Updates</strong>: Projektfortschritt regelmäßig aktualisieren</li>
            <li><strong>Zeitplan-Änderungen</strong>: Start- oder Endtermine anpassen</li>
            <li><strong>Team-Updates</strong>: Neue Mitarbeiter hinzufügen oder entfernen</li>
            <li><strong>Inhaltliche Überarbeitung</strong>: Beschreibungen und Ziele aktualisieren</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Kategorie-Management</h2>

          <p>
            Kategorien helfen Benutzern dabei, relevante Projekte schnell zu finden:
          </p>

          <div className="bg-purple-900/30 p-6 rounded-lg my-6">
            <h3 className="text-lg font-semibold text-purple-300 mb-3">🎨 Kategorien gestalten</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Aussagekräftige Namen</strong>: Wählen Sie klare, verständliche Bezeichnungen</li>
              <li><strong>Farb-Kodierung</strong>: Verwenden Sie konsistente Farben für bessere Orientierung</li>
              <li><strong>Icons nutzen</strong>: Passende Symbole erleichtern die visuelle Erkennung</li>
              <li><strong>Logische Gruppierung</strong>: Organisieren Sie Kategorien nach Bereichen oder Teams</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4">Best Practices</h2>

          <h3 className="text-xl font-bold mt-6 mb-3">📊 Datenqualität sicherstellen</h3>
          <ul className="list-disc pl-6 my-4">
            <li><strong>Regelmäßige Updates</strong>: Aktualisieren Sie Projektstatus mindestens monatlich</li>
            <li><strong>Vollständige Informationen</strong>: Füllen Sie alle relevanten Felder aus</li>
            <li><strong>Konsistente Terminologie</strong>: Verwenden Sie einheitliche Begriffe und Namen</li>
            <li><strong>Zeitnahe Eingabe</strong>: Neue Projekte sollten zeitnah erfasst werden</li>
          </ul>

          <h3 className="text-xl font-bold mt-6 mb-3">👥 Benutzer-Erfahrung optimieren</h3>
          <ul className="list-disc pl-6 my-4">
            <li><strong>Verständliche Beschreibungen</strong>: Schreiben Sie für Ihr Publikum, nicht für Experten</li>
            <li><strong>Relevante Details</strong>: Fügen Sie Informationen hinzu, die für Stakeholder wichtig sind</li>
            <li><strong>Aktuelle Kontakte</strong>: Halten Sie Teammitglieder-Informationen aktuell</li>
            <li><strong>Klare Status-Updates</strong>: Nutzen Sie aussagekräftige Status-Bezeichnungen</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Häufige Administrationsaufgaben</h2>

          <div className="space-y-4">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="font-bold text-blue-300 mb-2">Quartalswechsel</h3>
              <p>Aktualisieren Sie Projektzeiträume und verschieben Sie abgeschlossene Projekte in die Archive-Kategorie.</p>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="font-bold text-blue-300 mb-2">Neue Projekte einpflegen</h3>
              <p>Sammeln Sie Projektinformationen von Teams und pflegen Sie diese zeitnah in die Roadmap ein.</p>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="font-bold text-blue-300 mb-2">Status-Updates koordinieren</h3>
              <p>Erinnern Sie Projektverantwortliche an regelmäßige Status-Updates und pflegen Sie diese ein.</p>
            </div>
          </div>

          <div className="bg-red-900/30 p-6 rounded-lg my-8">
            <h3 className="text-lg font-semibold text-red-300 mb-3">⚠️ Wichtige Hinweise</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Datensicherung</strong>: Stellen Sie sicher, dass regelmäßige Backups erstellt werden</li>
              <li><strong>Zugriffskontrolle</strong>: Teilen Sie Admin-Zugänge nur mit autorisierten Personen</li>
              <li><strong>Änderungsprotokoll</strong>: Dokumentieren Sie wichtige Änderungen für Nachverfolgbarkeit</li>
            </ul>
          </div>

          <div className="bg-green-900/30 p-6 rounded-lg my-8">
            <h3 className="text-lg font-semibold text-green-300 mb-3">🎯 Erfolgsmessung</h3>
            <p className="mb-4">
              Eine erfolgreiche Roadmap-Administration zeigt sich durch:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Regelmäßige Nutzung durch Stakeholder</li>
              <li>Aktuelle und vollständige Projektinformationen</li>
              <li>Positive Rückmeldungen von Benutzern</li>
              <li>Effiziente Kommunikation über Projektfortschritte</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <Link href="/docs/funktionen" className="block p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors">
              <div className="font-semibold text-blue-300">📚 Funktionen erkunden</div>
              <div className="text-sm text-gray-400">Lernen Sie alle Roadmap-Funktionen kennen</div>
            </Link>
            <Link href="/" className="block p-4 bg-green-600/20 border border-green-500/30 rounded-lg hover:bg-green-600/30 transition-colors">
              <div className="font-semibold text-green-300">🚀 Zur Roadmap</div>
              <div className="text-sm text-gray-400">Öffnen Sie die Hauptanwendung</div>
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
};

export default AdminDocsPage;