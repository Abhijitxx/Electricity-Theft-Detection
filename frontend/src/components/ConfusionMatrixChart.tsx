'use client';

interface ConfusionMatrixChartProps {
  data: {
    true_positive: number;
    false_positive: number;
    true_negative: number;
    false_negative: number;
  };
}

export default function ConfusionMatrixChart({ data }: ConfusionMatrixChartProps) {
  // Without ground truth, we can only show predictions (not true confusion matrix)
  // FP and FN are unknown without labeled data
  const detectionData = [
    { 
      label: 'Normal', 
      value: data.true_negative, 
      color: 'bg-green-100 text-green-800',
      description: 'Predicted as Normal'
    },
    { 
      label: 'Theft', 
      value: data.true_positive, 
      color: 'bg-red-100 text-red-800',
      description: 'Predicted as Theft'
    }
  ];

  const total = data.true_positive + data.true_negative;
  const unknownFP = data.false_positive;
  const unknownFN = data.false_negative;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {detectionData.map((item, index) => (
          <div
            key={index}
            className={`p-6 rounded-lg ${item.color} text-center transition-transform hover:scale-105`}
          >
            <div className="text-sm font-medium opacity-70">{item.label}</div>
            <div className="text-4xl font-bold mt-2">{item.value}</div>
            <div className="text-xs mt-1 opacity-60">
              {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-xs mt-1 opacity-50">{item.description}</div>
          </div>
        ))}
      </div>
      
      {(unknownFP > 0 || unknownFN > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-gray-100 text-gray-600 text-center">
            <div className="text-xs font-medium">False Positives</div>
            <div className="text-lg font-bold">{unknownFP}</div>
            <div className="text-xs opacity-60">Unknown without labels</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-100 text-gray-600 text-center">
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
    </div>
  );
}
