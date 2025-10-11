'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PerformanceChartProps {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
}

export default function PerformanceChart({ accuracy, precision, recall, f1Score, auc }: PerformanceChartProps) {
  // Since we don't have ground truth, these are detection statistics, not true performance metrics
  const data = [
    { name: 'Avg Confidence', value: accuracy * 100, description: 'Mean ensemble score' },
    { name: 'Detection Rate', value: precision * 100, description: 'Theft detection %' },
    { name: 'Coverage', value: recall * 100, description: 'Analysis coverage' },
    { name: 'Effectiveness', value: f1Score * 100, description: 'Overall effectiveness' },
    { name: 'Ensemble Score', value: auc * 100, description: 'Avg prediction score' },
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} />
          <Tooltip 
            formatter={(value: number) => `${value.toFixed(2)}%`}
            labelFormatter={(label) => {
              const item = data.find(d => d.name === label);
              return item ? `${item.name} - ${item.description}` : label;
            }}
          />
          <Legend />
          <Bar dataKey="value" fill="#3b82f6" name="Detection Score (%)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-2 italic">
        Note: These are detection statistics from model predictions, not validated accuracy metrics.
      </p>
    </div>
  );
}
