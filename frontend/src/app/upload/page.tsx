'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, X, Edit, Plus, Trash2 } from 'lucide-react';

interface PredictionResult {
  consumer_id: string;
  ensemble_score: number;
  risk_category: string;
  ensemble_prediction: number;
  autoencoder_score: number;
  lstm_score: number;
  xgboost_score: number;
  randomforest_score: number;
  isolationforest_score: number;
}

interface ManualEntry {
  consumer_id: string;
  hourly_data: number[];
}

export default function UploadPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PredictionResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Manual entry states
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);
  const [currentConsumerId, setCurrentConsumerId] = useState('');
  const [hourlyValues, setHourlyValues] = useState<string[]>(Array(24).fill(''));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Filter state
  const [filterType, setFilterType] = useState<'all' | 'theft' | 'normal' | 'high' | 'medium' | 'low' | 'minimal'>('all');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please upload a CSV file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a CSV file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process file');
      }

      // Redirect to consumer analysis page after successful prediction
      router.push('/consumers');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResults(null);
    setError(null);
    setManualEntries([]);
    setCurrentConsumerId('');
    setHourlyValues(Array(24).fill(''));
    setEditingIndex(null);
  };

  // Manual entry handlers
  const handleAddManualEntry = () => {
    if (!currentConsumerId.trim()) {
      setError('Please enter a consumer ID');
      return;
    }

    const parsedValues = hourlyValues.map(v => parseFloat(v) || 0);
    
    if (parsedValues.every(v => v === 0)) {
      setError('Please enter at least some consumption values');
      return;
    }

    const newEntry: ManualEntry = {
      consumer_id: currentConsumerId.trim(),
      hourly_data: parsedValues,
    };

    if (editingIndex !== null) {
      // Update existing entry
      const updated = [...manualEntries];
      updated[editingIndex] = newEntry;
      setManualEntries(updated);
      setEditingIndex(null);
    } else {
      // Add new entry
      setManualEntries([...manualEntries, newEntry]);
    }

    // Reset form
    setCurrentConsumerId('');
    setHourlyValues(Array(24).fill(''));
    setError(null);
  };

  const handleEditEntry = (index: number) => {
    const entry = manualEntries[index];
    setCurrentConsumerId(entry.consumer_id);
    setHourlyValues(entry.hourly_data.map(v => v.toString()));
    setEditingIndex(index);
  };

  const handleDeleteEntry = (index: number) => {
    setManualEntries(manualEntries.filter((_, i) => i !== index));
  };

  const handleCancelEdit = () => {
    setCurrentConsumerId('');
    setHourlyValues(Array(24).fill(''));
    setEditingIndex(null);
    setError(null);
  };

  const handleVerifyManualEntries = async () => {
    if (manualEntries.length === 0) {
      setError('Please add at least one consumer entry');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Convert manual entries to CSV format
      const headers = ['consumer_id', ...Array.from({length: 24}, (_, i) => `hour_${i}`)];
      const csvRows = manualEntries.map(entry => 
        [entry.consumer_id, ...entry.hourly_data].join(',')
      );
      const csvContent = [headers.join(','), ...csvRows].join('\n');

      // Create a blob and submit
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', blob, 'manual_entry.csv');

      const response = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process data');
      }

      // Redirect to consumer analysis page after successful prediction
      router.push('/consumers');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const fillSampleData = () => {
    // Generate sample hourly data with a natural pattern
    const sampleData = [
      0.5, 0.4, 0.3, 0.3, 0.4, 0.6, // Night hours (0-5)
      1.2, 1.8, 2.5, 2.3, 1.9, 1.6, // Morning hours (6-11)
      1.4, 1.3, 1.5, 1.7, 1.9, 2.1, // Afternoon hours (12-17)
      2.8, 3.0, 2.7, 2.1, 1.4, 0.9  // Evening hours (18-23)
    ];
    setHourlyValues(sampleData.map(v => v.toString()));
  };

  const downloadResults = () => {
    if (!results) return;

    const headers = Object.keys(results[0]).join(',');
    const rows = results.map(result => Object.values(result).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictions_${new Date().getTime()}.csv`;
    a.click();
  };

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

  const getFilteredResults = () => {
    if (!results) return [];
    
    switch (filterType) {
      case 'theft':
        return results.filter(r => r.ensemble_prediction === 1);
      case 'normal':
        return results.filter(r => r.ensemble_prediction === 0);
      case 'high':
        return results.filter(r => r.risk_category === 'High');
      case 'medium':
        return results.filter(r => r.risk_category === 'Medium');
      case 'low':
        return results.filter(r => r.risk_category === 'Low');
      case 'minimal':
        return results.filter(r => r.risk_category === 'Minimal');
      default:
        return results;
    }
  };

  const filteredResults = getFilteredResults();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Upload & Predict</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Upload a CSV file or manually enter consumer consumption data to get theft predictions
        </p>
      </div>

      {/* Tabs */}
      {!results && (
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => {
                  setActiveTab('upload');
                  setError(null);
                }}
                className={`py-3 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'upload'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="hidden sm:inline">Upload CSV File</span>
                  <span className="sm:hidden">Upload CSV</span>
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab('manual');
                  setError(null);
                }}
                className={`py-3 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'manual'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Edit className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  <span className="hidden sm:inline">Manual Entry</span>
                  <span className="sm:hidden">Manual</span>
                </div>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Upload Tab */}
      {!results && activeTab === 'upload' && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Upload CSV File</h2>
          
          {/* Drag and Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              <div className="flex justify-center">
                {file ? (
                  <FileSpreadsheet className="h-16 w-16 text-success-500" />
                ) : (
                  <Upload className="h-16 w-16 text-gray-400" />
                )}
              </div>
              
              {file ? (
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="inline-flex items-center px-3 py-1 text-sm text-danger-600 hover:text-danger-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-lg text-gray-600">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    CSV files only
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-center p-4 bg-danger-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-danger-600 mr-3" />
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}

          {/* Upload Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                !file || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Analyze File
                </>
              )}
            </button>
          </div>

          {/* Expected Format Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Expected CSV Format:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• File should contain consumption data columns</p>
              <p>• Required: consumer_id or id column</p>
              <p>• Include hourly/daily consumption values</p>
              <p>• Example columns: consumer_id, hour_0, hour_1, ..., hour_23</p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Tab */}
      {!results && activeTab === 'manual' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Entry Form */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              {editingIndex !== null ? 'Edit Consumer Data' : 'Add Consumer Data'}
            </h2>
            
            {/* Consumer ID Input */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Consumer ID <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={currentConsumerId}
                onChange={(e) => setCurrentConsumerId(e.target.value)}
                placeholder="e.g., C001, CONS_001, 12345"
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Hourly Consumption Data */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  Hourly Consumption (kWh) <span className="text-danger-500">*</span>
                </label>
                <button
                  onClick={fillSampleData}
                  className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium self-start sm:self-auto"
                >
                  Fill Sample Data
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="flex flex-col">
                    <label className="block text-xs text-gray-600 mb-1 truncate">
                      Hour {i}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={hourlyValues[i]}
                      onChange={(e) => {
                        const newValues = [...hourlyValues];
                        newValues[i] = e.target.value;
                        setHourlyValues(newValues);
                      }}
                      placeholder="0.0"
                      className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              {editingIndex !== null && (
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleAddManualEntry}
                className="flex items-center justify-center px-4 sm:px-6 py-2 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                {editingIndex !== null ? 'Update Entry' : 'Add Entry'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center p-4 bg-danger-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-danger-600 mr-3" />
              <p className="text-sm text-danger-700">{error}</p>
            </div>
          )}

          {/* Added Entries List */}
          {manualEntries.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Added Consumers</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {manualEntries.length} consumer{manualEntries.length !== 1 ? 's' : ''} ready for analysis
                  </p>
                </div>
                <button
                  onClick={handleVerifyManualEntries}
                  disabled={loading}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                    loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-success-600 text-white hover:bg-success-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Verify & Predict
                    </>
                  )}
                </button>
              </div>
              
              <div className="divide-y divide-gray-200">
                {manualEntries.map((entry, index) => (
                  <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">
                          {entry.consumer_id}
                        </h3>
                        <div className="grid grid-cols-12 gap-1">
                          {entry.hourly_data.map((value, i) => (
                            <div
                              key={i}
                              className="text-xs text-gray-600 bg-gray-100 rounded px-1 py-0.5 text-center"
                              title={`Hour ${i}: ${value} kWh`}
                            >
                              {value.toFixed(1)}
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Total: {entry.hourly_data.reduce((a, b) => a + b, 0).toFixed(2)} kWh |
                          Avg: {(entry.hourly_data.reduce((a, b) => a + b, 0) / 24).toFixed(2)} kWh/hour
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditEntry(index)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(index)}
                          className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {manualEntries.length === 0 && (
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">How to use Manual Entry:</h3>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>Enter a unique Consumer ID (e.g., C001, CONS_123, or any identifier)</li>
                <li>Fill in the hourly consumption values for 24 hours (0-23)</li>
                <li>Use "Fill Sample Data" for a quick example pattern</li>
                <li>Click "Add Entry" to save the consumer</li>
                <li>Repeat to add multiple consumers</li>
                <li>Click "Verify & Predict" when ready to analyze all entries</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Results Section */}
      {results && (
        <div className="space-y-6">
          {/* Success Message */}
          <div className="bg-success-50 rounded-lg p-6 flex items-start">
            <CheckCircle className="h-6 w-6 text-success-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-success-900">
                Analysis Complete!
              </h3>
              <p className="text-sm text-success-700 mt-1">
                Successfully analyzed {results.length} consumers. See the results below.
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={downloadResults}
                className="flex items-center px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                New Upload
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Total Analyzed</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{results.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Theft Detected</div>
              <div className="text-3xl font-bold text-danger-600 mt-2">
                {results.filter(r => r.ensemble_prediction === 1).length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">High Risk</div>
              <div className="text-3xl font-bold text-warning-600 mt-2">
                {results.filter(r => r.risk_category === 'High' || r.risk_category === 'Medium').length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Normal</div>
              <div className="text-3xl font-bold text-success-600 mt-2">
                {results.filter(r => r.ensemble_prediction === 0).length}
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Prediction Results
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({filteredResults.length} of {results.length})
                </span>
              </h2>
            </div>
            
            {/* Filter Buttons */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filterType === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                All ({results.length})
              </button>
              <button
                onClick={() => setFilterType('theft')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filterType === 'theft'
                    ? 'bg-danger-600 text-white'
                    : 'bg-white text-danger-700 hover:bg-danger-50 border border-danger-300'
                }`}
              >
                <AlertCircle className="inline h-4 w-4 mr-1" />
                Theft ({results.filter(r => r.ensemble_prediction === 1).length})
              </button>
              <button
                onClick={() => setFilterType('normal')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filterType === 'normal'
                    ? 'bg-success-600 text-white'
                    : 'bg-white text-success-700 hover:bg-success-50 border border-success-300'
                }`}
              >
                <CheckCircle className="inline h-4 w-4 mr-1" />
                Normal ({results.filter(r => r.ensemble_prediction === 0).length})
              </button>
              <button
                onClick={() => setFilterType('high')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filterType === 'high'
                    ? 'bg-danger-600 text-white'
                    : 'bg-white text-danger-700 hover:bg-danger-50 border border-danger-300'
                }`}
              >
                High Risk ({results.filter(r => r.risk_category === 'High').length})
              </button>
              <button
                onClick={() => setFilterType('medium')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filterType === 'medium'
                    ? 'bg-warning-600 text-white'
                    : 'bg-white text-warning-700 hover:bg-warning-50 border border-warning-300'
                }`}
              >
                Medium Risk ({results.filter(r => r.risk_category === 'Medium').length})
              </button>
              <button
                onClick={() => setFilterType('low')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filterType === 'low'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-primary-700 hover:bg-primary-50 border border-primary-300'
                }`}
              >
                Low Risk ({results.filter(r => r.risk_category === 'Low').length})
              </button>
              <button
                onClick={() => setFilterType('minimal')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filterType === 'minimal'
                    ? 'bg-success-600 text-white'
                    : 'bg-white text-success-700 hover:bg-success-50 border border-success-300'
                }`}
              >
                Minimal Risk ({results.filter(r => r.risk_category === 'Minimal').length})
              </button>
            </div>
            
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
                      XGBoost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Random Forest
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResults.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.consumer_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskBadgeClass(result.risk_category)}`}>
                          {result.risk_category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(result.ensemble_score * 100).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.ensemble_prediction === 1 ? (
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
                        {(result.xgboost_score * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(result.randomforest_score * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
