# 🏷️ Tag-System Implementierung und Speicherung

## Übersicht

Das Tag-System für die SharePoint Roadmap-Anwendung ermöglicht es, Projekte mit Metadaten wie "RPA", "M365", "Lifecycle", "Bauprojekt" etc. zu versehen. Diese Dokumentation erklärt, wo und wie die Tags gespeichert werden.

## Speicherort der Tags

### SharePoint-Liste: "Roadmap Projects"

Die Tags werden in der SharePoint-Liste **"Roadmap Projects"** in folgenden Feldern gespeichert:

| Feldname | Typ | Beschreibung | Beispiel |
|----------|-----|-------------|----------|
| `Tags` | Text (1000 Zeichen) | Kommagetrennte Liste von Tags | `"RPA, M365, Lifecycle"` |
| `Priority` | Choice | Prioritätsstufe des Projekts | `"high"`, `"medium"`, `"low"`, `"critical"` |

### Datenbank-Schema

```typescript
interface Project {
  // ... andere Felder
  tags?: string[];           // Array von Tag-Strings
  priority?: 'low' | 'medium' | 'high' | 'critical'; // Prioritätsstufe
}
```

## Wie Tags gespeichert werden

### 1. Frontend → Backend
Im Projektformular (`ProjectForm.tsx`) werden Tags als Array verwaltet:
```typescript
const [tags, setTags] = useState<string[]>(initialProject?.tags || []);
```

### 2. Backend → SharePoint
Bei der Speicherung werden die Tags in einen kommagetrennten String konvertiert:
```typescript
// In clientDataService.ts
'Tags': projectData.tags ? projectData.tags.join(', ') : ''
```

### 3. SharePoint → Frontend
Beim Laden werden die Tags wieder in ein Array aufgeteilt:
```typescript
// In clientDataService.ts
tags: item.Tags ? item.Tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []
```

## SharePoint-Listen Setup

### Neue Installation
Verwende das Setup-Script für neue SharePoint-Listen:
```bash
npx ts-node scripts/setupSharePointLists.ts
```

### Bestehende Installation aktualisieren
Für bestehende SharePoint-Listen verwende das Update-Script:
```bash
npx ts-node scripts/updateSharePointListsForTags.ts
```

## Vordefinierte Tags

Die Anwendung bietet vordefinierte Tags für bessere Benutzerfreundlichkeit:

```typescript
const predefinedTags = [
  'RPA', 'M365', 'Lifecycle', 'Bauprojekt', 'KI/AI', 'Cloud', 
  'Security', 'Integration', 'Mobile', 'Analytics', 'Infrastructure',
  'Process Automation', 'Digital Transformation', 'Data Migration'
];
```

## Tag-Farben

Tags werden mit spezifischen Farben angezeigt:

```typescript
const tagColors = {
  'RPA': '#3B82F6',           // Blau
  'M365': '#10B981',          // Grün  
  'Lifecycle': '#F59E0B',     // Orange
  'Bauprojekt': '#8B5CF6',    // Lila
  'KI/AI': '#EF4444',         // Rot
  'Cloud': '#06B6D4',         // Cyan
  'Security': '#DC2626',      // Dunkelrot
  // ... weitere Farben
};
```

## Verwendung in der Anwendung

### 1. Tag-Filter in der Sidebar
```typescript
// EnhancedSidebar.tsx
const getTagProjectCount = (tag: string): number => {
  return projects.filter(project => 
    project.tags && project.tags.includes(tag)
  ).length;
};
```

### 2. Tag-Anzeige in Projektkarten
```typescript
// CompactProjectCard.tsx
{project.tags && project.tags.length > 0 && (
  <div className="flex flex-wrap gap-1">
    {project.tags.slice(0, 3).map(tag => (
      <TagBadge key={tag} tag={tag} />
    ))}
  </div>
)}
```

### 3. Tag-Indikatoren in der Timeline
```typescript
// Roadmap.tsx
{project.tags && project.tags.length > 0 && (
  <div className="ml-auto mr-1 flex items-center">
    <span className="text-xs bg-black bg-opacity-40 px-1 rounded">
      🏷️ {project.tags.length}
    </span>
  </div>
)}
```

## Troubleshooting

### Tags werden nicht angezeigt
1. **Prüfe SharePoint-Felder**: Stelle sicher, dass das `Tags`-Feld in der SharePoint-Liste existiert
2. **Prüfe Datenabfrage**: Vergewissere dich, dass `Tags` in den `$select`-Parametern enthalten ist
3. **Prüfe Datenkonvertierung**: Stelle sicher, dass die String→Array-Konvertierung korrekt funktioniert

### Tags werden nicht gespeichert
1. **Prüfe Benutzerberechtigungen**: Admin-Rechte für SharePoint-Listen erforderlich
2. **Prüfe Feldtyp**: Das `Tags`-Feld muss als Text-Feld (max. 1000 Zeichen) konfiguriert sein
3. **Prüfe Array→String-Konvertierung**: Tags müssen als kommagetrennte Liste gespeichert werden

### Performance-Optimierung
- **Caching**: Tags werden beim Laden der Projekte einmalig geladen
- **Filterung**: Tag-Filter arbeiten client-seitig für bessere Performance
- **Lazy Loading**: Tag-Listen werden nur bei Bedarf aufgebaut

## Erweiterte Funktionen

### Tag-Statistiken
```typescript
const getAllAvailableTags = (): string[] => {
  const allTags = new Set<string>();
  projects.forEach(project => {
    if (project.tags) {
      project.tags.forEach(tag => allTags.add(tag));
    }
  });
  return Array.from(allTags).sort();
};
```

### Tag-Gruppierung
```typescript
const getProjectsByTag = (tag: string): Project[] => {
  return projects.filter(project => 
    project.tags && project.tags.includes(tag)
  );
};
```

## Migration bestehender Daten

Falls bereits Projekte ohne Tags existieren:
1. Tags können über das Admin-Interface nachträglich hinzugefügt werden
2. Bulk-Updates sind über PowerShell oder SharePoint-API möglich
3. Standard-Tags können basierend auf Projektkategorien automatisch zugewiesen werden
