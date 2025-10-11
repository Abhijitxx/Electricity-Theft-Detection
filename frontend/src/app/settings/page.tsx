'use client';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure system preferences and model parameters
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Information</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <div>
              <h3 className="font-medium text-gray-900">Model Version</h3>
              <p className="text-sm text-gray-600">Current deployment version</p>
            </div>
            <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
              v1.0.0
            </span>
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <div>
              <h3 className="font-medium text-gray-900">Last Model Training</h3>
              <p className="text-sm text-gray-600">Date of last model update</p>
            </div>
            <span className="text-sm text-gray-900">October 11, 2025</span>
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <div>
              <h3 className="font-medium text-gray-900">Data Source</h3>
              <p className="text-sm text-gray-600">Current data pipeline</p>
            </div>
            <span className="px-3 py-1 bg-success-100 text-success-800 rounded-full text-sm font-medium">
              Active
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-gray-900">Auto-detection</h3>
              <p className="text-sm text-gray-600">Automatic theft detection alerts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Alert Thresholds</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              High Risk Threshold
            </label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="70"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medium Risk Threshold
            </label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="40"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          Reset to Default
        </button>
        <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  );
}
