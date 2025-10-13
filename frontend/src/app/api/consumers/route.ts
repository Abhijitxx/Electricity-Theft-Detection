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
        const consumersPath = path.join(process.cwd(), '..', 'outputs', 'consumer_risk_scores.csv');
        try {
          const csvData = fs.readFileSync(consumersPath, 'utf8');
          const lines = csvData.split('\n');
          const headers = lines[0].split(',');
          const consumers = lines.slice(1)
            .filter((line: string) => line.trim())
            .map((line: string) => {
              const values = line.split(',');
              const consumer: any = {};
              headers.forEach((header: string, idx: number) => {
                consumer[header.trim()] = values[idx]?.trim() || '';
              });
              return consumer;
            });
          return NextResponse.json(consumers);
        } catch (err) {
          return NextResponse.json(
            { error: 'No consumer data available' },
            { status: 404 }
          );
        }
      }

      throw new Error('Failed to fetch consumer data');
    }

    const data = await response.json();
    
    // Transform predictions to consumer risk scores format
    const consumers = data.predictions.map((pred: any) => ({
      consumer_id: pred.consumer_id,
      ensemble_score: pred.ensemble_score,
      risk_category: pred.risk_category,
      ensemble_prediction: pred.ensemble_prediction,
      true_theft_label: pred.true_theft_label ?? pred.ensemble_prediction, // Use ground truth if available, otherwise use prediction
      autoencoder_score: pred.autoencoder_score,
      lstm_score: pred.lstm_score,
      xgboost_score: pred.xgboost_score,
      randomforest_score: pred.randomforest_score,
      isolationforest_score: pred.isolationforest_score,
      rule_score: pred.rule_score || 0,
      detected_rules: pred.detected_rules || [],
      rule_count: pred.rule_count || 0,
      detection_date: new Date().toISOString().split('T')[0],
    }));

    return NextResponse.json(consumers);

  } catch (error) {
    console.error('Error fetching consumer data:', error);
    
    // Fallback to static CSV file
    try {
      const fs = require('fs');
      const path = require('path');
      const consumersPath = path.join(process.cwd(), '..', 'outputs', 'consumer_risk_scores.csv');
      const csvData = fs.readFileSync(consumersPath, 'utf8');
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      
      const consumers = lines.slice(1)
        .filter((line: string) => line.trim())
        .map((line: string) => {
          const values = line.split(',');
          const consumer: any = {};
          headers.forEach((header: string, idx: number) => {
            consumer[header.trim()] = values[idx]?.trim() || '';
          });
          return consumer;
        });
      
      return NextResponse.json(consumers);
    } catch (err) {
      return NextResponse.json(
        { error: 'Failed to load consumer data' },
        { status: 500 }
      );
    }
  }
}
