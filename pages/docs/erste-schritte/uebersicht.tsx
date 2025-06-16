import React from 'react';
import DocsLayout from '../../../components/DocsLayout';
import Link from 'next/link';

const UebersichtDocsPage: React.FC = () => {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🚀 Willkommen bei JSDoIT Roadmap</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-gray-300">
            Entdecken Sie, wie Sie mit JSDoIT Roadmap Ihre Projekte effizient planen, verfolgen und mit Ihrem Team teilen können.
          </p>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Was ist JSDoIT Roadmap?</h2>
          
          <p>
            JSDoIT Roadmap ist Ihr zentrales Tool für Projektplanung und -verfolgung. Visualisieren Sie alle Ihre Projekte 
            auf einer übersichtlichen Zeitachse und behalten Sie den Überblick über Fortschritte, Deadlines und Ressourcen.
          </p>

          <div className="bg-blue-900/30 p-6 rounded-lg my-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-3">✨ Hauptvorteile</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Übersichtliche Darstellung aller Projekte nach Quartalen</li>
              <li>Einfache Filterung nach Kategorien und Teams</li>
              <li>Detaillierte Projektinformationen auf einen Klick</li>
              <li>Echtzeit-Updates über Projektfortschritte</li>
            </ul>
          </div>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Wie funktioniert es?</h2>
          
          <h3 className="text-xl font-bold mt-6 mb-3">📊 Roadmap-Ansicht</h3>
          
          <p>
            Die Hauptansicht zeigt Ihnen alle Projekte chronologisch organisiert. Hier können Sie:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li><strong>Überblick gewinnen</strong>: Sehen Sie alle Projekte auf einen Blick</li>
            <li><strong>Filtern</strong>: Zeigen Sie nur relevante Projekte für Ihr Team oder Ihre Kategorie an</li>
            <li><strong>Details abrufen</strong>: Klicken Sie auf ein Projekt für detaillierte Informationen</li>
            <li><strong>Navigation</strong>: Springen Sie zwischen verschiedenen Zeiträumen</li>
          </ul>
          
          <h3 className="text-xl font-bold mt-6 mb-3">📋 Projektinformationen</h3>
          
          <p>
            Jedes Projekt enthält alle wichtigen Informationen, die Sie benötigen:
          </p>
          
          <ul className="list-disc pl-6 my-4">
            <li><strong>Grunddaten</strong>: Titel, Beschreibung und Ziele</li>
            <li><strong>Zeitplanung</strong>: Start- und Endtermine</li>
            <li><strong>Status</strong>: Aktueller Fortschritt und Phase</li>
            <li><strong>Team</strong>: Beteiligte Personen und Verantwortliche</li>
            <li><strong>Ressourcen</strong>: Technologien, Services und Daten</li>
          </ul>
          
          <h2 className="text-2xl font-bold mt-8 mb-4">Erste Schritte</h2>
          
          <p>
            So starten Sie mit JSDoIT Roadmap:
          </p>
          
          <ol className="list-decimal pl-6 my-4">
            <li><strong>Roadmap erkunden</strong>: Schauen Sie sich die verfügbaren Projekte an</li>
            <li><strong>Filter nutzen</strong>: Finden Sie die für Sie relevanten Projekte</li>
            <li><strong>Details anzeigen</strong>: Klicken Sie auf Projekte, die Sie interessieren</li>
            <li><strong>Regelmäßig prüfen</strong>: Bleiben Sie über Updates informiert</li>
          </ol>          
          <div className="bg-green-900/30 p-6 rounded-lg my-8">
            <h3 className="text-lg font-semibold text-green-300 mb-3">🎯 Nächste Schritte</h3>
            <p className="mb-4">Bereit loszulegen? Hier sind Ihre nächsten Schritte:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/docs/funktionen/roadmap" className="block p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                <div className="font-semibold text-blue-300">📊 Roadmap nutzen</div>
                <div className="text-sm text-gray-400">Lernen Sie, wie Sie die Roadmap effektiv verwenden</div>
              </Link>
              <Link href="/docs/funktionen/projekte" className="block p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                <div className="font-semibold text-blue-300">📋 Projekte verstehen</div>
                <div className="text-sm text-gray-400">Alles über Projektdetails und -informationen</div>
              </Link>
            </div>
          </div>

          <div className="bg-yellow-900/30 p-6 rounded-lg my-8">
            <h3 className="text-lg font-semibold text-yellow-300 mb-3">💡 Tipp</h3>
            <p>
              Die Roadmap wird regelmäßig aktualisiert. Setzen Sie ein Lesezeichen und schauen Sie regelmäßig vorbei, 
              um über neue Projekte und Änderungen informiert zu bleiben.
            </p>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
};

export default UebersichtDocsPage;