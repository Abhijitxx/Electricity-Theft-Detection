export interface TheftRule {
  rule_id: number;
  rule_name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ConsumerRiskScore {
  consumer_id: string;
  ensemble_score: number;
  risk_category: 'Minimal' | 'Low' | 'Medium' | 'High';
  ensemble_prediction: number;
  true_theft_label?: number;
  autoencoder_score: number;
  lstm_score: number;
  xgboost_score: number;
  randomforest_score: number;
  isolationforest_score: number;
  rule_score: number;
  detected_rules?: TheftRule[];
  rule_count?: number;
  detection_date?: string;
}

export interface EvaluationResults {
  evaluation_summary: {
    ensemble_accuracy: number;
    ensemble_precision: number;
    ensemble_recall: number;
    ensemble_f1: number;
    ensemble_auc: number;
    confusion_matrix: {
      true_positive: number;
      false_positive: number;
      true_negative: number;
      false_negative: number;
    };
    risk_distribution: {
      Minimal: number;
      Low: number;
      Medium: number;
      High?: number;
    };
    total_consumers: number;
    theft_consumers_detected: number;
    actual_theft_consumers: number;
  };
}

export interface PipelineArtifacts {
  pipeline_config: {
    NUM_CONSUMERS: number;
    DAYS: number;
    THEFT_RATE: number;
    SEQUENCE_LENGTH: number;
    LSTM_SEQUENCE_LENGTH: number;
    ENSEMBLE_WEIGHTS: {
      autoencoder: number;
      lstm: number;
      xgboost: number;
      randomforest: number;
      isolationforest: number;
    };
    CLASSIFICATION_THRESHOLD: number;
    RANDOM_SEED: number;
  };
  model_files: {
    autoencoder: string;
    lstm: string;
    xgboost: string;
    randomforest: string;
    isolationforest: string;
  };
  scaler_files: {
    standard: string;
    minmax: string;
    lstm: string;
  };
  data_files: {
    synthetic_data: string;
    consumer_scores: string;
    evaluation_results: string;
  };
  figure_files: {
    eda: string;
    autoencoder: string;
    lstm: string;
    ensemble?: string;
    ml_comparison: string;
  };
  feature_info: {
    feature_count: number;
    feature_names: string[];
    attention_weights: number[];
  };
  performance_summary: {
    ensemble_accuracy: number;
    ensemble_precision: number;
    ensemble_recall: number;
    ensemble_f1: number;
    ensemble_auc: number;
    confusion_matrix: {
      true_positive: number;
      false_positive: number;
      true_negative: number;
      false_negative: number;
    };
    risk_distribution: {
      Minimal: number;
      Low: number;
      Medium: number;
      High?: number;
    };
    total_consumers: number;
    theft_consumers_detected: number;
    actual_theft_consumers: number;
  };
  generation_timestamp: string;
}

export interface ModelPerformance {
  name: string;
  weight: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
}
