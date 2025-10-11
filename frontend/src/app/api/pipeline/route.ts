import { NextResponse } from 'next/server';

// Python backend URL
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    // Fetch latest predictions from Python backend
    const response = await fetch(`${PYTHON_API_URL}/predictions/latest`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      // Fallback to static file
      if (response.status === 404) {
        const fs = require('fs');
        const path = require('path');
        const pipelinePath = path.join(process.cwd(), '..', 'outputs', 'pipeline_artifacts.json');
        
        try {
          const data = fs.readFileSync(pipelinePath, 'utf8');
          return NextResponse.json(JSON.parse(data));
        } catch (err) {
          return NextResponse.json(
            { error: 'No pipeline data available' },
            { status: 404 }
          );
        }
      }

      throw new Error('Failed to fetch pipeline data');
    }

    const data = await response.json();
    const summary = data.summary;

    // Transform to pipeline format
    const pipelineData = {
      pipeline_config: {
        NUM_CONSUMERS: summary.total || 0,
        DAYS: 1, // Based on typical hourly data (24 hours = 1 day)
        THEFT_RATE: (summary.theft_percentage || 0) / 100,
        SEQUENCE_LENGTH: 24,
        LSTM_SEQUENCE_LENGTH: 72,
        ENSEMBLE_WEIGHTS: {
          autoencoder: 0.25,
          lstm: 0.25,
          xgboost: 0.20,
          randomforest: 0.15,
          isolationforest: 0.15,
        },
        CLASSIFICATION_THRESHOLD: summary.threshold_used,
        RANDOM_SEED: 42,
      },
      model_files: {
        autoencoder: 'models/autoencoder.h5',
        lstm: 'models/best_lstm.h5',
        xgboost: 'models/xgboost_model.joblib',
        randomforest: 'models/randomforest_model.joblib',
        isolationforest: 'models/isolationforest_model.joblib',
      },
      scaler_files: {
        standard: 'scalers/standard_scaler.joblib',
        minmax: 'scalers/minmax_scaler.joblib',
        lstm: 'scalers/lstm_scaler.joblib',
      },
      feature_info: {
        feature_count: 34,
        feature_names: [
          'mean', 'std', 'median', 'min', 'max', 'range',
          'q25', 'q75', 'iqr', 'skewness', 'kurtosis', 'cv',
          'mean_diff', 'std_diff', 'trend_slope',
          'zero_count', 'zero_ratio', 'negative_count', 'negative_ratio',
          'low_consumption_count', 'low_consumption_ratio',
          'high_consumption_count', 'high_consumption_ratio',
          'mad', 'rolling_std_mean', 'rolling_std_std',
          'hour_mean', 'hour_std', 'peak_hour',
          'is_weekend_dominant', 'morning_hour_ratio',
          'evening_hour_ratio', 'night_hour_ratio', 'sequence_length'
        ],
        // Note: Feature importance requires training metadata not available in prediction API
        // All features are used equally in the ensemble
        attention_weights: null, // Not available without training artifacts
        note: 'Feature importance calculation requires training phase data',
      },
      timestamp: data.timestamp,
      is_live_data: true,
    };

    return NextResponse.json(pipelineData);

  } catch (error) {
    console.error('Error fetching pipeline data:', error);
    
    // Fallback to static file
    try {
      const fs = require('fs');
      const path = require('path');
      const pipelinePath = path.join(process.cwd(), '..', 'outputs', 'pipeline_artifacts.json');
      const data = fs.readFileSync(pipelinePath, 'utf8');
      const parsedData = JSON.parse(data);
      parsedData.is_live_data = false;
      return NextResponse.json(parsedData);
    } catch (err) {
      return NextResponse.json(
        { error: 'Failed to load pipeline data' },
        { status: 500 }
      );
    }
  }
}
