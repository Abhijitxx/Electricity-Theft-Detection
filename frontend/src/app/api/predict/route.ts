import { NextRequest, NextResponse } from 'next/server';

// Python backend URL - adjust if running on different host/port
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      );
    }

    // Forward the file to Python backend
    try {
      const pythonFormData = new FormData();
      pythonFormData.append('file', file);

      const pythonResponse = await fetch(`${PYTHON_API_URL}/predict`, {
        method: 'POST',
        body: pythonFormData,
      });

      if (!pythonResponse.ok) {
        const errorData = await pythonResponse.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || 'Python API request failed');
      }

      const pythonData = await pythonResponse.json();

      // Return the predictions from Python backend
      const predictions = pythonData.predictions as PredictionResult[];

      return NextResponse.json({
        success: true,
        predictions,
        summary: {
          total: predictions.length,
          theft_detected: predictions.filter((p: PredictionResult) => p.ensemble_prediction === 1).length,
          high_risk: predictions.filter((p: PredictionResult) => p.risk_category === 'High').length,
          medium_risk: predictions.filter((p: PredictionResult) => p.risk_category === 'Medium').length,
          low_risk: predictions.filter((p: PredictionResult) => p.risk_category === 'Low').length,
          minimal_risk: predictions.filter((p: PredictionResult) => p.risk_category === 'Minimal').length,
        },
        timestamp: pythonData.timestamp,
      });

    } catch (fetchError) {
      // If Python backend is not available, return a helpful error
      console.error('Python backend error:', fetchError);
      
      return NextResponse.json(
        { 
          error: 'Python backend is not available. Please ensure the Python API server is running on port 8000.',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          instructions: 'Run: cd backend && python app.py'
        },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process file' },
      { status: 500 }
    );
  }
}

