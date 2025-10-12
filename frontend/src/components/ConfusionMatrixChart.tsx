'use client';

import { useState } from 'react';

interface ConfusionMatrixChartProps {
  data: {
    true_positive: number;
    false_positive: number;
    true_negative: number;
    false_negative: number;
  };
}

export default function ConfusionMatrixChart({ data }: ConfusionMatrixChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Without ground truth, we can only show predictions (not true confusion matrix)
  // FP and FN are unknown without labeled data
  const detectionData = [
    { 
      label: 'Normal', 
      value: data.true_negative, 
      color: 'bg-green-100 text-green-800',
      hoverColor: 'hover:bg-green-200',
      borderColor: 'border-green-300',
      description: 'Predicted as Normal',
      details: 'Consumers with normal consumption patterns. Low risk score and no significant theft indicators detected by the ensemble model.',
      icon: '✓'
    },
    { 
      label: 'Theft', 
      value: data.true_positive, 
      color: 'bg-red-100 text-red-800',
      hoverColor: 'hover:bg-red-200',
      borderColor: 'border-red-300',
      description: 'Predicted as Theft',
      details: 'Consumers flagged with suspicious patterns. High risk score indicating potential electricity theft detected by ML models.',
      icon: '⚠'
    }
  ];

  const total = data.true_positive + data.true_negative;
  const unknownFP = data.false_positive;
  const unknownFN = data.false_negative;

  const handleCategoryClick = (label: string) => {
    setSelectedCategory(selectedCategory === label ? null : label);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {detectionData.map((item, index) => (
          <div
            key={index}
            onClick={() => handleCategoryClick(item.label)}
            className={`p-6 rounded-lg ${item.color} ${item.hoverColor} text-center transition-all duration-300 cursor-pointer 
              ${selectedCategory === item.label ? `ring-4 ${item.borderColor} shadow-lg scale-105` : 'hover:scale-105 hover:shadow-md'}`}
          >
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="text-sm font-medium opacity-70">{item.label}</div>
            <div className="text-4xl font-bold mt-2">{item.value}</div>
            <div className="text-xs mt-1 opacity-60">
              {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-xs mt-1 opacity-50">{item.description}</div>
            
            {/* Progress bar */}
            <div className="mt-3 bg-white bg-opacity-50 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${item.label === 'Normal' ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Detailed popup when clicked */}
      {selectedCategory && (
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-300 shadow-lg animate-fadeIn">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {detectionData
                .filter(item => item.label === selectedCategory)
                .map((item, index) => (
                  <div key={index}>
                    <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      <span className="text-2xl">{item.icon}</span>
                      {item.label} Prediction Details
                    </h4>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 shadow">
                        <div className="text-xs text-gray-600">Count</div>
                        <div className="text-3xl font-bold text-gray-800">{item.value}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow">
                        <div className="text-xs text-gray-600">Percentage</div>
                        <div className="text-3xl font-bold text-gray-800">
                          {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                      {item.details}
                    </p>
                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">Distribution</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${item.label === 'Normal' ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700 min-w-[45px]">
                          {item.value} / {total}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {(unknownFP > 0 || unknownFN > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-gray-100 text-gray-600 text-center transition-transform hover:scale-105 cursor-not-allowed">
            <div className="text-xs font-medium">False Positives</div>
            <div className="text-lg font-bold">{unknownFP}</div>
            <div className="text-xs opacity-60">Unknown without labels</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-100 text-gray-600 text-center transition-transform hover:scale-105 cursor-not-allowed">
            <div className="text-xs font-medium">False Negatives</div>
            <div className="text-lg font-bold">{unknownFN}</div>
            <div className="text-xs opacity-60">Unknown without labels</div>
          </div>
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="font-semibold mb-1">⚠️ Detection Summary (Not True Confusion Matrix)</p>
        <p>Without labeled ground truth data, we cannot calculate true accuracy, false positives, or false negatives. 
        The values shown are model predictions only. To validate performance, labeled test data is required.</p>
      </div>

      <p className="text-xs text-gray-500 text-center mt-2">
        💡 Click on Normal or Theft boxes to see detailed breakdown
      </p>
    </div>
  );
}
