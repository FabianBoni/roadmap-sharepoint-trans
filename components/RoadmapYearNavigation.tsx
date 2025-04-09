import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface RoadmapYearNavigationProps {
  initialYear?: number;
  onYearChange?: (year: number) => void;
}

const RoadmapYearNavigation: React.FC<RoadmapYearNavigationProps> = ({ 
  initialYear = new Date().getFullYear(),
  onYearChange 
}) => {
  const [currentYear, setCurrentYear] = useState<number>(initialYear);
  
  const handleYearChange = (newYear: number) => {
    setCurrentYear(newYear);
    if (onYearChange) {
      onYearChange(newYear);
    }
  };

  const goToPreviousYear = () => {
    handleYearChange(currentYear - 1);
  };

  const goToNextYear = () => {
    handleYearChange(currentYear + 1);
  };

  useEffect(() => {
    // Update document title when year changes
    document.title = `Roadmap JSD - ${currentYear}`;
  }, [currentYear]);

  return (
    <div className="flex items-center justify-center space-x-4">
      <button 
        onClick={goToPreviousYear}
        className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
        aria-label="Previous Year"
      >
        <ChevronLeftIcon className="h-5 w-5 text-white" />
      </button>
      
      <h2 className="text-2xl font-bold text-white">{currentYear}</h2>
      
      <button 
        onClick={goToNextYear}
        className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
        aria-label="Next Year"
      >
        <ChevronRightIcon className="h-5 w-5 text-white" />
      </button>
    </div>
  );
};

export default RoadmapYearNavigation;
