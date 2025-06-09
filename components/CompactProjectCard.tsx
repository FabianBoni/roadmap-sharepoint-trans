import React from 'react';
import { Project } from '../types';
import { FaUser, FaClock, FaFlag, FaTag } from 'react-icons/fa';

interface CompactProjectCardProps {
  project: Project;
  categoryColor: string;
  categoryName: string;
  onMouseOver: (e: React.MouseEvent, project: Project) => void;
  onMouseLeave: () => void;
  onClick: (id: string) => void;
}

const CompactProjectCard: React.FC<CompactProjectCardProps> = ({
  project,
  categoryColor,
  categoryName,
  onMouseOver,
  onMouseLeave,
  onClick
}) => {
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed': return '#10B981';
      case 'in-progress': return '#3B82F6';
      case 'planned': return '#6B7280';
      case 'paused': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority?: string): string => {
    switch (priority?.toLowerCase()) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#65A30D';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed': return 'Abgeschlossen';
      case 'in-progress': return 'In Bearbeitung';
      case 'planned': return 'Geplant';
      case 'paused': return 'Pausiert';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  const getPriorityText = (priority?: string): string => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'Kritisch';
      case 'high': return 'Hoch';
      case 'medium': return 'Mittel';
      case 'low': return 'Niedrig';
      default: return 'Normal';
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer p-3"
      onMouseOver={(e) => onMouseOver(e, project)}
      onMouseLeave={onMouseLeave}
      onClick={() => onClick(project.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate" title={project.title}>
            {project.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{categoryName}</p>
        </div>
        <div className="flex items-center space-x-1 ml-2">
          {/* Status Indicator */}
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getStatusColor(project.status) }}
            title={getStatusText(project.status)}
          />
          {/* Priority Indicator */}
          {project.priority && (
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getPriorityColor(project.priority) }}
              title={`Priorität: ${getPriorityText(project.priority)}`}
            />
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Fortschritt</span>
          <span>{project.fortschritt}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: `${project.fortschritt}%`,
              backgroundColor: getStatusColor(project.status)
            }}
          />
        </div>
      </div>

      {/* Meta Information */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          {/* Project Leader */}
          <div className="flex items-center" title={`Projektleitung: ${project.projektleitung}`}>
            <FaUser className="mr-1" />
            <span className="truncate max-w-20">{project.projektleitung}</span>
          </div>
          
          {/* Timeline */}
          <div className="flex items-center" title={`${project.startDate} - ${project.endDate}`}>
            <FaClock className="mr-1" />
            <span>{new Date(project.startDate).toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })}</span>
          </div>
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex items-center" title={project.tags.join(', ')}>
            <FaTag className="mr-1" />
            <span>{project.tags.length}</span>
          </div>
        )}
      </div>

      {/* Tags (wenn vorhanden) */}
      {project.tags && project.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {project.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              +{project.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CompactProjectCard;
