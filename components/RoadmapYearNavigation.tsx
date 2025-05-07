import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface RoadmapYearNavigationProps {
  initialYear: number;
  onYearChange: (year: number) => void;
}

const RoadmapYearNavigation: React.FC<RoadmapYearNavigationProps> = ({
  initialYear,
  onYearChange
}) => {
  const [currentYear, setCurrentYear] = React.useState(initialYear);

  const handlePreviousYear = () => {
    const newYear = currentYear - 1;
    setCurrentYear(newYear);
    onYearChange(newYear);
  };

  const handleNextYear = () => {
    const newYear = currentYear + 1;
    setCurrentYear(newYear);
    onYearChange(newYear);
  };

  return (
    <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-2">
      <button
        onClick={handlePreviousYear}
        className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        aria-label="Previous Year"
      >
        <FaChevronLeft className="w-4 h-4" />
      </button>
      
      <span className="text-lg font-bold text-white px-2">{currentYear}</span>
      
      <button
        onClick={handleNextYear}
        className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        aria-label="Next Year"
      >
        <FaChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default RoadmapYearNavigation;