import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import pickle
import os

def train_model():
    print("Loading training data...")
    # Load the dataset
    df = pd.read_csv('training_data.csv')
    
    print(f"Dataset loaded: {len(df)} rows")
    print(f"Categories: {df['category'].unique()}")
    
    # Feature engineering
    print("\nPreparing features...")
    
    # One-hot encode categorical variables
    df_encoded = pd.get_dummies(df, columns=['category', 'priority', 'time_of_day', 'day_of_week', 'complexity'])
    
    # Separate features and target
    X = df_encoded.drop('actual_time_minutes', axis=1)
    y = df_encoded['actual_time_minutes']
    
    print(f"Features: {X.shape[1]} columns")
    print(f"Target: {y.name}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"\nTraining set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    
    # Train Random Forest model
    print("\nTraining Random Forest model...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate model
    print("\nEvaluating model...")
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)
    
    train_mae = mean_absolute_error(y_train, train_pred)
    test_mae = mean_absolute_error(y_test, test_pred)
    train_r2 = r2_score(y_train, train_pred)
    test_r2 = r2_score(y_test, test_pred)
    
    print(f"\nTraining MAE: {train_mae:.2f} minutes")
    print(f"Test MAE: {test_mae:.2f} minutes")
    print(f"Training R²: {train_r2:.3f}")
    print(f"Test R²: {test_r2:.3f}")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\nTop 10 Most Important Features:")
    print(feature_importance.head(10))
    
    # Save the model
    print("\nSaving model...")
    with open('time_predictor_model.pkl', 'wb') as f:
        pickle.dump({
            'model': model,
            'feature_columns': X.columns.tolist()
        }, f)
    
    print("Model saved as 'time_predictor_model.pkl'")
    
    # Test predictions
    print("\nSample Predictions:")
    for i in range(min(5, len(X_test))):
        actual = y_test.iloc[i]
        predicted = test_pred[i]
        error = abs(actual - predicted)
        print(f"  Actual: {actual:.0f} min, Predicted: {predicted:.0f} min, Error: {error:.0f} min")
    
    return model, X.columns.tolist()

if __name__ == "__main__":
    print("=" * 60)
    print("ML Time Predictor - Model Training")
    print("=" * 60)
    
    try:
        model, features = train_model()
        print("\n" + "=" * 60)
        print("Training completed successfully!")
        print("=" * 60)
    except Exception as e:
        print(f"\nError during training: {e}")
        import traceback
        traceback.print_exc()
