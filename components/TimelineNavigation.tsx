import React, { useState } from 'react';

const TimelineNavigation: React.FC = () => {
  const [activeQuarter, setActiveQuarter] = useState<string>('Q1');
  
  const q1Style = {
    background: 'linear-gradient(to right, #facc15, #fbbf24)'
  };
  
  const q2Style = {
    background: 'linear-gradient(to right, #fbbf24, #f59e0b)'
  };
  
  const q3Style = {
    background: 'linear-gradient(to right, #f59e0b, #ea580c)'
  };
  
  const q4Style = {
    background: 'linear-gradient(to right, #ea580c, #c2410c)'
  };
  
  return (
    <div className="flex justify-between py-5 mb-5">
      <div
        style={q1Style}
        className={`flex-1 text-center py-2.5 font-bold cursor-pointer transition-all duration-200 text-black rounded hover:-translate-y-0.5 ${activeQuarter === 'Q1' ? 'transform -translate-y-1 shadow-lg' : ''}`}
        onClick={() => setActiveQuarter('Q1')}
      >
        <span className="text-lg">Q1</span>
      </div>
      <div
        style={q2Style}
        className={`flex-1 text-center py-2.5 font-bold cursor-pointer transition-all duration-200 text-black rounded ml-1 hover:-translate-y-0.5 ${activeQuarter === 'Q2' ? 'transform -translate-y-1 shadow-lg' : ''}`}
        onClick={() => setActiveQuarter('Q2')}
      >
        <span className="text-lg">Q2</span>
      </div>
      <div
        style={q3Style}
        className={`flex-1 text-center py-2.5 font-bold cursor-pointer transition-all duration-200 text-black rounded ml-1 hover:-translate-y-0.5 ${activeQuarter === 'Q3' ? 'transform -translate-y-1 shadow-lg' : ''}`}
        onClick={() => setActiveQuarter('Q3')}
      >
        <span className="text-lg">Q3</span>
      </div>
      <div
        style={q4Style}
        className={`flex-1 text-center py-2.5 font-bold cursor-pointer transition-all duration-200 text-black rounded ml-1 hover:-translate-y-0.5 ${activeQuarter === 'Q4' ? 'transform -translate-y-1 shadow-lg' : ''}`}
        onClick={() => setActiveQuarter('Q4')}
      >
        <span className="text-lg">Q4</span>
      </div>
    </div>
  );
};

export default TimelineNavigation;