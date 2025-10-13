'use client';

import { useEffect, useState } from 'react';
import { PipelineArtifacts } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface Consumer {
  consumer_id: string;
  ensemble_prediction: number;
  true_theft_label: number;
  ensemble_score: number;
}

interface ConfusionMatrixData {
  truePositive: number;
  falsePositive: number;
  trueNegative: number;
  falseNegative: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  hasGroundTruth: boolean;
}

export default function ModelsPage() {
  const [pipeline, setPipeline] = useState<PipelineArtifacts | null>(null);
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [confusionMatrix, setConfusionMatrix] = useState<ConfusionMatrixData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch pipeline data
        const pipelineRes = await fetch('/api/pipeline');
        const pipelineData = await pipelineRes.json();
        setPipeline(pipelineData);

        // Fetch consumer predictions
        const consumersRes = await fetch('/api/consumers');
        const consumersData = await consumersRes.json();
        setConsumers(consumersData);

        // Calculate confusion matrix
        calculateConfusionMatrix(consumersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const calculateConfusionMatrix = (data: Consumer[]) => {
    if (!data || data.length === 0) {
      setConfusionMatrix(null);
      return;
    }

    // Check if we have ground truth labels (not just predictions copied)
    const hasRealGroundTruth = data.some(c => 
      c.true_theft_label !== undefined && 
      c.true_theft_label !== c.ensemble_prediction
    );

    let truePositive = 0;
    let falsePositive = 0;
    let trueNegative = 0;
    let falseNegative = 0;

    data.forEach(consumer => {
      const predicted = consumer.ensemble_prediction;
      const actual = consumer.true_theft_label ?? predicted; // Fallback to prediction if no label

      if (predicted === 1 && actual === 1) truePositive++;
      else if (predicted === 1 && actual === 0) falsePositive++;
      else if (predicted === 0 && actual === 0) trueNegative++;
      else if (predicted === 0 && actual === 1) falseNegative++;
    });

    const total = truePositive + falsePositive + trueNegative + falseNegative;
    const accuracy = total > 0 ? ((truePositive + trueNegative) / total) * 100 : 0;
    const precision = (truePositive + falsePositive) > 0 
      ? (truePositive / (truePositive + falsePositive)) * 100 
      : 0;
    const recall = (truePositive + falseNegative) > 0 
      ? (truePositive / (truePositive + falseNegative)) * 100 
      : 0;
    const f1Score = (precision + recall) > 0 
      ? (2 * precision * recall) / (precision + recall) 
      : 0;

    setConfusionMatrix({
      truePositive,
      falsePositive,
      trueNegative,
      falseNegative,
      accuracy,
      precision,
      recall,
      f1Score,
      hasGroundTruth: hasRealGroundTruth
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!pipeline) {
    return <div>Error loading data</div>;
  }

  const ensembleWeights = Object.entries(pipeline.pipeline_config?.ENSEMBLE_WEIGHTS || {}).map(([name, weight]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    weight: weight * 100,
  }));

  // Feature importance is not available without training artifacts
  const hasFeatureImportance = pipeline.feature_info?.attention_weights && 
                                Array.isArray(pipeline.feature_info.attention_weights);
  
  const topFeatures = hasFeatureImportance
    ? (pipeline.feature_info?.feature_names || [])
        .map((name, index) => ({
          name,
          importance: (pipeline.feature_info?.attention_weights?.[index] || 0) * 100,
        }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 10)
    : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Model Performance Analysis</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Detailed insights into ensemble model composition and feature importance
        </p>
      </div>

      {/* Confusion Matrix Section */}
      {confusionMatrix && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Confusion Matrix</h2>
            {!confusionMatrix.hasGroundTruth && (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                ⚠️ Using predictions as ground truth
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix Grid */}
            <div className="flex flex-col items-center">
              <div className="text-sm text-gray-600 mb-2">Predicted vs Actual</div>
              <div className="grid grid-cols-3 gap-2 w-full max-w-md">
                {/* Header */}
                <div></div>
                <div className="text-center font-semibold text-sm text-gray-700 py-2">Predicted: Normal</div>
                <div className="text-center font-semibold text-sm text-gray-700 py-2">Predicted: Theft</div>
                
                {/* Actual Normal Row */}
                <div className="flex items-center justify-end font-semibold text-sm text-gray-700 pr-2">Actual: Normal</div>
                <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
                  <div className="text-xs text-green-700 font-medium mb-1">True Negative</div>
                  <div className="text-3xl font-bold text-green-800">{confusionMatrix.trueNegative}</div>
                  <div className="text-xs text-green-600 mt-1">Correct ✓</div>
                </div>
                <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
                  <div className="text-xs text-red-700 font-medium mb-1">False Positive</div>
                  <div className="text-3xl font-bold text-red-800">{confusionMatrix.falsePositive}</div>
                  <div className="text-xs text-red-600 mt-1">Error ✗</div>
                </div>
                
                {/* Actual Theft Row */}
                <div className="flex items-center justify-end font-semibold text-sm text-gray-700 pr-2">Actual: Theft</div>
                <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
                  <div className="text-xs text-red-700 font-medium mb-1">False Negative</div>
                  <div className="text-3xl font-bold text-red-800">{confusionMatrix.falseNegative}</div>
                  <div className="text-xs text-red-600 mt-1">Error ✗</div>
                </div>
                <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
                  <div className="text-xs text-green-700 font-medium mb-1">True Positive</div>
                  <div className="text-3xl font-bold text-green-800">{confusionMatrix.truePositive}</div>
                  <div className="text-xs text-green-600 mt-1">Correct ✓</div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3">Performance Metrics</h3>
              
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Accuracy</span>
                  <span className="text-2xl font-bold text-blue-700">{confusionMatrix.accuracy.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-500"
                    style={{ width: `${confusionMatrix.accuracy}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">Overall correct predictions</p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Precision</span>
                  <span className="text-2xl font-bold text-green-700">{confusionMatrix.precision.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-green-600 h-full transition-all duration-500"
                    style={{ width: `${confusionMatrix.precision}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">Accuracy of theft predictions</p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Recall (Sensitivity)</span>
                  <span className="text-2xl font-bold text-purple-700">{confusionMatrix.recall.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-purple-600 h-full transition-all duration-500"
                    style={{ width: `${confusionMatrix.recall}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">% of actual thieves caught</p>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">F1 Score</span>
                  <span className="text-2xl font-bold text-orange-700">{confusionMatrix.f1Score.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-orange-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-orange-600 h-full transition-all duration-500"
                    style={{ width: `${confusionMatrix.f1Score}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">Harmonic mean of precision & recall</p>
              </div>

              {!confusionMatrix.hasGroundTruth && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> Without ground truth labels, these metrics show perfect scores as predictions are compared with themselves. Upload data with true_theft_label for real validation.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
              <div className="text-sm text-gray-600">Total Samples</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {confusionMatrix.truePositive + confusionMatrix.falsePositive + 
                 confusionMatrix.trueNegative + confusionMatrix.falseNegative}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
              <div className="text-sm text-gray-600">Correct</div>
              <div className="text-2xl font-bold text-green-700 mt-1">
                {confusionMatrix.truePositive + confusionMatrix.trueNegative}
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
              <div className="text-sm text-gray-600">Errors</div>
              <div className="text-2xl font-bold text-red-700 mt-1">
                {confusionMatrix.falsePositive + confusionMatrix.falseNegative}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
              <div className="text-sm text-gray-600">Theft Detected</div>
              <div className="text-2xl font-bold text-blue-700 mt-1">
                {confusionMatrix.truePositive + confusionMatrix.falsePositive}
              </div>
            </div>
          </div>

          {/* Explanation Section */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-6 mt-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-lg">📖</span>
              Understanding the Confusion Matrix
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* True Positive */}
              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 rounded-full p-2 mt-1">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-700 mb-1">True Positive (TP)</h4>
                    <p className="text-sm text-gray-700">
                      Correctly identified theft cases. The model predicted <strong>theft</strong> and it was <strong>actually theft</strong>.
                    </p>
                    <p className="text-xs text-green-600 mt-2 font-medium">✓ Correct Detection</p>
                  </div>
                </div>
              </div>

              {/* True Negative */}
              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 rounded-full p-2 mt-1">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-700 mb-1">True Negative (TN)</h4>
                    <p className="text-sm text-gray-700">
                      Correctly identified normal consumers. The model predicted <strong>normal</strong> and it was <strong>actually normal</strong>.
                    </p>
                    <p className="text-xs text-green-600 mt-2 font-medium">✓ Correct Detection</p>
                  </div>
                </div>
              </div>

              {/* False Positive */}
              <div className="bg-white rounded-lg p-4 border-l-4 border-red-500 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 rounded-full p-2 mt-1">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-700 mb-1">False Positive (FP)</h4>
                    <p className="text-sm text-gray-700">
                      Type I Error: False alarm. The model predicted <strong>theft</strong> but it was <strong>actually normal</strong>.
                    </p>
                    <p className="text-xs text-red-600 mt-2 font-medium">✗ Incorrect - Wrongly Flagged</p>
                  </div>
                </div>
              </div>

              {/* False Negative */}
              <div className="bg-white rounded-lg p-4 border-l-4 border-red-500 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 rounded-full p-2 mt-1">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-700 mb-1">False Negative (FN)</h4>
                    <p className="text-sm text-gray-700">
                      Type II Error: Missed detection. The model predicted <strong>normal</strong> but it was <strong>actually theft</strong>.
                    </p>
                    <p className="text-xs text-red-600 mt-2 font-medium">✗ Incorrect - Missed Thief</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="mt-4 bg-blue-100 border border-blue-300 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Key Insights</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>High Precision</strong> = Few false alarms (low FP)</li>
                <li>• <strong>High Recall</strong> = Catching most thieves (low FN)</li>
                <li>• <strong>Green cells (TP & TN)</strong> = Model is correct</li>
                <li>• <strong>Red cells (FP & FN)</strong> = Model made an error</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Model Weights - Dual Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Ensemble Model Weights (Bar)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ensembleWeights}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 30]} label={{ value: 'Weight (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              <Legend />
              <Bar dataKey="weight" fill="#3b82f6" name="Model Weight (%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Model Contribution (Radar)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={ensembleWeights}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis angle={90} domain={[0, 30]} />
              <Radar 
                name="Contribution %" 
                dataKey="weight" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.6} 
              />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2">
            Higher values indicate greater influence on the final theft detection decision
          </p>
        </div>
      </div>

      {/* Feature Categories */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Feature Categories Overview</h2>
        <p className="text-sm text-gray-600 mb-4">
          {pipeline.feature_info?.feature_count || 34} features organized by category for theft detection analysis
        </p>
        
        {/* Feature category visualization */}
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={[
              { category: 'Statistical', count: 15, description: 'Mean, Std, Median, Min, Max, Range, Quartiles, IQR, Skewness, Kurtosis, CV, MAD, Mean Diff, Std Diff, Trend' },
              { category: 'Anomaly Detection', count: 8, description: 'Zero Count/Ratio, Negative Count/Ratio, Low/High Consumption Count/Ratio' },
              { category: 'Temporal Patterns', count: 7, description: 'Hour Mean/Std, Peak Hour, Weekend Dominant, Morning/Evening/Night Ratios' },
              { category: 'Rolling Statistics', count: 2, description: 'Rolling Std Mean, Rolling Std Std' },
              { category: 'Sequence Info', count: 2, description: 'Sequence Length, Peak Hour' },
            ]}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 20]} label={{ value: 'Number of Features', position: 'insideBottom', offset: -5 }} />
            <YAxis type="category" dataKey="category" width={150} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-md">
                      <p className="font-semibold text-gray-900">{payload[0].payload.category}</p>
                      <p className="text-sm text-gray-600 mt-1">Features: {payload[0].value}</p>
                      <p className="text-xs text-gray-500 mt-2">{payload[0].payload.description}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" fill="#3b82f6" name="Feature Count" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <h3 className="font-semibold text-gray-900">Statistical Features</h3>
            </div>
            <p className="text-xs text-gray-600">Core statistical metrics capturing consumption distribution patterns</p>
          </div>
          
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <h3 className="font-semibold text-gray-900">Anomaly Detection</h3>
            </div>
            <p className="text-xs text-gray-600">Identifies suspicious patterns like zeros, negatives, and unusual consumption levels</p>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <h3 className="font-semibold text-gray-900">Temporal Patterns</h3>
            </div>
            <p className="text-xs text-gray-600">Time-based features capturing daily/hourly usage patterns and peak hours</p>
          </div>
        </div>
      </div>

      {/* Model Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Model Files</h2>
          <div className="space-y-3">
            {Object.entries(pipeline.model_files || {}).map(([model, path]) => (
              <div key={model} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900 capitalize text-sm sm:text-base">{model}</span>
                <code className="text-xs sm:text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded break-all overflow-hidden">{path}</code>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Scaler Files</h2>
          <div className="space-y-3">
            {Object.entries(pipeline.scaler_files || {}).map(([scaler, path]) => (
              <div key={scaler} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900 capitalize text-sm sm:text-base">{scaler}</span>
                <code className="text-xs sm:text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded break-all overflow-hidden">{path}</code>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pipeline Configuration</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg">
            <div className="text-3xl font-bold text-primary-700">{pipeline.pipeline_config?.NUM_CONSUMERS || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Total Consumers</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-success-50 to-success-100 rounded-lg">
            <div className="text-3xl font-bold text-success-700">{pipeline.pipeline_config?.DAYS || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Analysis Days</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-warning-50 to-warning-100 rounded-lg">
            <div className="text-3xl font-bold text-warning-700">{pipeline.feature_info?.feature_count || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Features</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-danger-50 to-danger-100 rounded-lg">
            <div className="text-3xl font-bold text-danger-700">
              {((pipeline.pipeline_config?.THEFT_RATE || 0) * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Theft Rate</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Sequence Lengths</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>General Sequence:</span>
                <span className="font-medium">{pipeline.pipeline_config?.SEQUENCE_LENGTH || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>LSTM Sequence:</span>
                <span className="font-medium">{pipeline.pipeline_config?.LSTM_SEQUENCE_LENGTH || 0}</span>
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Model Settings</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Classification Threshold:</span>
                <span className="font-medium">{(pipeline.pipeline_config?.CLASSIFICATION_THRESHOLD || 0.4296).toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Random Seed:</span>
                <span className="font-medium">{pipeline.pipeline_config?.RANDOM_SEED || 42}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Features List */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">All Features ({pipeline.feature_info?.feature_count || 0})</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-4">
          These features are extracted from consumption data and used by all models in the ensemble.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {(pipeline.feature_info?.feature_names || []).map((feature, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors">
              <div className="text-xs sm:text-sm font-medium text-gray-900 break-words overflow-hidden">{feature}</div>
              <div className="text-xs text-gray-500 mt-1">
                Feature #{index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
