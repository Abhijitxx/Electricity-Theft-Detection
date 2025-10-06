"""
Electricity Theft Detection Dashboard
A Streamlit app for analyzing and detecting electricity theft patterns
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import joblib
from datetime import datetime
import os
from pathlib import Path

# Page configuration
st.set_page_config(
    page_title="Electricity Theft Detection Dashboard",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
    <style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #1f77b4;
    }
    .risk-critical {
        color: #d62728;
        font-weight: bold;
    }
    .risk-high {
        color: #ff7f0e;
        font-weight: bold;
    }
    .risk-medium {
        color: #ffbb00;
        font-weight: bold;
    }
    .risk-low {
        color: #2ca02c;
        font-weight: bold;
    }
    </style>
    """, unsafe_allow_html=True)


def load_data(uploaded_file):
    """Load and validate uploaded CSV file"""
    try:
        df = pd.read_csv(uploaded_file)
        return df, None
    except Exception as e:
        return None, str(e)


def detect_file_type(df):
    """Detect if uploaded file is consumption data or risk scores"""
    if 'ensemble_score' in df.columns and 'risk_category' in df.columns:
        return 'risk_scores'
    elif 'consumption_kwh' in df.columns and 'timestamp' in df.columns:
        return 'consumption_data'
    else:
        return 'unknown'


def categorize_risk(score):
    """Categorize risk level based on ensemble score"""
    if score >= 0.8:
        return 'Critical'
    elif score >= 0.6:
        return 'High'
    elif score >= 0.4:
        return 'Medium'
    elif score >= 0.2:
        return 'Low'
    else:
        return 'Minimal'


def create_overview_metrics(df, file_type):
    """Create overview metric cards"""
    col1, col2, col3, col4 = st.columns(4)
    
    if file_type == 'risk_scores':
        total_consumers = len(df)
        critical_count = len(df[df['risk_category'] == 'Critical'])
        high_count = len(df[df['risk_category'] == 'High'])
        avg_score = df['ensemble_score'].mean()
        
        col1.metric("Total Consumers", f"{total_consumers:,}")
        col2.metric("Critical Risk", f"{critical_count}", 
                   delta=f"{critical_count/total_consumers*100:.1f}%", delta_color="inverse")
        col3.metric("High Risk", f"{high_count}",
                   delta=f"{high_count/total_consumers*100:.1f}%", delta_color="inverse")
        col4.metric("Avg Risk Score", f"{avg_score:.3f}")
        
    elif file_type == 'consumption_data':
        total_records = len(df)
        total_consumers = df['consumer_id'].nunique()
        
        if 'is_theft' in df.columns:
            theft_rate = df['is_theft'].mean() * 100
            theft_consumers = df.groupby('consumer_id')['is_theft'].max().sum()
        else:
            theft_rate = 0
            theft_consumers = 0
        
        avg_consumption = df['consumption_kwh'].mean()
        
        col1.metric("Total Records", f"{total_records:,}")
        col2.metric("Unique Consumers", f"{total_consumers:,}")
        col3.metric("Theft Rate", f"{theft_rate:.1f}%", delta_color="inverse")
        col4.metric("Avg Consumption", f"{avg_consumption:.2f} kWh")


def plot_risk_distribution(df):
    """Create risk category distribution plot"""
    risk_counts = df['risk_category'].value_counts().reindex(
        ['Critical', 'High', 'Medium', 'Low', 'Minimal'], fill_value=0
    )
    
    colors = {
        'Critical': '#d62728',
        'High': '#ff7f0e', 
        'Medium': '#ffbb00',
        'Low': '#2ca02c',
        'Minimal': '#1f77b4'
    }
    
    fig = go.Figure(data=[
        go.Bar(
            x=risk_counts.index,
            y=risk_counts.values,
            marker_color=[colors[cat] for cat in risk_counts.index],
            text=risk_counts.values,
            textposition='auto',
        )
    ])
    
    fig.update_layout(
        title="Risk Category Distribution",
        xaxis_title="Risk Category",
        yaxis_title="Number of Consumers",
        height=400,
        showlegend=False
    )
    
    return fig


def plot_score_distribution(df):
    """Create ensemble score distribution plot"""
    fig = go.Figure()
    
    # Histogram
    fig.add_trace(go.Histogram(
        x=df['ensemble_score'],
        nbinsx=50,
        name='Score Distribution',
        marker_color='lightblue',
        opacity=0.7
    ))
    
    # Add threshold lines
    fig.add_vline(x=0.7, line_dash="dash", line_color="red", 
                  annotation_text="Threshold (0.7)", annotation_position="top")
    
    fig.update_layout(
        title="Ensemble Score Distribution",
        xaxis_title="Ensemble Score",
        yaxis_title="Count",
        height=400,
        showlegend=True
    )
    
    return fig


def plot_model_contributions(df):
    """Plot individual model score contributions"""
    model_cols = ['autoencoder_score', 'lstm_score', 'rule_score']
    available_cols = [col for col in model_cols if col in df.columns]
    
    if not available_cols:
        st.warning("Model contribution scores not available in dataset")
        return None
    
    # Calculate average scores for each model
    avg_scores = df[available_cols].mean()
    
    fig = go.Figure(data=[
        go.Bar(
            x=[col.replace('_score', '').title() for col in available_cols],
            y=avg_scores.values,
            marker_color=['#1f77b4', '#ff7f0e', '#2ca02c'][:len(available_cols)],
            text=[f"{val:.3f}" for val in avg_scores.values],
            textposition='auto',
        )
    ])
    
    fig.update_layout(
        title="Average Model Contribution Scores",
        xaxis_title="Model Component",
        yaxis_title="Average Score",
        height=400,
        showlegend=False
    )
    
    return fig


def plot_top_risky_consumers(df, n=10):
    """Plot top risky consumers"""
    top_risky = df.nlargest(n, 'ensemble_score')
    
    fig = go.Figure(data=[
        go.Bar(
            y=top_risky['consumer_id'],
            x=top_risky['ensemble_score'],
            orientation='h',
            marker_color=top_risky['ensemble_score'],
            marker_colorscale='Reds',
            text=top_risky['ensemble_score'].round(3),
            textposition='auto',
        )
    ])
    
    fig.update_layout(
        title=f"Top {n} High-Risk Consumers",
        xaxis_title="Ensemble Score",
        yaxis_title="Consumer ID",
        height=400,
        yaxis={'categoryorder':'total ascending'}
    )
    
    return fig


def plot_consumption_patterns(df):
    """Plot consumption patterns from raw data"""
    if 'timestamp' not in df.columns:
        return None
    
    # Convert timestamp to datetime
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Sample a few consumers for visualization
    sample_consumers = df['consumer_id'].unique()[:5]
    
    fig = go.Figure()
    
    for consumer in sample_consumers:
        consumer_data = df[df['consumer_id'] == consumer].sort_values('timestamp')
        fig.add_trace(go.Scatter(
            x=consumer_data['timestamp'],
            y=consumer_data['consumption_kwh'],
            mode='lines',
            name=consumer,
            opacity=0.7
        ))
    
    fig.update_layout(
        title="Sample Consumption Patterns (First 5 Consumers)",
        xaxis_title="Time",
        yaxis_title="Consumption (kWh)",
        height=400,
        hovermode='x unified'
    )
    
    return fig


def plot_hourly_patterns(df):
    """Plot average hourly consumption patterns"""
    if 'timestamp' not in df.columns:
        return None
    
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['hour'] = df['timestamp'].dt.hour
    
    # Separate normal and theft if available
    if 'is_theft' in df.columns:
        hourly_normal = df[df['is_theft'] == 0].groupby('hour')['consumption_kwh'].mean()
        hourly_theft = df[df['is_theft'] == 1].groupby('hour')['consumption_kwh'].mean()
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=hourly_normal.index, y=hourly_normal.values,
            mode='lines+markers', name='Normal Consumers',
            line=dict(color='#2ca02c', width=2)
        ))
        fig.add_trace(go.Scatter(
            x=hourly_theft.index, y=hourly_theft.values,
            mode='lines+markers', name='Theft Consumers',
            line=dict(color='#d62728', width=2)
        ))
    else:
        hourly_avg = df.groupby('hour')['consumption_kwh'].mean()
        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=hourly_avg.index, y=hourly_avg.values,
            mode='lines+markers', name='Average Consumption',
            line=dict(color='#1f77b4', width=2)
        ))
    
    fig.update_layout(
        title="Hourly Consumption Patterns",
        xaxis_title="Hour of Day",
        yaxis_title="Average Consumption (kWh)",
        height=400,
        xaxis=dict(tickmode='linear', tick0=0, dtick=2)
    )
    
    return fig


def plot_confusion_matrix(df):
    """Create confusion matrix if ground truth is available"""
    if 'true_theft_label' not in df.columns or 'ensemble_prediction' not in df.columns:
        return None
    
    # Calculate confusion matrix
    tp = ((df['true_theft_label'] == 1) & (df['ensemble_prediction'] == 1)).sum()
    fp = ((df['true_theft_label'] == 0) & (df['ensemble_prediction'] == 1)).sum()
    tn = ((df['true_theft_label'] == 0) & (df['ensemble_prediction'] == 0)).sum()
    fn = ((df['true_theft_label'] == 1) & (df['ensemble_prediction'] == 0)).sum()
    
    confusion_matrix = np.array([[tn, fp], [fn, tp]])
    
    fig = go.Figure(data=go.Heatmap(
        z=confusion_matrix,
        x=['Predicted Normal', 'Predicted Theft'],
        y=['Actual Normal', 'Actual Theft'],
        text=confusion_matrix,
        texttemplate='%{text}',
        textfont={"size": 20},
        colorscale='Blues',
        showscale=True
    ))
    
    fig.update_layout(
        title="Confusion Matrix",
        height=400,
        xaxis_title="Predicted",
        yaxis_title="Actual"
    )
    
    return fig


def calculate_performance_metrics(df):
    """Calculate and display performance metrics"""
    if 'true_theft_label' not in df.columns or 'ensemble_prediction' not in df.columns:
        return None
    
    tp = ((df['true_theft_label'] == 1) & (df['ensemble_prediction'] == 1)).sum()
    fp = ((df['true_theft_label'] == 0) & (df['ensemble_prediction'] == 1)).sum()
    tn = ((df['true_theft_label'] == 0) & (df['ensemble_prediction'] == 0)).sum()
    fn = ((df['true_theft_label'] == 1) & (df['ensemble_prediction'] == 0)).sum()
    
    accuracy = (tp + tn) / (tp + tn + fp + fn) if (tp + tn + fp + fn) > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Accuracy", f"{accuracy:.3f}")
    col2.metric("Precision", f"{precision:.3f}")
    col3.metric("Recall", f"{recall:.3f}")
    col4.metric("F1-Score", f"{f1:.3f}")
    
    return {'accuracy': accuracy, 'precision': precision, 'recall': recall, 'f1': f1}


def create_consumer_detail_table(df, risk_filter=None):
    """Create detailed consumer table with filtering"""
    display_df = df.copy()
    
    if risk_filter and risk_filter != 'All':
        display_df = display_df[display_df['risk_category'] == risk_filter]
    
    # Select relevant columns
    if 'risk_category' in display_df.columns:
        cols_to_show = ['consumer_id', 'ensemble_score', 'risk_category', 'ensemble_prediction']
        if 'true_theft_label' in display_df.columns:
            cols_to_show.append('true_theft_label')
        
        display_df = display_df[cols_to_show].sort_values('ensemble_score', ascending=False)
    
    return display_df


def check_model_availability():
    """Check if trained models are available locally"""
    required_files = {
        'models': [
            'autoencoder.h5',
            'best_lstm.h5',
            'xgboost_model.joblib',
            'randomforest_model.joblib',
            'isolationforest_model.joblib'
        ],
        'scalers': [
            'standard_scaler.joblib',
            'minmax_scaler.joblib',
            'lstm_scaler.joblib'
        ],
        'outputs': [
            'consumer_risk_scores.csv',
            'evaluation_results.json'
        ]
    }
    
    available_files = {}
    missing_files = {}
    
    for directory, files in required_files.items():
        dir_path = Path(directory)
        available_files[directory] = []
        missing_files[directory] = []
        
        for file in files:
            file_path = dir_path / file
            if file_path.exists():
                available_files[directory].append(file)
            else:
                missing_files[directory].append(file)
    
    # Check if all critical files exist
    has_models = len(missing_files['models']) == 0
    has_scalers = len(missing_files['scalers']) == 0
    has_outputs = len(missing_files['outputs']) == 0
    
    return {
        'has_models': has_models,
        'has_scalers': has_scalers,
        'has_outputs': has_outputs,
        'available_files': available_files,
        'missing_files': missing_files,
        'all_available': has_models and has_scalers and has_outputs
    }


def show_model_status_sidebar(model_status):
    """Display model availability status in sidebar"""
    st.sidebar.markdown("---")
    st.sidebar.header("🤖 Model Status")
    
    if model_status['all_available']:
        st.sidebar.success("✅ All models loaded")
        st.sidebar.caption(f"Models: {len(model_status['available_files']['models'])}")
        st.sidebar.caption(f"Scalers: {len(model_status['available_files']['scalers'])}")
    else:
        st.sidebar.warning("⚠️ Models not found")
        st.sidebar.info("Upload CSV files to visualize results")
        
        with st.sidebar.expander("📥 How to get models"):
            st.markdown("""
            **From Google Colab:**
            1. Train models in Colab
            2. Run the export cell (Section 11)
            3. Download and extract zip files
            
            **Files needed:**
            - `models.zip`
            - `scalers.zip`
            - `outputs.zip`
            
            See `COLAB_INTEGRATION.md` for details.
            """)
            
            # Show what's missing
            for directory, files in model_status['missing_files'].items():
                if files:
                    st.caption(f"❌ Missing in {directory}/: {len(files)} files")


def show_quick_start_sample():
    """Show a sample dataset for users to test the dashboard"""
    st.info("👋 **First time here?** Try uploading a CSV file to get started!")
    
    with st.expander("🎯 Generate Sample Data"):
        st.markdown("""
        Don't have data yet? Generate a sample risk scores CSV to explore the dashboard features.
        """)
        
        if st.button("Generate Sample Risk Scores"):
            # Generate sample data
            np.random.seed(42)
            n_consumers = 100
            
            sample_data = {
                'consumer_id': [f'C{i:03d}' for i in range(n_consumers)],
                'ensemble_score': np.random.beta(2, 5, n_consumers),  # Skewed towards lower scores
                'autoencoder_score': np.random.beta(2, 5, n_consumers),
                'lstm_score': np.random.beta(2, 5, n_consumers),
                'rule_score': np.random.beta(2, 5, n_consumers),
                'ensemble_prediction': np.random.choice([0, 1], n_consumers, p=[0.93, 0.07]),
                'true_theft_label': np.random.choice([0, 1], n_consumers, p=[0.93, 0.07]),
                'detection_date': datetime.now().strftime('%Y-%m-%d')
            }
            
            sample_df = pd.DataFrame(sample_data)
            sample_df['risk_category'] = sample_df['ensemble_score'].apply(categorize_risk)
            
            # Save to temp file
            sample_file = 'sample_risk_scores.csv'
            sample_df.to_csv(sample_file, index=False)
            
            st.success(f"✅ Sample data generated: `{sample_file}`")
            st.info("Upload this file using the sidebar to see the dashboard in action!")
            
            # Show preview
            st.dataframe(sample_df.head(10), use_container_width=True)
            
            # Download button
            csv = sample_df.to_csv(index=False)
            st.download_button(
                label="📥 Download Sample Data",
                data=csv,
                file_name=sample_file,
                mime="text/csv"
            )
            
            return True
    
    return False


# Main application
def main():
    st.markdown('<h1 class="main-header">⚡ Electricity Theft Detection Dashboard</h1>', 
                unsafe_allow_html=True)
    
    # Check model availability
    model_status = check_model_availability()
    
    # Sidebar
    with st.sidebar:
        st.header("📁 Data Upload")
        uploaded_file = st.file_uploader(
            "Upload CSV file",
            type=['csv'],
            help="Upload consumer risk scores CSV or raw consumption data CSV"
        )
        
        # Show model status
        show_model_status_sidebar(model_status)
        
        st.markdown("---")
        st.header("ℹ️ About")
        st.info("""
        This dashboard analyzes electricity consumption patterns and identifies potential theft cases using:
        - **Autoencoder**: Anomaly detection
        - **LSTM**: Pattern forecasting
        - **Rule Engine**: Expert rules
        - **ML Models**: XGBoost, Random Forest
        
        Upload your CSV file to get started!
        """)
        
        st.markdown("---")
        st.markdown("**📊 Supported File Types:**")
        st.markdown("- Consumer risk scores")
        st.markdown("- Raw consumption data")
    
    # Main content
    if uploaded_file is None:
        # Show quick start guide
        show_quick_start_sample()
        
        # Show example of expected data format
        with st.expander("📋 Expected Data Formats"):
            st.markdown("**Risk Scores CSV:**")
            st.code("""
consumer_id,ensemble_score,risk_category,ensemble_prediction,autoencoder_score,lstm_score,rule_score
C001,0.85,Critical,1,0.78,0.82,0.95
C002,0.42,Medium,0,0.38,0.45,0.43
            """)
            
            st.markdown("**Consumption Data CSV:**")
            st.code("""
consumer_id,timestamp,consumption_kwh,is_theft
C001,2024-01-01 00:00:00,2.5,0
C001,2024-01-01 01:00:00,2.1,0
            """)
        
        # Show model status details if models are missing
        if not model_status['all_available']:
            st.markdown("---")
            with st.expander("🔍 Detailed Model Status"):
                col1, col2 = st.columns(2)
                
                with col1:
                    st.markdown("**✅ Available Files:**")
                    for directory, files in model_status['available_files'].items():
                        if files:
                            st.success(f"{directory}/: {len(files)} files")
                
                with col2:
                    st.markdown("**❌ Missing Files:**")
                    for directory, files in model_status['missing_files'].items():
                        if files:
                            st.error(f"{directory}/: {len(files)} files")
                            for file in files[:3]:  # Show first 3
                                st.caption(f"  • {file}")
                            if len(files) > 3:
                                st.caption(f"  • ... and {len(files) - 3} more")
        
        return
    
    # Load data
    df, error = load_data(uploaded_file)
    
    if error:
        st.error(f"Error loading file: {error}")
        return
    
    # Detect file type
    file_type = detect_file_type(df)
    
    if file_type == 'unknown':
        st.error("❌ Unrecognized file format. Please upload consumer risk scores or consumption data.")
        st.write("Your file columns:", list(df.columns))
        return
    
    st.success(f"✅ Loaded {file_type.replace('_', ' ').title()} - {len(df):,} records")
    
    # Create tabs for different views
    if file_type == 'risk_scores':
        tab1, tab2, tab3, tab4 = st.tabs([
            "📊 Overview", 
            "🎯 Risk Analysis", 
            "📈 Model Performance",
            "📋 Consumer Details"
        ])
        
        with tab1:
            st.header("Overview Metrics")
            create_overview_metrics(df, file_type)
            
            st.markdown("---")
            
            col1, col2 = st.columns(2)
            with col1:
                fig = plot_risk_distribution(df)
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                fig = plot_score_distribution(df)
                st.plotly_chart(fig, use_container_width=True)
        
        with tab2:
            st.header("Risk Analysis")
            
            col1, col2 = st.columns([2, 1])
            with col1:
                fig = plot_top_risky_consumers(df, n=15)
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                st.markdown("### Risk Summary")
                risk_counts = df['risk_category'].value_counts()
                for category in ['Critical', 'High', 'Medium', 'Low', 'Minimal']:
                    count = risk_counts.get(category, 0)
                    percentage = (count / len(df)) * 100
                    st.markdown(f"**{category}:** {count} ({percentage:.1f}%)")
            
            st.markdown("---")
            
            # Model contributions
            fig = plot_model_contributions(df)
            if fig:
                st.plotly_chart(fig, use_container_width=True)
        
        with tab3:
            st.header("Model Performance")
            
            if 'true_theft_label' in df.columns:
                st.subheader("Performance Metrics")
                metrics = calculate_performance_metrics(df)
                
                st.markdown("---")
                
                col1, col2 = st.columns(2)
                with col1:
                    fig = plot_confusion_matrix(df)
                    if fig:
                        st.plotly_chart(fig, use_container_width=True)
                
                with col2:
                    st.markdown("### Interpretation")
                    if metrics:
                        st.markdown(f"""
                        - **Accuracy** ({metrics['accuracy']:.1%}): Overall correctness
                        - **Precision** ({metrics['precision']:.1%}): Of predicted thefts, how many are correct
                        - **Recall** ({metrics['recall']:.1%}): Of actual thefts, how many were detected
                        - **F1-Score** ({metrics['f1']:.1%}): Harmonic mean of precision and recall
                        """)
            else:
                st.info("Ground truth labels not available. Upload data with 'true_theft_label' column for performance metrics.")
        
        with tab4:
            st.header("Consumer Details")
            
            col1, col2 = st.columns([1, 3])
            with col1:
                risk_filter = st.selectbox(
                    "Filter by Risk Category",
                    ['All', 'Critical', 'High', 'Medium', 'Low', 'Minimal']
                )
            
            display_df = create_consumer_detail_table(df, risk_filter)
            
            st.dataframe(
                display_df,
                use_container_width=True,
                height=600
            )
            
            # Download filtered data
            csv = display_df.to_csv(index=False)
            st.download_button(
                label="📥 Download Filtered Data",
                data=csv,
                file_name=f"filtered_consumers_{risk_filter}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                mime="text/csv"
            )
    
    elif file_type == 'consumption_data':
        tab1, tab2, tab3 = st.tabs([
            "📊 Overview",
            "📈 Consumption Patterns",
            "📋 Raw Data"
        ])
        
        with tab1:
            st.header("Consumption Data Overview")
            create_overview_metrics(df, file_type)
            
            st.markdown("---")
            
            # Basic statistics
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Min Consumption", f"{df['consumption_kwh'].min():.2f} kWh")
            with col2:
                st.metric("Max Consumption", f"{df['consumption_kwh'].max():.2f} kWh")
            with col3:
                st.metric("Std Dev", f"{df['consumption_kwh'].std():.2f} kWh")
        
        with tab2:
            st.header("Consumption Patterns")
            
            fig = plot_consumption_patterns(df)
            if fig:
                st.plotly_chart(fig, use_container_width=True)
            
            st.markdown("---")
            
            fig = plot_hourly_patterns(df)
            if fig:
                st.plotly_chart(fig, use_container_width=True)
        
        with tab3:
            st.header("Raw Data")
            
            st.dataframe(df, use_container_width=True, height=600)
            
            csv = df.to_csv(index=False)
            st.download_button(
                label="📥 Download Data",
                data=csv,
                file_name=f"consumption_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                mime="text/csv"
            )


if __name__ == "__main__":
    main()
