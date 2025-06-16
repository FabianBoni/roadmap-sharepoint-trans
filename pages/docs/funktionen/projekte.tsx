import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const ProjekteDocsPage: React.FC = () => {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">📋 Projekte verstehen und nutzen</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-gray-300">
            Projekte sind das Herzstück von JSDoIT Roadmap. Hier erfahren Sie, wie Sie alle verfügbaren 
            Informationen optimal nutzen und interpretieren können.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Was macht ein Projekt aus?</h2>
          
          <p>
            Jedes Projekt in der Roadmap enthält wichtige Informationen, die Ihnen helfen, den Überblick zu behalten:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div className="bg-blue-900/30 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-300 mb-3">📊 Grunddaten</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Projekttitel</strong>: Der offizielle Name</li>
                <li><strong>Beschreibung</strong>: Ziele und Inhalte</li>
                <li><strong>Kategorie</strong>: Themenbereich oder Abteilung</li>
                <li><strong>Zeitraum</strong>: Start und Ende</li>
              </ul>
            </div>

            <div className="bg-green-900/30 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-300 mb-3">👥 Team & Status</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Projektleitung</strong>: Hauptverantwortliche</li>
                <li><strong>Teammitglieder</strong>: Beteiligte Personen</li>
                <li><strong>Aktueller Status</strong>: Fortschritt</li>
                <li><strong>Ressourcen</strong>: Technologien und Tools</li>
              </ul>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Projektstatus verstehen</h2>
          
          <p>
            Der Status zeigt Ihnen auf einen Blick, in welcher Phase sich ein Projekt befindet:
          </p>
          
          <div className="space-y-4 my-6">
            <div className="bg-yellow-900/30 p-4 rounded-lg border-l-4 border-yellow-500">
              <h3 className="font-bold text-yellow-300">📅 Geplant</h3>
              <p>Das Projekt ist terminiert, aber die Arbeit hat noch nicht begonnen. Ressourcen werden vorbereitet.</p>
            </div>

            <div className="bg-blue-900/30 p-4 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-bold text-blue-300">🚀 In Bearbeitung</h3>
              <p>Das Team arbeitet aktiv am Projekt. Regelmäßige Updates und Fortschritte sind zu erwarten.</p>
            </div>

            <div className="bg-green-900/30 p-4 rounded-lg border-l-4 border-green-500">
              <h3 className="font-bold text-green-300">✅ Abgeschlossen</h3>
              <p>Das Projekt wurde erfolgreich beendet. Ergebnisse sind verfügbar oder bereits implementiert.</p>
            </div>

            <div className="bg-red-900/30 p-4 rounded-lg border-l-4 border-red-500">
              <h3 className="font-bold text-red-300">⏸️ Pausiert</h3>
              <p>Das Projekt wurde temporär angehalten. Gründe können Ressourcenmangel oder geänderte Prioritäten sein.</p>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Projekte auf der Roadmap entdecken</h2>
          
          <h3 className="text-xl font-bold mt-6 mb-3">🎨 Farbcodierung verstehen</h3>
          <p>
            Projekte sind nach Kategorien farblich kodiert, um eine schnelle Orientierung zu ermöglichen:
          </p>
          <ul className="list-disc pl-6 my-4">
            <li><strong>Konsistente Farben</strong>: Jede Kategorie hat eine eigene Farbe</li>
            <li><strong>Visuelle Gruppierung</strong>: Ähnliche Projekte sind leicht erkennbar</li>
            <li><strong>Filter-Integration</strong>: Farben entsprechen den Filterkategorien</li>
          </ul>

          <h3 className="text-xl font-bold mt-6 mb-3">📅 Zeitachse lesen</h3>
          <p>
            Die Position der Projekte zeigt ihre zeitliche Einordnung:
          </p>
          <ul className="list-disc pl-6 my-4">
            <li><strong>Horizontale Position</strong>: Zeigt Start- und Endzeit</li>
            <li><strong>Projektlänge</strong>: Visualisiert die geplante Dauer</li>
            <li><strong>Überschneidungen</strong>: Parallel laufende Projekte sind erkennbar</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Projektdetails erkunden</h2>
          
          <div className="bg-blue-900/30 p-6 rounded-lg my-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-3">🔍 So erhalten Sie mehr Informationen</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li><strong>Hover-Effekt</strong>: Schweben Sie über ein Projekt für eine Schnellvorschau</li>
              <li><strong>Klick für Details</strong>: Klicken Sie auf ein Projekt für vollständige Informationen</li>
              <li><strong>Detailseite</strong>: Umfassende Projekt-Übersicht mit allen relevanten Daten</li>
            </ol>
          </div>

          <h3 className="text-xl font-bold mt-6 mb-3">📋 Was Sie in den Details finden</h3>
          <ul className="list-disc pl-6 my-4">
            <li><strong>Ausführliche Beschreibung</strong>: Ziele, Inhalte und erwartete Ergebnisse</li>
            <li><strong>Vollständige Team-Liste</strong>: Alle beteiligten Personen mit Rollen</li>
            <li><strong>Technische Details</strong>: Verwendete Technologien und Tools</li>
            <li><strong>Abhängigkeiten</strong>: Verbindungen zu anderen Projekten</li>
            <li><strong>Fortschritts-Updates</strong>: Aktuelle Entwicklungen und Meilensteine</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Praktische Tipps</h2>

          <div className="bg-green-900/30 p-6 rounded-lg my-6">
            <h3 className="text-lg font-semibold text-green-300 mb-3">💡 So nutzen Sie Projektinfos optimal</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Direktlinks nutzen</strong>: Teilen Sie Projekt-URLs mit Kollegen</li>
              <li><strong>Status verfolgen</strong>: Beobachten Sie Fortschritte bei wichtigen Projekten</li>
              <li><strong>Team kontaktieren</strong>: Nutzen Sie die Kontaktinformationen für Rückfragen</li>
              <li><strong>Zusammenhänge verstehen</strong>: Achten Sie auf verwandte Projekte</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4">Häufige Fragen zu Projekten</h2>

          <div className="space-y-4">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="font-bold text-blue-300 mb-2">Warum sehe ich nicht alle Projekte?</h3>
              <p>Möglicherweise sind Filter aktiv oder Sie betrachten einen spezifischen Zeitraum. Prüfen Sie die Filter-Einstellungen.</p>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="font-bold text-blue-300 mb-2">Kann ich den Projektfortschritt verfolgen?</h3>
              <p>Ja, der Status wird regelmäßig aktualisiert. Zusätzlich finden Sie Fortschritts-Updates in den Projektdetails.</p>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-lg">
              <h3 className="font-bold text-blue-300 mb-2">Wie finde ich ähnliche Projekte?</h3>
              <p>Nutzen Sie Filter nach Kategorien oder suchen Sie nach verwandten Begriffen in der Suchfunktion.</p>
            </div>
          </div>

          <div className="bg-yellow-900/30 p-6 rounded-lg my-8">
            <h3 className="text-lg font-semibold text-yellow-300 mb-3">🎯 Ihr Nutzen</h3>
            <p className="mb-4">
              Durch das Verstehen der Projektinformationen können Sie:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Bessere Entscheidungen für Ihre eigene Planung treffen</li>
              <li>Synergien mit anderen Teams identifizieren</li>
              <li>Rechtzeitig über wichtige Entwicklungen informiert sein</li>
              <li>Effektiver mit Projektverantwortlichen kommunizieren</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <Link href="/docs/funktionen/roadmap" className="block p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors">
              <div className="font-semibold text-blue-300">📊 Roadmap Navigation</div>
              <div className="text-sm text-gray-400">Lernen Sie, wie Sie die Roadmap effektiv nutzen</div>
            </Link>
            <Link href="/docs/funktionen/kategorien" className="block p-4 bg-purple-600/20 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors">
              <div className="font-semibold text-purple-300">🏷️ Kategorien verstehen</div>
              <div className="text-sm text-gray-400">Alles über Projekt-Kategorien und Filter</div>
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
};

export default ProjekteDocsPage;
