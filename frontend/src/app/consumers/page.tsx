'use client';

import { useEffect, useState } from 'react';
import { Search, Download, AlertCircle, CheckCircle, X, Info } from 'lucide-react';
import { ConsumerRiskScore, TheftRule } from '@/types';

export default function ConsumersPage() {
  const [consumers, setConsumers] = useState<ConsumerRiskScore[]>([]);
  const [filteredConsumers, setFilteredConsumers] = useState<ConsumerRiskScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedPrediction, setSelectedPrediction] = useState<'all' | 'theft' | 'normal'>('all');
  const [selectedConsumer, setSelectedConsumer] = useState<ConsumerRiskScore | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    if (showRulesModal && selectedConsumer) {
      console.log('=== MODAL OPENED ===');
      console.log('Consumer ID:', selectedConsumer.consumer_id);
      console.log('detected_rules:', selectedConsumer.detected_rules);
      console.log('detected_rules type:', typeof selectedConsumer.detected_rules);
      console.log('detected_rules is Array:', Array.isArray(selectedConsumer.detected_rules));
      console.log('detected_rules length:', selectedConsumer.detected_rules?.length);
      console.log('rule_count:', selectedConsumer.rule_count);
      console.log('rule_score:', selectedConsumer.rule_score);
    }
  }, [showRulesModal, selectedConsumer]);

  useEffect(() => {
    async function fetchConsumers() {
      try {
        const res = await fetch('/api/consumers', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        const data = await res.json();
        console.log('Fetched consumers with rules:', data.map((c: any) => ({
          id: c.consumer_id,
          rules: c.detected_rules?.length || 0,
          rule_count: c.rule_count
        })));
        setConsumers(data);
        setFilteredConsumers(data);
      } catch (error) {
        console.error('Error fetching consumers:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchConsumers();
  }, []);

  useEffect(() => {
    let filtered = consumers;

    if (searchTerm) {
      filtered = filtered.filter(consumer =>
        consumer.consumer_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedRisk !== 'all') {
      filtered = filtered.filter(consumer => consumer.risk_category === selectedRisk);
    }

    if (selectedPrediction === 'theft') {
      filtered = filtered.filter(consumer => consumer.ensemble_prediction === 1);
    } else if (selectedPrediction === 'normal') {
      filtered = filtered.filter(consumer => consumer.ensemble_prediction === 0);
    }

    setFilteredConsumers(filtered);
  }, [searchTerm, selectedRisk, selectedPrediction, consumers]);

  const getRiskBadgeClass = (risk: string) => {
    switch (risk) {
      case 'Minimal':
        return 'bg-success-100 text-success-800';
      case 'Low':
        return 'bg-primary-100 text-primary-800';
      case 'Medium':
        return 'bg-warning-100 text-warning-800';
      case 'High':
        return 'bg-danger-100 text-danger-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    const headers = Object.keys(filteredConsumers[0] || {}).join(',');
    const rows = filteredConsumers.map(consumer =>
      Object.values(consumer).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'consumer_risk_analysis.csv';
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consumer Risk Analysis</h1>
          <p className="mt-2 text-gray-600">
            Detailed analysis of {consumers.length} consumers with risk scoring
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Download className="h-5 w-5 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Consumer ID
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by consumer ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Risk Category
            </label>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="Minimal">Minimal Risk</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center text-sm text-gray-600">
          <AlertCircle className="h-4 w-4 mr-2" />
          Showing {filteredConsumers.length} of {consumers.length} consumers
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Filters</h3>
        <div className="flex flex-wrap gap-2">
          {/* Prediction Filters */}
          <button
            onClick={() => { setSelectedPrediction('all'); setSelectedRisk('all'); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedPrediction === 'all' && selectedRisk === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            All ({consumers.length})
          </button>
          <button
            onClick={() => { setSelectedPrediction('theft'); setSelectedRisk('all'); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedPrediction === 'theft'
                ? 'bg-danger-600 text-white'
                : 'bg-white text-danger-700 hover:bg-danger-50 border border-danger-300'
            }`}
          >
            <AlertCircle className="inline h-4 w-4 mr-1" />
            Theft ({consumers.filter(c => c.ensemble_prediction === 1).length})
          </button>
          <button
            onClick={() => { setSelectedPrediction('normal'); setSelectedRisk('all'); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedPrediction === 'normal'
                ? 'bg-success-600 text-white'
                : 'bg-white text-success-700 hover:bg-success-50 border border-success-300'
            }`}
          >
            <CheckCircle className="inline h-4 w-4 mr-1" />
            Normal ({consumers.filter(c => c.ensemble_prediction === 0).length})
          </button>
          
          {/* Risk Category Filters */}
          <div className="w-px bg-gray-300 mx-2"></div>
          <button
            onClick={() => { setSelectedRisk('High'); setSelectedPrediction('all'); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedRisk === 'High'
                ? 'bg-danger-600 text-white'
                : 'bg-white text-danger-700 hover:bg-danger-50 border border-danger-300'
            }`}
          >
            High Risk ({consumers.filter(c => c.risk_category === 'High').length})
          </button>
          <button
            onClick={() => { setSelectedRisk('Medium'); setSelectedPrediction('all'); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedRisk === 'Medium'
                ? 'bg-warning-600 text-white'
                : 'bg-white text-warning-700 hover:bg-warning-50 border border-warning-300'
            }`}
          >
            Medium Risk ({consumers.filter(c => c.risk_category === 'Medium').length})
          </button>
          <button
            onClick={() => { setSelectedRisk('Low'); setSelectedPrediction('all'); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedRisk === 'Low'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-primary-700 hover:bg-primary-50 border border-primary-300'
            }`}
          >
            Low Risk ({consumers.filter(c => c.risk_category === 'Low').length})
          </button>
          <button
            onClick={() => { setSelectedRisk('Minimal'); setSelectedPrediction('all'); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedRisk === 'Minimal'
                ? 'bg-success-600 text-white'
                : 'bg-white text-success-700 hover:bg-success-50 border border-success-300'
            }`}
          >
            Minimal Risk ({consumers.filter(c => c.risk_category === 'Minimal').length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consumer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ensemble Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prediction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual Label
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  XGBoost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Random Forest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detection Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConsumers.map((consumer) => (
                <tr key={consumer.consumer_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {consumer.consumer_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskBadgeClass(consumer.risk_category)}`}>
                      {consumer.risk_category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(consumer.ensemble_score * 100).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {consumer.ensemble_prediction === 1 ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-danger-100 text-danger-800">
                        Theft
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-success-100 text-success-800">
                        Normal
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {consumer.true_theft_label === 1 ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-danger-100 text-danger-800">
                        Theft
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-success-100 text-success-800">
                        Normal
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(consumer.xgboost_score * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(consumer.randomforest_score * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {consumer.detection_date || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => {
                        console.log('Selected consumer:', consumer.consumer_id, {
                          detected_rules: consumer.detected_rules,
                          rule_count: consumer.rule_count,
                          rule_score: consumer.rule_score
                        });
                        setSelectedConsumer(consumer);
                        setShowRulesModal(true);
                      }}
                      className="inline-flex items-center px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded hover:bg-primary-700 transition-colors"
                    >
                      <Info className="h-3 w-3 mr-1" />
                      View Rules
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rules Modal */}
      {showRulesModal && selectedConsumer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Theft Detection Rules - {selectedConsumer.consumer_id}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedConsumer.ensemble_prediction === 1 ? 'Theft Detected' : 'No Theft Detected'} • 
                  Risk: {selectedConsumer.risk_category}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRulesModal(false);
                  setSelectedConsumer(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {selectedConsumer.detected_rules && selectedConsumer.detected_rules.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                    <h3 className="font-semibold text-danger-900 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      {selectedConsumer.detected_rules.length} Theft Indicator{selectedConsumer.detected_rules.length > 1 ? 's' : ''} Detected
                    </h3>
                    <p className="text-sm text-danger-700 mt-1">
                      Rule Score: {((selectedConsumer.rule_score || 0) * 100).toFixed(1)}%
                    </p>
                  </div>

                  {selectedConsumer.detected_rules.map((rule) => (
                    <div
                      key={rule.rule_id}
                      className={`border rounded-lg p-4 ${
                        rule.severity === 'critical'
                          ? 'bg-danger-50 border-danger-300'
                          : rule.severity === 'high'
                          ? 'bg-warning-50 border-warning-300'
                          : 'bg-yellow-50 border-yellow-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span
                              className={`px-2 py-1 text-xs font-bold rounded mr-2 ${
                                rule.severity === 'critical'
                                  ? 'bg-danger-600 text-white'
                                  : rule.severity === 'high'
                                  ? 'bg-warning-600 text-white'
                                  : 'bg-yellow-600 text-white'
                              }`}
                            >
                              Rule {rule.rule_id}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded uppercase ${
                                rule.severity === 'critical'
                                  ? 'bg-danger-200 text-danger-900'
                                  : rule.severity === 'high'
                                  ? 'bg-warning-200 text-warning-900'
                                  : 'bg-yellow-200 text-yellow-900'
                              }`}
                            >
                              {rule.severity}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mt-2">
                            {rule.rule_name}
                          </h4>
                          <p className="text-sm text-gray-700 mt-1">
                            {rule.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-success-50 border border-success-200 rounded-lg p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-success-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-success-900 text-lg">No Theft Indicators Detected</h3>
                  <p className="text-sm text-success-700 mt-2">
                    This consumer's usage pattern appears normal with no suspicious activity detected by the rule-based system.
                  </p>
                </div>
              )}

              {/* Model Scores Summary */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Model Scores</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-600">Ensemble Score</div>
                    <div className="text-lg font-bold text-gray-900">
                      {(selectedConsumer.ensemble_score * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-600">Rule Score</div>
                    <div className="text-lg font-bold text-gray-900">
                      {((selectedConsumer.rule_score || 0) * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-600">XGBoost</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {(selectedConsumer.xgboost_score * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-600">Random Forest</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {(selectedConsumer.randomforest_score * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-600">LSTM</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {(selectedConsumer.lstm_score * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="text-xs text-gray-600">Autoencoder</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {(selectedConsumer.autoencoder_score * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowRulesModal(false);
                  setSelectedConsumer(null);
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
