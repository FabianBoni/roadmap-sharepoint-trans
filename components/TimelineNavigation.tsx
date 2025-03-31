import React, { useState } from 'react';

const TimelineNavigation: React.FC = () => {
  const [activeQuarter, setActiveQuarter] = useState<string>('Q1');
  
  return (
    <div className="flex justify-between py-5 mb-5">
      <div
        className={`flex-1 text-center py-2.5 font-bold cursor-pointer transition-all duration-200 bg-gradient-to-r from-yellow-400/70 to-yellow-400/40 text-black rounded hover:-translate-y-0.5 ${activeQuarter === 'Q1' ? 'transform -translate-y-1 shadow-lg' : ''}`}
        onClick={() => setActiveQuarter('Q1')}
      >
        <span className="text-lg">Q1</span>
      </div>
      <div
        className={`flex-1 text-center py-2.5 font-bold cursor-pointer transition-all duration-200 bg-gradient-to-r from-yellow-400/40 to-yellow-500/50 text-black rounded ml-1 hover:-translate-y-0.5 ${activeQuarter === 'Q2' ? 'transform -translate-y-1 shadow-lg' : ''}`}
        onClick={() => setActiveQuarter('Q2')}
      >
        <span className="text-lg">Q2</span>
      </div>
      <div
        className={`flex-1 text-center py-2.5 font-bold cursor-pointer transition-all duration-200 bg-gradient-to-r from-yellow-500/50 to-orange-500/60 text-black rounded ml-1 hover:-translate-y-0.5 ${activeQuarter === 'Q3' ? 'transform -translate-y-1 shadow-lg' : ''}`}
        onClick={() => setActiveQuarter('Q3')}
      >
        <span className="text-lg">Q3</span>
      </div>
      <div
        className={`flex-1 text-center py-2.5 font-bold cursor-pointer transition-all duration-200 bg-gradient-to-r from-orange-500/60 to-orange-600/70 text-black rounded ml-1 hover:-translate-y-0.5 ${activeQuarter === 'Q4' ? 'transform -translate-y-1 shadow-lg' : ''}`}
        onClick={() => setActiveQuarter('Q4')}
      >
        <span className="text-lg">Q4</span>
      </div>
    </div>
  );
};

export default TimelineNavigation;