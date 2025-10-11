"""
Feature extraction module for electricity theft detection.
Extracts 34 features from consumption data.
"""

import numpy as np
import pandas as pd
from scipy import stats


def extract_features(consumption_data: np.ndarray) -> dict:
    """
    Extract 34 features from electricity consumption data.
    
    Args:
        consumption_data: Array of consumption values (hourly readings)
        
    Returns:
        Dictionary containing all 34 features
    """
    features = {}
    
    # Ensure we have valid data
    if len(consumption_data) == 0:
        return {f'feature_{i}': 0 for i in range(34)}
    
    consumption_series = pd.Series(consumption_data)
    
    # ========== STATISTICAL FEATURES (12) ==========
    
    # Basic statistics
    features['mean'] = np.mean(consumption_data)
    features['std'] = np.std(consumption_data)
    features['median'] = np.median(consumption_data)
    features['min'] = np.min(consumption_data)
    features['max'] = np.max(consumption_data)
    features['range'] = features['max'] - features['min']
    
    # Percentiles and IQR
    features['q25'] = np.percentile(consumption_data, 25)
    features['q75'] = np.percentile(consumption_data, 75)
    features['iqr'] = features['q75'] - features['q25']
    
    # Distribution shape
    skew_val = consumption_series.skew()
    kurt_val = consumption_series.kurtosis()
    features['skewness'] = 0 if pd.isna(skew_val) or np.isnan(skew_val) or np.isinf(skew_val) else skew_val
    features['kurtosis'] = 0 if pd.isna(kurt_val) or np.isnan(kurt_val) or np.isinf(kurt_val) else kurt_val
    
    # Coefficient of variation
    features['cv'] = features['std'] / features['mean'] if features['mean'] != 0 else 0
    
    # ========== TEMPORAL FEATURES (3) ==========
    
    # Differences between consecutive readings
    diffs = np.diff(consumption_data)
    features['mean_diff'] = np.mean(diffs) if len(diffs) > 0 else 0
    features['std_diff'] = np.std(diffs) if len(diffs) > 0 else 0
    
    # Trend slope (linear regression)
    if len(consumption_data) > 1:
        x = np.arange(len(consumption_data))
        slope, _, _, _, _ = stats.linregress(x, consumption_data)
        features['trend_slope'] = slope
    else:
        features['trend_slope'] = 0
    
    # ========== CONSUMPTION PATTERNS (8) ==========
    
    # Zero readings
    features['zero_count'] = np.sum(consumption_data == 0)
    features['zero_ratio'] = features['zero_count'] / len(consumption_data)
    
    # Negative values (theft indicator)
    features['negative_count'] = np.sum(consumption_data < 0)
    features['negative_ratio'] = features['negative_count'] / len(consumption_data)
    
    # Low consumption (below 10% of mean)
    low_threshold = features['mean'] * 0.1 if features['mean'] > 0 else 0.1
    features['low_consumption_count'] = np.sum(consumption_data < low_threshold)
    features['low_consumption_ratio'] = features['low_consumption_count'] / len(consumption_data)
    
    # High consumption (above 200% of mean)
    high_threshold = features['mean'] * 2.0 if features['mean'] > 0 else 5.0
    features['high_consumption_count'] = np.sum(consumption_data > high_threshold)
    features['high_consumption_ratio'] = features['high_consumption_count'] / len(consumption_data)
    
    # ========== ADVANCED FEATURES (11) ==========
    
    # Median Absolute Deviation
    features['mad'] = np.median(np.abs(consumption_data - features['median']))
    
    # Rolling statistics (if enough data)
    if len(consumption_data) >= 24:
        rolling_window = 24  # 24-hour window
        rolling_std = consumption_series.rolling(window=rolling_window).std()
        rolling_mean = rolling_std.mean()
        rolling_std_val = rolling_std.std()
        features['rolling_std_mean'] = 0 if pd.isna(rolling_mean) or np.isnan(rolling_mean) else rolling_mean
        features['rolling_std_std'] = 0 if pd.isna(rolling_std_val) or np.isnan(rolling_std_val) else rolling_std_val
    else:
        features['rolling_std_mean'] = features['std']
        features['rolling_std_std'] = 0
    
    # Time-based features (assuming hourly data)
    if len(consumption_data) >= 24:
        # Reshape to hourly patterns
        hours_available = len(consumption_data)
        hourly_means = []
        
        for hour in range(24):
            # Get all readings for this hour
            hour_readings = consumption_data[hour::24]
            if len(hour_readings) > 0:
                hourly_means.append(np.mean(hour_readings))
        
        if len(hourly_means) > 0:
            features['hour_mean'] = np.mean(hourly_means)
            features['hour_std'] = np.std(hourly_means)
            features['peak_hour'] = np.argmax(hourly_means)
        else:
            features['hour_mean'] = features['mean']
            features['hour_std'] = features['std']
            features['peak_hour'] = 0
    else:
        features['hour_mean'] = features['mean']
        features['hour_std'] = features['std']
        features['peak_hour'] = 0
    
    # Weekend dominant (simplified - assumes continuous data)
    features['is_weekend_dominant'] = 0  # Placeholder without date info
    
    # Hour distribution (morning: 6-12, evening: 18-22, night: 22-6)
    total_consumption = np.sum(consumption_data)
    if len(consumption_data) >= 24 and total_consumption > 0:
        # Approximate hourly distribution
        morning_hours = consumption_data[6:12:24]  # 6 AM to noon
        evening_hours = consumption_data[18:22:24]  # 6 PM to 10 PM
        night_hours = np.concatenate([consumption_data[22::24], consumption_data[:6:24]])
        
        features['morning_hour_ratio'] = np.sum(morning_hours) / total_consumption if len(morning_hours) > 0 else 0
        features['evening_hour_ratio'] = np.sum(evening_hours) / total_consumption if len(evening_hours) > 0 else 0
        features['night_hour_ratio'] = np.sum(night_hours) / total_consumption if len(night_hours) > 0 else 0
    else:
        features['morning_hour_ratio'] = 0.33
        features['evening_hour_ratio'] = 0.33
        features['night_hour_ratio'] = 0.33
    
    # Sequence length
    features['sequence_length'] = len(consumption_data)
    
    # Final cleanup: Replace any NaN or Inf values with 0
    for key, value in features.items():
        if pd.isna(value) or np.isnan(value) or np.isinf(value):
            features[key] = 0.0
    
    return features


def extract_features_from_row(row_data: list, skip_first_column: bool = True) -> dict:
    """
    Extract features from a CSV row.
    
    Args:
        row_data: List of values from CSV row
        skip_first_column: Whether to skip first column (consumer ID)
        
    Returns:
        Dictionary of features
    """
    # Skip consumer ID if needed
    start_idx = 1 if skip_first_column else 0
    
    # Convert to numeric array, handling any non-numeric values
    consumption_values = []
    for val in row_data[start_idx:]:
        try:
            consumption_values.append(float(val))
        except (ValueError, TypeError):
            consumption_values.append(0.0)
    
    consumption_array = np.array(consumption_values)
    
    return extract_features(consumption_array)


def features_to_array(features: dict, feature_names: list = None) -> np.ndarray:
    """
    Convert features dictionary to numpy array in correct order.
    
    Args:
        features: Dictionary of features
        feature_names: List of feature names in correct order (optional)
        
    Returns:
        1D numpy array of feature values
    """
    if feature_names is None:
        # Default order (must match training order)
        feature_names = [
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
        ]
    
    return np.array([features.get(name, 0) for name in feature_names])
