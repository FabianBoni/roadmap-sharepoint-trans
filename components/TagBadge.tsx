import React from 'react';

interface TagBadgeProps {
  tag: string;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
}

const TagBadge: React.FC<TagBadgeProps> = ({ 
  tag, 
  size = 'sm', 
  interactive = false, 
  onClick 
}) => {
  // Vordefinierte Tag-Farben für bessere Erkennbarkeit
  const getTagColor = (tagName: string): string => {
    const tagColors: { [key: string]: string } = {
      'RPA': '#6366F1',
      'M365': '#0F766E', 
      'Lifecycle': '#7C3AED',
      'Bauprojekt': '#DC2626',
      'KI/AI': '#059669',
      'Cloud': '#2563EB',
      'Security': '#DC2626',
      'Integration': '#EA580C',
      'Mobile': '#7C2D12',
      'Analytics': '#1F2937',
      'Migration': '#9333EA',
      'Automatisierung': '#16A34A',
      'Infrastruktur': '#0891B2',
      'Compliance': '#B91C1C',
      'Training': '#CA8A04'
    };
    
    return tagColors[tagName] || '#6B7280';
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const baseClasses = `
    inline-flex items-center rounded-full font-medium text-white
    ${sizeClasses[size]}
    ${interactive ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
  `;

  return (
    <span
      className={baseClasses}
      style={{ backgroundColor: getTagColor(tag) }}
      onClick={interactive ? onClick : undefined}
      title={`Tag: ${tag}`}
    >
      🏷️ {tag}
    </span>
  );
};

export default TagBadge;
