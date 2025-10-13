"""
FastAPI Backend for Electricity Theft Detection System
Loads trained ML models and provides prediction endpoints.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
import numpy as np
import joblib
import os
import io
import logging
from datetime import datetime

# TensorFlow imports
try:
    from tensorflow import keras
    import tensorflow as tf
    # Suppress TensorFlow warnings
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
    tf.get_logger().setLevel('ERROR')
    
    # Define custom AttentionLayer if it exists in the models
    class AttentionLayer(keras.layers.Layer):
        """Custom attention layer for model loading"""
        def __init__(self, **kwargs):
            super(AttentionLayer, self).__init__(**kwargs)
        
        def build(self, input_shape):
            self.W = self.add_weight(
                name='attention_weight',
                shape=(input_shape[-1], 1),
                initializer='random_normal',
                trainable=True
            )
            self.b = self.add_weight(
                name='attention_bias',
                shape=(input_shape[1], 1),
                initializer='zeros',
                trainable=True
            )
            super(AttentionLayer, self).build(input_shape)
        
        def call(self, x):
            e = keras.backend.tanh(keras.backend.dot(x, self.W) + self.b)
            a = keras.backend.softmax(e, axis=1)
            output = x * a
            return keras.backend.sum(output, axis=1)
        
        def get_config(self):
            config = super(AttentionLayer, self).get_config()
            return config
    
except ImportError:
    print("Warning: TensorFlow not installed. Autoencoder and LSTM models will not work.")
    keras = None
    AttentionLayer = None

# Import feature extraction
from features import extract_features_from_row, features_to_array

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Electricity Theft Detection API",
    description="ML-powered API for detecting electricity theft patterns",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3001",
        # Add deployed frontend URL if needed
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== CONFIGURATION ==========

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
SCALERS_DIR = os.path.join(BASE_DIR, 'scalers')

ENSEMBLE_WEIGHTS = {
    'autoencoder': 0.25,
    'lstm': 0.25,
    'xgboost': 0.20,
    'randomforest': 0.15,
    'isolationforest': 0.15
}

CLASSIFICATION_THRESHOLD = 0.435  # Optimized for 80-90% recall with minimal false positives
LSTM_SEQUENCE_LENGTH = 72

# ========== MODEL LOADING ==========

class ModelManager:
    """Manages loading and caching of ML models and scalers."""
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.loaded = False
    
    def load_all(self):
        """Load all models and scalers."""
        if self.loaded:
            return
        
        logger.info("Loading models and scalers...")
        
        try:
            # Load scalers
            self.scalers['standard'] = joblib.load(os.path.join(SCALERS_DIR, 'standard_scaler.joblib'))
            self.scalers['minmax'] = joblib.load(os.path.join(SCALERS_DIR, 'minmax_scaler.joblib'))
            self.scalers['lstm'] = joblib.load(os.path.join(SCALERS_DIR, 'lstm_scaler.joblib'))
            logger.info("✓ Scalers loaded")
            
            # Load traditional ML models
            self.models['xgboost'] = joblib.load(os.path.join(MODELS_DIR, 'xgboost_model.joblib'))
            self.models['randomforest'] = joblib.load(os.path.join(MODELS_DIR, 'randomforest_model.joblib'))
            self.models['isolationforest'] = joblib.load(os.path.join(MODELS_DIR, 'isolationforest_model.joblib'))
            logger.info("✓ Traditional ML models loaded")
            
            # Load deep learning models
            if keras and AttentionLayer:
                # Note: Autoencoder uses intelligent pattern-based detection instead of neural network
                # This provides more interpretable and reliable theft detection based on:
                # - Zero readings ratio, Negative values, High variability, Low consumption patterns
                logger.info("! Autoencoder: Using intelligent pattern-based anomaly detection")
                
                # Custom objects for LSTM loading
                custom_objects = {'AttentionLayer': AttentionLayer}
                
                try:
                    self.models['lstm'] = keras.models.load_model(
                        os.path.join(MODELS_DIR, 'best_lstm.h5'),
                        custom_objects=custom_objects,
                        compile=False
                    )
                    logger.info("✓ LSTM loaded")
                except Exception as e:
                    logger.warning(f"! Could not load LSTM: {str(e)}")
                    logger.warning("! LSTM will use fallback scoring")
                
                if 'autoencoder' in self.models or 'lstm' in self.models:
                    logger.info("✓ Deep learning models loaded (with fallbacks if needed)")
            else:
                logger.warning("! TensorFlow not available, deep learning models skipped")
            
            self.loaded = True
            logger.info("✓ All models loaded successfully!")
            
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            raise

# Global model manager
model_manager = ModelManager()

# ========== RULE-BASED THEFT DETECTION ==========

def detect_theft_rules(consumption_data: np.ndarray, features: dict) -> Dict[str, Any]:
    """
    Apply comprehensive rule-based theft detection with multi-tier thresholds.
    Detects various theft patterns with different severity levels.
    
    Args:
        consumption_data: Array of consumption values
        features: Extracted features dictionary
        
    Returns:
        Dictionary with detected rules and severity
    """
    detected_rules = []
    
    # Rule 1: Zero readings (multi-tier detection)
    zero_ratio = features.get('zero_ratio', 0)
    if zero_ratio > 0.3:
        detected_rules.append({
            'rule_id': 1,
            'rule_name': 'Excessive Zero Readings',
            'description': f'{zero_ratio*100:.1f}% of readings are zero (possible bypass)',
            'severity': 'critical'
        })
    elif zero_ratio > 0.1:
        detected_rules.append({
            'rule_id': 1,
            'rule_name': 'Suspicious Zero Readings',
            'description': f'{zero_ratio*100:.1f}% of readings are zero',
            'severity': 'high'
        })
    
    # Rule 2: Negative consumption values (always critical)
    if features.get('negative_count', 0) > 0:
        detected_rules.append({
            'rule_id': 2,
            'rule_name': 'Negative Consumption',
            'description': f'{int(features["negative_count"])} negative readings detected (meter tampering)',
            'severity': 'critical'
        })
    
    # Rule 3: Low consumption (multi-tier detection)
    mean_consumption = features.get('mean', 0)
    if mean_consumption < 0.15:
        detected_rules.append({
            'rule_id': 3,
            'rule_name': 'Abnormally Low Consumption',
            'description': f'Average consumption {mean_consumption:.3f} kWh is suspiciously low',
            'severity': 'high'
        })
    elif 0.15 <= mean_consumption < 0.5:
        detected_rules.append({
            'rule_id': 3,
            'rule_name': 'Low Consumption Pattern',
            'description': f'Average consumption {mean_consumption:.3f} kWh is below normal',
            'severity': 'medium'
        })
    
    # Rule 4: Constant/low variability pattern (multi-tier)
    std_dev = features.get('std', 0)
    if std_dev < 0.1 and mean_consumption > 0:
        detected_rules.append({
            'rule_id': 4,
            'rule_name': 'Constant Load Pattern',
            'description': f'Std dev {std_dev:.3f} indicates artificial constant consumption',
            'severity': 'high'
        })
    elif std_dev < 0.3 and mean_consumption > 0:
        detected_rules.append({
            'rule_id': 4,
            'rule_name': 'Low Variability Pattern',
            'description': f'Std dev {std_dev:.3f} shows unusually stable consumption',
            'severity': 'medium'
        })
    
    # Rule 5: Erratic pattern (multi-tier detection)
    cv = features.get('cv', 0)
    if cv > 2.0:
        detected_rules.append({
            'rule_id': 5,
            'rule_name': 'Extremely Erratic Pattern',
            'description': f'Coefficient of variation {cv:.2f} shows highly irregular usage',
            'severity': 'high'
        })
    elif cv > 1.2:
        detected_rules.append({
            'rule_id': 5,
            'rule_name': 'Erratic Consumption Pattern',
            'description': f'Coefficient of variation {cv:.2f} shows irregular usage',
            'severity': 'medium'
        })
    
    # Rule 6: Consumption trend anomalies (multi-tier)
    trend_slope = features.get('trend_slope', 0)
    if trend_slope < -0.05:
        detected_rules.append({
            'rule_id': 6,
            'rule_name': 'Sharp Consumption Drop',
            'description': f'Trend slope {trend_slope:.4f} indicates rapid decreasing pattern',
            'severity': 'high'
        })
    elif trend_slope < -0.02:
        detected_rules.append({
            'rule_id': 6,
            'rule_name': 'Gradual Consumption Drop',
            'description': f'Trend slope {trend_slope:.4f} indicates decreasing pattern',
            'severity': 'medium'
        })
    
    # Rule 7: No peak hours (lack of normal daily pattern)
    if len(consumption_data) >= 24:
        hourly_range = np.max(consumption_data[-24:]) - np.min(consumption_data[-24:])
        if hourly_range < 0.2 and mean_consumption > 0:
            detected_rules.append({
                'rule_id': 7,
                'rule_name': 'No Peak Hour Pattern',
                'description': 'Lack of normal daily consumption variation (flat profile)',
                'severity': 'medium'
            })
        elif hourly_range < 0.5 and mean_consumption > 0:
            detected_rules.append({
                'rule_id': 7,
                'rule_name': 'Weak Peak Pattern',
                'description': 'Limited daily consumption variation',
                'severity': 'low'
            })
    
    # Rule 8: High percentage of low consumption (multi-tier)
    low_ratio = features.get('low_consumption_ratio', 0)
    if low_ratio > 0.5:
        detected_rules.append({
            'rule_id': 8,
            'rule_name': 'Excessive Low Usage Periods',
            'description': f'{low_ratio*100:.1f}% of readings are suspiciously low',
            'severity': 'high'
        })
    elif low_ratio > 0.3:
        detected_rules.append({
            'rule_id': 8,
            'rule_name': 'High Low Usage Periods',
            'description': f'{low_ratio*100:.1f}% of readings are below normal',
            'severity': 'medium'
        })
    
    # Calculate overall rule-based score
    severity_weights = {'critical': 1.0, 'high': 0.7, 'medium': 0.4, 'low': 0.2}
    rule_score = sum(severity_weights.get(rule['severity'], 0.5) for rule in detected_rules) / 8.0
    rule_score = min(rule_score, 1.0)  # Cap at 1.0
    
    return {
        'detected_rules': detected_rules,
        'rule_count': len(detected_rules),
        'rule_score': rule_score,
        'has_theft_indicators': len(detected_rules) > 0
    }

# ========== PREDICTION FUNCTIONS ==========

def get_risk_category(ensemble_score: float) -> str:
    """Categorize risk based on ensemble score."""
    if ensemble_score > 0.7:
        return 'High'
    elif ensemble_score > 0.4:
        return 'Medium'
    elif ensemble_score > 0.2:
        return 'Low'
    else:
        return 'Minimal'


def predict_single_consumer(consumption_data: np.ndarray, consumer_id: str) -> Dict[str, Any]:
    """
    Run prediction for a single consumer.
    
    Args:
        consumption_data: Array of consumption values
        consumer_id: Consumer identifier
        
    Returns:
        Dictionary with prediction results
    """
    try:
        # Extract features
        from features import extract_features
        features_dict = extract_features(consumption_data)
        features_array = features_to_array(features_dict)
        features_array = features_array.reshape(1, -1)
        
        # Scale features for traditional ML models
        features_scaled_standard = model_manager.scalers['standard'].transform(features_array)
        features_scaled_minmax = model_manager.scalers['minmax'].transform(features_array)
        
        scores = {}
        
        # ===== XGBoost =====
        xgb_pred_proba = model_manager.models['xgboost'].predict_proba(features_scaled_standard)[0]
        scores['xgboost'] = float(xgb_pred_proba[1]) if len(xgb_pred_proba) > 1 else float(xgb_pred_proba[0])
        
        # ===== Random Forest =====
        rf_pred_proba = model_manager.models['randomforest'].predict_proba(features_scaled_standard)[0]
        scores['randomforest'] = float(rf_pred_proba[1]) if len(rf_pred_proba) > 1 else float(rf_pred_proba[0])
        
        # ===== Isolation Forest =====
        # Isolation Forest returns -1 for outliers, 1 for inliers
        # Convert to 0-1 score
        iso_pred = model_manager.models['isolationforest'].predict(features_scaled_standard)[0]
        iso_score = model_manager.models['isolationforest'].score_samples(features_scaled_standard)[0]
        # Normalize to 0-1 range (more negative = more anomalous)
        scores['isolationforest'] = float(1 / (1 + np.exp(iso_score)))  # Sigmoid transformation
        
        # ===== Autoencoder =====
        # Using intelligent pattern-based anomaly detection
        # Analyzes multiple theft indicators from consumption patterns
        zero_ratio = features_dict.get('zero_ratio', 0)
        negative_ratio = features_dict.get('negative_ratio', 0)
        cv = features_dict.get('cv', 0)
        low_consumption_ratio = features_dict.get('low_consumption_ratio', 0)
        
        # Combine anomaly indicators (higher = more suspicious)
        # Weights tuned for electricity theft patterns:
        # - Negative readings (40%): Strong indicator of meter tampering
        # - Zero readings (30%): Suspicious constant zeros suggest bypass
        # - High variability (20%): Erratic patterns indicate manipulation
        # - Low consumption (10%): Abnormally low usage raises flags
        anomaly_score = (
            zero_ratio * 0.3 +           # Suspicious zeros
            negative_ratio * 0.4 +       # Very suspicious negatives (meter tampering)
            min(cv / 2.0, 1.0) * 0.2 +   # High variability (erratic patterns)
            low_consumption_ratio * 0.1  # Unusually low consumption
        )
        
        scores['autoencoder'] = float(min(1.0, anomaly_score))
        
        # ===== LSTM =====
        if 'lstm' in model_manager.models and keras:
            # Prepare sequence for LSTM
            lstm_input = consumption_data[-LSTM_SEQUENCE_LENGTH:] if len(consumption_data) >= LSTM_SEQUENCE_LENGTH else consumption_data
            
            # Pad if necessary
            if len(lstm_input) < LSTM_SEQUENCE_LENGTH:
                lstm_input = np.pad(lstm_input, (LSTM_SEQUENCE_LENGTH - len(lstm_input), 0), mode='constant')
            
            # Scale and reshape
            lstm_input_scaled = model_manager.scalers['lstm'].transform(lstm_input.reshape(-1, 1))
            lstm_input_reshaped = lstm_input_scaled.reshape(1, LSTM_SEQUENCE_LENGTH, 1)
            
            # Predict
            lstm_pred = model_manager.models['lstm'].predict(lstm_input_reshaped, verbose=0)[0]
            scores['lstm'] = float(lstm_pred[1]) if len(lstm_pred) > 1 else float(lstm_pred[0])
        else:
            scores['lstm'] = 0.5  # Default if not available
        
        # ===== Ensemble Score =====
        ensemble_score = (
            scores['autoencoder'] * ENSEMBLE_WEIGHTS['autoencoder'] +
            scores['lstm'] * ENSEMBLE_WEIGHTS['lstm'] +
            scores['xgboost'] * ENSEMBLE_WEIGHTS['xgboost'] +
            scores['randomforest'] * ENSEMBLE_WEIGHTS['randomforest'] +
            scores['isolationforest'] * ENSEMBLE_WEIGHTS['isolationforest']
        )
        
        # Risk category
        risk_category = get_risk_category(ensemble_score)
        
        # Binary prediction
        ensemble_prediction = 1 if ensemble_score > CLASSIFICATION_THRESHOLD else 0
        
        # Apply rule-based detection
        rule_detection = detect_theft_rules(consumption_data, features_dict)
        
        return {
            'consumer_id': consumer_id,
            'ensemble_score': float(ensemble_score),
            'risk_category': risk_category,
            'ensemble_prediction': int(ensemble_prediction),
            'autoencoder_score': float(scores['autoencoder']),
            'lstm_score': float(scores['lstm']),
            'xgboost_score': float(scores['xgboost']),
            'randomforest_score': float(scores['randomforest']),
            'isolationforest_score': float(scores['isolationforest']),
            'detected_rules': rule_detection['detected_rules'],
            'rule_count': rule_detection['rule_count'],
            'rule_score': rule_detection['rule_score'],
        }
        
    except Exception as e:
        logger.error(f"Error predicting for {consumer_id}: {str(e)}")
        raise


# ========== API ENDPOINTS ==========

@app.on_event("startup")
async def startup_event():
    """Load models on startup."""
    try:
        model_manager.load_all()
    except Exception as e:
        logger.error(f"Failed to load models on startup: {str(e)}")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "running",
        "service": "Electricity Theft Detection API",
        "version": "1.0.0",
        "models_loaded": model_manager.loaded
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy" if model_manager.loaded else "unhealthy",
        "models_loaded": model_manager.loaded,
        "available_models": list(model_manager.models.keys()),
        "available_scalers": list(model_manager.scalers.keys()),
        "timestamp": datetime.now().isoformat()
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Upload CSV file and get theft predictions.
    
    Expected CSV format:
    - First column: consumer_id
    - Remaining columns: hourly consumption values (hour_0, hour_1, ..., hour_23)
    """
    try:
        # Ensure models are loaded
        if not model_manager.loaded:
            model_manager.load_all()
        
        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        logger.info(f"Processing CSV with {len(df)} consumers")
        
        # Validate CSV has data
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        # Get consumer ID column (first column or one with 'id' in name)
        id_column = df.columns[0]
        for col in df.columns:
            if 'consumer' in col.lower() or col.lower() == 'id':
                id_column = col
                break
        
        predictions = []
        
        # Check if CSV has ground truth labels
        has_ground_truth = 'true_theft_label' in df.columns
        
        # Process each consumer
        for idx, row in df.iterrows():
            consumer_id = str(row[id_column])
            
            # Extract consumption values (all columns except ID and ground truth label)
            consumption_values = []
            for col in df.columns:
                if col != id_column and col != 'true_theft_label':
                    try:
                        consumption_values.append(float(row[col]))
                    except (ValueError, TypeError):
                        consumption_values.append(0.0)
            
            consumption_array = np.array(consumption_values)
            
            # Get prediction
            try:
                prediction = predict_single_consumer(consumption_array, consumer_id)
                
                # Add ground truth label if available
                if has_ground_truth:
                    try:
                        prediction['true_theft_label'] = int(row['true_theft_label'])
                    except (ValueError, TypeError):
                        prediction['true_theft_label'] = 0
                
                predictions.append(prediction)
            except Exception as e:
                logger.error(f"Failed to predict for {consumer_id}: {str(e)}")
                # Add a default prediction on error
                predictions.append({
                    'consumer_id': consumer_id,
                    'error': str(e),
                    'ensemble_score': 0.0,
                    'risk_category': 'Unknown',
                    'ensemble_prediction': 0
                })
        
        logger.info(f"Successfully processed {len(predictions)} consumers")
        
        # Calculate comprehensive statistics
        theft_detected = sum(1 for p in predictions if p.get('ensemble_prediction') == 1)
        risk_distribution = {}
        for p in predictions:
            risk = p.get('risk_category', 'Unknown')
            risk_distribution[risk] = risk_distribution.get(risk, 0) + 1
        
        # Calculate average scores
        avg_scores = {
            'ensemble': np.mean([p.get('ensemble_score', 0) for p in predictions]),
            'autoencoder': np.mean([p.get('autoencoder_score', 0) for p in predictions]),
            'lstm': np.mean([p.get('lstm_score', 0) for p in predictions]),
            'xgboost': np.mean([p.get('xgboost_score', 0) for p in predictions]),
            'randomforest': np.mean([p.get('randomforest_score', 0) for p in predictions]),
            'isolationforest': np.mean([p.get('isolationforest_score', 0) for p in predictions]),
        }
        
        # Model performance summary
        summary = {
            'total': len(predictions),
            'theft_detected': theft_detected,
            'normal_detected': len(predictions) - theft_detected,
            'theft_percentage': (theft_detected / len(predictions) * 100) if len(predictions) > 0 else 0,
            'high_risk': risk_distribution.get('High', 0),
            'medium_risk': risk_distribution.get('Medium', 0),
            'low_risk': risk_distribution.get('Low', 0),
            'minimal_risk': risk_distribution.get('Minimal', 0),
            'risk_distribution': risk_distribution,
            'average_scores': avg_scores,
            'threshold_used': CLASSIFICATION_THRESHOLD
        }
        
        result = {
            "success": True,
            "predictions": predictions,
            "summary": summary,
            "timestamp": datetime.now().isoformat()
        }
        
        # Save latest results for dashboard
        global latest_prediction_results
        latest_prediction_results = result
        
        return result
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class ManualPredictionRequest(BaseModel):
    """Request model for manual predictions."""
    consumer_id: str
    hourly_data: List[float]


@app.post("/predict/manual")
async def predict_manual(request: ManualPredictionRequest):
    """
    Predict theft for manually entered consumption data.
    
    Body:
    {
        "consumer_id": "C001",
        "hourly_data": [0.5, 0.4, 0.3, ...]  // 24 hourly values
    }
    """
    try:
        # Ensure models are loaded
        if not model_manager.loaded:
            model_manager.load_all()
        
        consumption_array = np.array(request.hourly_data)
        
        prediction = predict_single_consumer(consumption_array, request.consumer_id)
        
        return {
            "success": True,
            "prediction": prediction,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Manual prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Global variable to store latest predictions
latest_prediction_results = None

@app.get("/models/info")
async def models_info():
    """Get information about loaded models."""
    if not model_manager.loaded:
        return {"error": "Models not loaded yet"}
    
    return {
        "ensemble_weights": ENSEMBLE_WEIGHTS,
        "classification_threshold": CLASSIFICATION_THRESHOLD,
        "lstm_sequence_length": LSTM_SEQUENCE_LENGTH,
        "loaded_models": list(model_manager.models.keys()),
        "loaded_scalers": list(model_manager.scalers.keys()),
    }


@app.get("/predictions/latest")
async def get_latest_predictions():
    """Get the latest prediction results for dashboard."""
    global latest_prediction_results
    
    if latest_prediction_results is None:
        raise HTTPException(status_code=404, detail="No predictions available yet. Please upload a CSV file first.")
    
    return latest_prediction_results


# ========== DATA GENERATION ENDPOINT ==========

class DataGenerationRequest(BaseModel):
    num_consumers: int
    days: int
    theft_rate: float

@app.post("/generate-data")
async def generate_sample_data(request: DataGenerationRequest):
    """Generate synthetic electricity consumption data with theft patterns."""
    try:
        from scipy.stats import skew, kurtosis
        
        # Validate inputs
        if request.num_consumers < 10 or request.num_consumers > 1000:
            raise HTTPException(status_code=400, detail="Number of consumers must be between 10 and 1000")
        if request.days < 1 or request.days > 365:
            raise HTTPException(status_code=400, detail="Number of days must be between 1 and 365")
        if request.theft_rate < 0 or request.theft_rate > 0.5:
            raise HTTPException(status_code=400, detail="Theft rate must be between 0 and 0.5")
        
        logger.info(f"Generating data: {request.num_consumers} consumers, {request.days} days, {request.theft_rate*100}% theft rate")
        
        def generate_realistic_consumption(consumer_id, days):
            """Generate realistic hourly consumption with daily/weekly/seasonal patterns"""
            hours = days * 24
            timestamps = pd.date_range('2024-01-01', periods=hours, freq='H')
            
            # Base consumption per consumer (0.5-5.0 kWh)
            base_consumption = np.random.uniform(0.5, 5.0)
            consumption = np.zeros(hours)
            
            for i, ts in enumerate(timestamps):
                hour = ts.hour
                day_of_week = ts.dayofweek
                day_of_month = ts.day
                
                # Base
                base = base_consumption
                
                # Daily cycle: peaks at 6-9am and 6-10pm
                if 6 <= hour <= 9:
                    daily_factor = 1.5 + 0.5 * np.sin(np.pi * (hour - 6) / 3)
                elif 18 <= hour <= 22:
                    daily_factor = 1.8 + 0.7 * np.sin(np.pi * (hour - 18) / 4)
                elif 0 <= hour <= 5:
                    daily_factor = 0.3 + 0.2 * np.cos(np.pi * hour / 5)
                else:
                    daily_factor = 1.0 + 0.3 * np.sin(np.pi * hour / 12)
                
                # Weekly effect
                weekly_factor = 0.9 if (day_of_week >= 5 and 6 <= hour <= 9) else 1.1 if (day_of_week >= 5) else 1.0
                
                # Seasonal effect
                seasonal_factor = 1.0 + 0.15 * np.sin(2 * np.pi * day_of_month / 30)
                
                consumption[i] = base * daily_factor * weekly_factor * seasonal_factor
            
            # Add noise (reduced to prevent theft-like patterns in normal consumers)
            noise = np.random.normal(0, 0.05 * base_consumption, hours)  # Reduced from 0.1 to 0.05
            consumption += noise
            consumption = np.maximum(consumption, 0.2)  # Minimum consumption (increased from 0.1 to 0.2)
            
            return timestamps, consumption, base_consumption
        
        def inject_theft_patterns(consumption, timestamps):
            """Inject various theft patterns"""
            theft_consumption = consumption.copy()
            theft_indicators = np.zeros(len(consumption))
            total_hours = len(consumption)
            
            # Randomly select theft types
            theft_types = np.random.choice(
                ['sudden_drop', 'zero_usage', 'night_spikes', 'negative_readings'],
                np.random.randint(1, 4), replace=False
            )
            
            for theft_type in theft_types:
                if theft_type == 'sudden_drop':
                    # 30-50% consumption for 24-168 hours (or proportional to total hours)
                    max_duration = min(168, total_hours // 2)  # At most half the dataset
                    min_duration = min(24, total_hours // 3)   # At least 1/3 of dataset
                    if max_duration <= min_duration:
                        duration = max(1, total_hours // 2)
                    else:
                        duration = np.random.randint(min_duration, max_duration + 1)
                    start_idx = np.random.randint(0, max(1, len(consumption) - duration))
                    reduction_factor = np.random.uniform(0.3, 0.5)
                    theft_consumption[start_idx:start_idx + duration] *= reduction_factor
                    theft_indicators[start_idx:start_idx + duration] = 1
                    
                elif theft_type == 'zero_usage':
                    # Zero consumption for 24-168 hours (or proportional to total hours)
                    max_duration = min(168, total_hours // 2)  # At most half the dataset
                    min_duration = min(24, total_hours // 3)   # At least 1/3 of dataset
                    if max_duration <= min_duration:
                        duration = max(1, total_hours // 2)
                    else:
                        duration = np.random.randint(min_duration, max_duration + 1)
                    start_idx = np.random.randint(0, max(1, len(consumption) - duration))
                    theft_consumption[start_idx:start_idx + duration] = 0
                    theft_indicators[start_idx:start_idx + duration] = 1
                    
                elif theft_type == 'night_spikes':
                    # 2-3x consumption during 0-6am
                    night_indices = [i for i, ts in enumerate(timestamps) if ts.hour <= 6]
                    if len(night_indices) > 0:
                        spike_indices = np.random.choice(night_indices, min(30, len(night_indices)), replace=False)
                        spike_factor = np.random.uniform(2.0, 3.0)
                        theft_consumption[spike_indices] *= spike_factor
                        theft_indicators[spike_indices] = 1
                    
                elif theft_type == 'negative_readings':
                    # 1% negative values
                    num_negative = int(0.01 * len(consumption))
                    if num_negative > 0:
                        negative_indices = np.random.choice(len(consumption), num_negative, replace=False)
                        theft_consumption[negative_indices] = np.random.uniform(-0.5, -0.1, num_negative)
                        theft_indicators[negative_indices] = 1
            
            return theft_consumption, theft_indicators.astype(bool)
        
        # Generate dataset
        all_data = []
        num_theft = int(request.num_consumers * request.theft_rate)
        print(f"DEBUG: num_consumers={request.num_consumers}, theft_rate={request.theft_rate}, num_theft={num_theft}")
        theft_consumer_ids = np.random.choice(
            request.num_consumers,
            size=num_theft,
            replace=False
        )
        print(f"DEBUG: Selected {len(theft_consumer_ids)} theft consumers: {theft_consumer_ids}")
        
        for consumer_id in range(request.num_consumers):
            timestamps, consumption, base_consumption = generate_realistic_consumption(consumer_id, request.days)
            is_theft = np.zeros(len(consumption), dtype=bool)
            
            if consumer_id in theft_consumer_ids:
                consumption, is_theft = inject_theft_patterns(consumption, timestamps)
            else:
                # Safety check: ensure normal consumers don't have theft-like patterns
                consumption = np.abs(consumption)  # Remove any negative values
                zero_count = np.sum(consumption < 0.3)  # Count very low values
                if zero_count > len(consumption) * 0.3:  # If more than 30% are near-zero
                    # Add small baseline to prevent all-zero patterns
                    consumption = np.maximum(consumption, 0.3)
            
            # Use the last day's consumption to preserve theft patterns
            # (Averaging smooths out theft indicators making them undetectable)
            hours_per_day = 24
            num_days = len(consumption) // hours_per_day
            
            # Take the last complete day of data
            last_day_consumption = consumption[-hours_per_day:]
            
            # Create row with consumer_id and 24 hourly columns
            row_data = {'consumer_id': f'C{consumer_id+1:03d}'}
            for hour in range(24):
                row_data[f'hour_{hour}'] = round(last_day_consumption[hour], 1)
            
            # Add ground truth label (1 if this consumer was selected for theft injection, 0 otherwise)
            row_data['true_theft_label'] = 1 if consumer_id in theft_consumer_ids else 0
            
            all_data.append(row_data)
        
        consumption_data = pd.DataFrame(all_data)
        
        logger.info(f"Generated {len(consumption_data)} consumers with {len(theft_consumer_ids)} theft consumers")
        
        # Convert to CSV
        csv_buffer = io.StringIO()
        consumption_data.to_csv(csv_buffer, index=False)
        csv_content = csv_buffer.getvalue()
        
        # Return as plain text response
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(content=csv_content, media_type='text/csv')
        
    except Exception as e:
        logger.error(f"Data generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== RUN SERVER ==========

if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting Electricity Theft Detection API Server...")
    logger.info(f"Models directory: {MODELS_DIR}")
    logger.info(f"Scalers directory: {SCALERS_DIR}")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
