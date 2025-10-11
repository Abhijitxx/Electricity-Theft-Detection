'use client';

import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { EvaluationResults, PipelineArtifacts } from '@/types';
import StatCard from '@/components/StatCard';
import PerformanceChart from '@/components/PerformanceChart';
import RiskDistributionChart from '@/components/RiskDistributionChart';
import ConfusionMatrixChart from '@/components/ConfusionMatrixChart';
import PipelineFlowChart from '@/components/PipelineFlowChart';

export default function Home() {
  const [evaluation, setEvaluation] = useState<EvaluationResults | null>(null);
  const [pipeline, setPipeline] = useState<PipelineArtifacts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [evalRes, pipelineRes] = await Promise.all([
          fetch('/api/evaluation'),
          fetch('/api/pipeline')
        ]);
        
        const evalData = await evalRes.json();
        const pipelineData = await pipelineRes.json();
        
        setEvaluation(evalData);
        setPipeline(pipelineData);
      } catch (error) {
        console.error('Error fetching data:', error);
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

  if (!evaluation || !pipeline) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-warning-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Failed to load data</h2>
          <p className="text-gray-600 mt-2">Please check your data files and try again.</p>
        </div>
      </div>
    );
  }

  const { evaluation_summary } = evaluation;

  // Add null check for evaluation_summary and check if there's no data
  if (!evaluation_summary || evaluation_summary.total_consumers === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <Activity className="mx-auto h-16 w-16 text-primary-500 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Theft Detection Dashboard</h2>
          <p className="text-gray-600 mb-6">
            No data available yet. Get started by uploading a CSV file with consumer electricity data.
          </p>
          <a
            href="/upload"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            Upload & Analyze Data
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-2 text-gray-600">
          Real-time electricity theft detection analytics and model performance metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Avg Confidence Score"
          value={`${(evaluation_summary.ensemble_accuracy * 100).toFixed(2)}%`}
          icon={<CheckCircle className="h-6 w-6" />}
          color="success"
        />
        <StatCard
          title="Detection Rate"
          value={`${(evaluation_summary.ensemble_precision * 100).toFixed(2)}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="primary"
        />
        <StatCard
          title="Total Analyzed"
          value={evaluation_summary.total_consumers.toString()}
          icon={<Activity className="h-6 w-6" />}
          color="primary"
        />
        <StatCard
          title="Theft Cases Detected"
          value={evaluation_summary.theft_consumers_detected.toString()}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="danger"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Detection Statistics</h2>
          <p className="text-sm text-gray-500 mb-4">Based on model predictions (no ground truth labels)</p>
          <PerformanceChart
            accuracy={evaluation_summary.ensemble_accuracy}
            precision={evaluation_summary.ensemble_precision}
            recall={evaluation_summary.ensemble_recall}
            f1Score={evaluation_summary.ensemble_f1}
            auc={evaluation_summary.ensemble_auc}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Risk Distribution</h2>
          <RiskDistributionChart data={evaluation_summary.risk_distribution} />
        </div>
      </div>

      {/* Detection Summary and Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Detection Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{evaluation_summary.confusion_matrix.true_negative}</div>
              <div className="text-sm text-gray-600">Normal Detected</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{evaluation_summary.confusion_matrix.true_positive}</div>
              <div className="text-sm text-gray-600">Theft Detected</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            * These are model predictions. Actual accuracy requires labeled ground truth data for validation.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Model Configuration</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Ensemble Weights</h3>
              <div className="mt-2 space-y-2">
                {Object.entries(pipeline.pipeline_config?.ENSEMBLE_WEIGHTS || {}).map(([model, weight]) => (
                  <div key={model} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 capitalize">{model}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${weight * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {(weight * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500">Configuration Details</h3>
              <dl className="mt-2 space-y-2">
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-600">Total Consumers</dt>
                  <dd className="font-medium text-gray-900">{pipeline.pipeline_config?.NUM_CONSUMERS || 0}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-600">Analysis Period</dt>
                  <dd className="font-medium text-gray-900">{pipeline.pipeline_config?.DAYS || 0} days</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-600">Features Count</dt>
                  <dd className="font-medium text-gray-900">{pipeline.feature_info?.feature_count || 0}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-600">Classification Threshold</dt>
                  <dd className="font-medium text-gray-900">{(pipeline.pipeline_config?.CLASSIFICATION_THRESHOLD || 0.4296).toFixed(4)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Detection Pipeline Flow */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Detection Pipeline Architecture</h2>
        <p className="text-sm text-gray-500 mb-6">Visual representation of how the ensemble model processes consumer data</p>
        <PipelineFlowChart threshold={pipeline.pipeline_config?.CLASSIFICATION_THRESHOLD || 0.4296} />
      </div>

      {/* Ensemble Score Card */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium opacity-90">Average Ensemble Score</h3>
            <p className="text-4xl font-bold mt-2">{(evaluation_summary.ensemble_auc * 100).toFixed(2)}%</p>
            <p className="mt-2 opacity-80">
              Mean confidence score across all predictions
            </p>
          </div>
          <Activity className="h-16 w-16 opacity-50" />
        </div>
      </div>
    </div>
  );
}
