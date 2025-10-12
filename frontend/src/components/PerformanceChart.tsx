'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface PerformanceChartProps {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
}

export default function PerformanceChart({ accuracy, precision, recall, f1Score, auc }: PerformanceChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);

  // Since we don't have ground truth, these are detection statistics, not true performance metrics
  const data = [
    { 
      name: 'Avg Confidence', 
      value: accuracy * 100, 
      description: 'Mean ensemble score across all predictions',
      details: 'Average confidence level of the ensemble model combining XGBoost, Random Forest, Isolation Forest, LSTM, and Autoencoder.'
    },
    { 
      name: 'Detection Rate', 
      value: precision * 100, 
      description: 'Percentage of consumers flagged as theft',
      details: 'Ratio of consumers identified as theft cases by the detection system.'
    },
    { 
      name: 'Coverage', 
      value: recall * 100, 
      description: 'Analysis coverage of the dataset',
      details: 'Percentage of the dataset successfully analyzed and processed.'
    },
    { 
      name: 'Effectiveness', 
      value: f1Score * 100, 
      description: 'Overall detection effectiveness score',
      details: 'Composite metric representing the balance between detection rate and confidence.'
    },
    { 
      name: 'Ensemble Score', 
      value: auc * 100, 
      description: 'Average prediction score',
      details: 'Mean score from the weighted ensemble of all five machine learning models.'
    },
  ];

  const getBarColor = (index: number) => {
    if (activeIndex === index) return '#2563eb'; // Darker blue when active
    return '#3b82f6'; // Default blue
  };

  const handleBarClick = (entry: any, index: number) => {
    setSelectedMetric(entry);
  };

  const handleBarEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleBarLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={data}
          onMouseLeave={handleBarLeave}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            angle={-15}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 rounded-lg shadow-xl border-2 border-blue-200">
                    <p className="font-bold text-gray-800 text-sm">{data.name}</p>
                    <p className="text-2xl font-bold text-blue-600 my-1">{data.value.toFixed(2)}%</p>
                    <p className="text-xs text-gray-600">{data.description}</p>
                    <p className="text-xs text-gray-500 mt-2 italic">Click bar for more details</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <Bar 
            dataKey="value" 
            name="Detection Score (%)" 
            radius={[8, 8, 0, 0]}
            onClick={handleBarClick}
            onMouseEnter={handleBarEnter}
            style={{ cursor: 'pointer' }}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={getBarColor(index)}
                style={{
                  filter: activeIndex === index ? 'brightness(1.2)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Detailed popup when bar is clicked */}
      {selectedMetric && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-300 shadow-lg animate-fadeIn">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 text-lg">{selectedMetric.name}</h4>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-blue-600">{selectedMetric.value.toFixed(2)}</span>
                <span className="text-xl text-gray-500">%</span>
              </div>
              <p className="text-sm text-gray-700 mt-2 font-medium">
                {selectedMetric.description}
              </p>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {selectedMetric.details}
              </p>
              <div className="mt-3 p-2 bg-white rounded border border-blue-200">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${selectedMetric.value}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700">{selectedMetric.value.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedMetric(null)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2 italic">
        💡 Hover over bars for quick info, click to see detailed explanation • Note: These are detection statistics from model predictions, not validated accuracy metrics.
      </p>
    </div>
  );
}
