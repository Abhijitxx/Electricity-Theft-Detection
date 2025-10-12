'use client';

import { useEffect, useState } from 'react';
import { PipelineArtifacts } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

export default function ModelsPage() {
  const [pipeline, setPipeline] = useState<PipelineArtifacts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/pipeline');
        const data = await res.json();
        setPipeline(data);
      } catch (error) {
        console.error('Error fetching pipeline data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
