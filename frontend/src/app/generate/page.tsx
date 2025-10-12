'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Settings, AlertCircle, CheckCircle, Zap } from 'lucide-react';

export default function GenerateDataPage() {
  const [numConsumers, setNumConsumers] = useState(50);
  const [days, setDays] = useState(30);
  const [theftRate, setTheftRate] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [generatedFile, setGeneratedFile] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setGeneratedFile(null);

    try {
      const response = await fetch('/api/generate-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          num_consumers: numConsumers,
          days: days,
          theft_rate: theftRate / 100,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate data');
      }

      // Get the CSV content
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synthetic_consumption_${numConsumers}consumers_${days}days.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccess(true);
      setGeneratedFile(a.download);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const expectedRecords = numConsumers * days * 24;
  const expectedTheftConsumers = Math.round(numConsumers * (theftRate / 100));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Generate Sample Data</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Create synthetic electricity consumption data with configurable theft patterns for testing
        </p>
      </div>

      {/* Configuration Card */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
          Data Configuration
        </h2>

        <div className="space-y-6">
          {/* Number of Consumers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Consumers
            </label>
            <input
              type="number"
              min="10"
              max="1000"
              value={numConsumers}
              onChange={(e) => setNumConsumers(parseInt(e.target.value) || 10)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of unique consumers to generate (10-1000)
            </p>
          </div>

          {/* Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Days
            </label>
            <input
              type="number"
              min="7"
              max="365"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 7)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Duration of consumption data in days (7-365)
            </p>
          </div>

          {/* Theft Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theft Rate: {theftRate}%
            </label>
            <input
              type="range"
              min="0"
              max="50"
              value={theftRate}
              onChange={(e) => setTheftRate(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0% (No Theft)</span>
              <span>25% (Moderate)</span>
              <span>50% (High)</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Percentage of consumers with theft patterns
            </p>
          </div>
        </div>

        {/* Preview Statistics */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">Expected Dataset:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-blue-700">Total Records</span>
              <span className="text-lg font-bold text-blue-900">
                {expectedRecords.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-blue-700">Theft Consumers</span>
              <span className="text-lg font-bold text-blue-900">
                {expectedTheftConsumers} / {numConsumers}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-blue-700">Normal Consumers</span>
              <span className="text-lg font-bold text-blue-900">
                {numConsumers - expectedTheftConsumers} / {numConsumers}
              </span>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating Data...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Generate Sample Data
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 flex items-center p-4 bg-danger-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-danger-600 mr-3 flex-shrink-0" />
            <p className="text-sm text-danger-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && generatedFile && (
          <div className="mt-4 flex items-center p-4 bg-success-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-success-600 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-success-900">Data Generated Successfully!</p>
              <p className="text-xs text-success-700 mt-1">
                Downloaded: {generatedFile}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dataset Format Information */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
          Dataset Format
        </h2>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            The generated CSV file will contain the following columns:
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Column Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Data Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">consumer_id</td>
                  <td className="px-4 py-3 text-sm text-gray-600">String</td>
                  <td className="px-4 py-3 text-sm text-gray-600">Unique consumer identifier (e.g., C001, C002)</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">timestamp</td>
                  <td className="px-4 py-3 text-sm text-gray-600">DateTime</td>
                  <td className="px-4 py-3 text-sm text-gray-600">Hourly timestamp of consumption reading</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">consumption_kwh</td>
                  <td className="px-4 py-3 text-sm text-gray-600">Float</td>
                  <td className="px-4 py-3 text-sm text-gray-600">Electricity consumption in kilowatt-hours</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">is_theft</td>
                  <td className="px-4 py-3 text-sm text-gray-600">Integer (0/1)</td>
                  <td className="px-4 py-3 text-sm text-gray-600">Ground truth label (1=theft, 0=normal)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Sample Data Preview:</h3>
            <pre className="text-xs text-gray-700 overflow-x-auto">
{`consumer_id,timestamp,consumption_kwh,is_theft
C001,2024-01-01 00:00:00,0.523,0
C001,2024-01-01 01:00:00,0.412,0
C001,2024-01-01 02:00:00,0.338,0
C002,2024-01-01 00:00:00,1.245,1
C002,2024-01-01 01:00:00,0.089,1`}
            </pre>
          </div>
        </div>
      </div>

      {/* Theft Patterns Info */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Injected Theft Patterns</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-danger-50 rounded-lg border border-danger-200">
            <h3 className="text-sm font-semibold text-danger-900 mb-2">Sudden Drop</h3>
            <p className="text-xs text-danger-700">
              30-50% reduction in consumption for 1-7 days to simulate meter tampering
            </p>
          </div>
          <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
            <h3 className="text-sm font-semibold text-warning-900 mb-2">Zero Usage</h3>
            <p className="text-xs text-warning-700">
              Complete absence of readings for 1-7 days indicating meter bypass
            </p>
          </div>
          <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
            <h3 className="text-sm font-semibold text-primary-900 mb-2">Night Spikes</h3>
            <p className="text-xs text-primary-700">
              2-3x abnormal consumption during 12AM-6AM hours
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-sm font-semibold text-purple-900 mb-2">Negative Readings</h3>
            <p className="text-xs text-purple-700">
              Small percentage of negative values indicating reverse metering
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
