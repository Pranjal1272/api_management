import React from 'react';

const SimpleChart = ({ data, title, type = 'bar' }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  if (type === 'line') {
    return (
      <div className="space-y-4">
        {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
        <div className="h-64 relative">
          <svg className="w-full h-full">
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - (item.value / maxValue) * 80;
              const nextItem = data[index + 1];
              
              return (
                <g key={index}>
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="rgb(59, 130, 246)"
                    className="hover:r-6 transition-all"
                  />
                  {nextItem && (
                    <line
                      x1={`${x}%`}
                      y1={`${y}%`}
                      x2={`${((index + 1) / (data.length - 1)) * 100}%`}
                      y2={`${100 - (nextItem.value / maxValue) * 80}%`}
                      stroke="rgb(59, 130, 246)"
                      strokeWidth="2"
                    />
                  )}
                </g>
              );
            })}
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
            {data.map((item, index) => (
              <span key={index}>{item.label}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-16 text-sm text-gray-600 dark:text-gray-400">
              {item.label}
            </div>
            <div className="flex-1 relative">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
              <span className="absolute right-2 top-0 text-xs text-gray-600 dark:text-gray-400 leading-6">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleChart;