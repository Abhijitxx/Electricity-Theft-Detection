'use client';

import React from 'react';
import { Activity, Brain, Target, Shield, AlertCircle } from 'lucide-react';

interface ModelNode {
  name: string;
  weight: number;
  color: string;
  description: string;
}

interface PipelineFlowChartProps {
  models?: ModelNode[];
  threshold?: number;
}

export default function PipelineFlowChart({ 
  models = [
    { name: 'Autoencoder', weight: 25, color: 'bg-purple-500', description: 'Reconstruction error analysis' },
    { name: 'LSTM', weight: 25, color: 'bg-blue-500', description: 'Temporal pattern detection' },
    { name: 'XGBoost', weight: 20, color: 'bg-green-500', description: 'Feature-based classification' },
    { name: 'RandomForest', weight: 15, color: 'bg-yellow-500', description: 'Ensemble tree classifier' },
    { name: 'IsolationForest', weight: 15, color: 'bg-red-500', description: 'Anomaly detection' }
  ],
  threshold = 0.43
}: PipelineFlowChartProps) {
  return (
    <div className="w-full space-y-6">
      {/* Pipeline Flow */}
      <div className="flex flex-col space-y-4">
        {/* Input Stage */}
        <div className="flex items-center justify-center">
          <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-300 w-64 text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Consumer Data Input</h3>
            <p className="text-xs text-gray-500 mt-1">Hourly consumption readings</p>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="flex justify-center">
          <div className="w-1 h-8 bg-gray-300"></div>
        </div>

        {/* Feature Extraction */}
        <div className="flex items-center justify-center">
          <div className="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-300 w-64 text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Feature Extraction</h3>
            <p className="text-xs text-gray-500 mt-1">34 features across 5 categories</p>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="flex justify-center">
          <div className="w-1 h-8 bg-gray-300"></div>
        </div>

        {/* Models Stage */}
        <div className="flex items-center justify-center">
          <div className="bg-gradient-to-r from-purple-50 to-red-50 rounded-lg p-6 border-2 border-purple-300 w-full max-w-2xl">
            <div className="flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 mr-2 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Ensemble Models</h3>
            </div>
            
            {/* Model Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {models.map((model) => (
                <div key={model.name} className="text-center">
                  <div className={`${model.color} rounded-lg p-3 text-white mb-2`}>
                    <div className="font-bold text-lg">{model.weight}%</div>
                    <div className="text-xs font-semibold">{model.name}</div>
                  </div>
                  <div className="text-xs text-gray-500 px-1">{model.description}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-center text-xs text-gray-600">
              Each model provides a score (0-1), weighted and combined
            </div>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="flex justify-center">
          <div className="w-1 h-8 bg-gray-300"></div>
        </div>

        {/* Ensemble Score */}
        <div className="flex items-center justify-center">
          <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300 w-64 text-center">
            <div className="font-semibold text-gray-900 mb-2">Weighted Average Score</div>
            <div className="text-2xl font-bold text-blue-600">0.0 - 1.0</div>
            <p className="text-xs text-gray-500 mt-2">Combined prediction confidence</p>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="flex justify-center">
          <div className="w-1 h-8 bg-gray-300"></div>
        </div>

        {/* Threshold Decision */}
        <div className="flex items-center justify-center">
          <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-300 w-80 text-center">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <h3 className="font-semibold text-gray-900">Threshold Classification</h3>
            <div className="mt-3 flex items-center justify-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-600">If score ≥ </span>
                <span className="font-bold text-red-600">{threshold.toFixed(4)}</span>
                <span className="text-gray-600"> → Theft</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-600">If score &lt; </span>
                <span className="font-bold text-green-600">{threshold.toFixed(4)}</span>
                <span className="text-gray-600"> → Normal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="flex justify-center">
          <div className="w-1 h-8 bg-gray-300"></div>
        </div>

        {/* Final Output */}
        <div className="flex items-center justify-center space-x-4">
          <div className="bg-green-50 rounded-lg p-4 border-2 border-green-300 w-40 text-center">
            <Shield className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold text-green-900">Normal</h3>
            <p className="text-xs text-gray-500 mt-1">Low risk consumer</p>
          </div>
          
          <div className="text-gray-400 font-bold text-xl">OR</div>
          
          <div className="bg-red-50 rounded-lg p-4 border-2 border-red-300 w-40 text-center">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
            <h3 className="font-semibold text-red-900">Theft</h3>
            <p className="text-xs text-gray-500 mt-1">High risk consumer</p>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-semibold text-sm text-blue-900 mb-2">How the Pipeline Works:</h4>
        <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
          <li>Consumer hourly consumption data is collected and preprocessed</li>
          <li>34 statistical, anomaly, and temporal features are extracted</li>
          <li>Each of the 5 trained models independently analyzes the features</li>
          <li>Model predictions are weighted and combined into a single ensemble score</li>
          <li>The score is compared against the optimized threshold ({threshold.toFixed(4)})</li>
          <li>Final classification is made: Normal or Theft detected</li>
          <li>Rule-based detection provides additional insights on theft patterns</li>
        </ol>
      </div>
    </div>
  );
}
