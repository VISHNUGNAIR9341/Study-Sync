
import pandas as pd
import numpy as np
import os
import json
import joblib
from sklearn.model_selection import RandomizedSearchCV, train_test_split, KFold
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, RobustScaler
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from improved_predictor import FeatureEngineer

# 1. DETERMINISM
SEED = 42
np.random.seed(SEED)

def train_base_model():
    print("Starting Base Model Training...")
    
    # Paths
    current_dir = os.path.dirname(__file__)
    # Try different locations for the dataset
    possible_paths = [
        os.path.join(current_dir, 'prediction_ready_dataset.csv'),
        '/mnt/data/prediction_ready_dataset.csv',
        os.path.join(current_dir, 'realistic_dataset_2000.csv') # Fallback
    ]
    
    data_path = None
    for p in possible_paths:
        if os.path.exists(p):
            data_path = p
            break
            
    if not data_path:
        raise FileNotFoundError("Could not find prediction_ready_dataset.csv or realistic_dataset_2000.csv")
    
    print(f"Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)
    
    # 2. METADATA & STATS
    # Compute medians for imputation later (though pipeline handles it, we save for reference)
    numeric_cols = ['estimated_size', 'title_length', 'user_experience_level', 'num_pages', 'num_slides', 'num_questions']
    categorical_cols = ['category', 'priority', 'time_of_day', 'day_of_week', 'complexity']
    
    metadata = {
        "medians": df[numeric_cols].median().to_dict(),
        "categories": {col: df[col].unique().tolist() for col in categorical_cols},
        "feature_order": numeric_cols + categorical_cols
    }
    
    os.makedirs(os.path.join(current_dir, 'models'), exist_ok=True)
    with open(os.path.join(current_dir, 'models', 'base_model_metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
        
    # 3. SPLIT DATA
    # We use actual_time_minutes as target
    X = df.drop(columns=['actual_time_minutes'])
    y = df['actual_time_minutes']
    
    # Log transform target for training to handle skewed distribution
    y_log = np.log1p(y)
    
    X_train, X_test, y_train_log, y_test_log = train_test_split(X, y_log, test_size=0.2, random_state=SEED)
    
    # 4. PIPELINE DEFINITION
    # Preprocessing
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', RobustScaler())
    ])

    categorical_transformer = OneHotEncoder(handle_unknown='ignore', sparse_output=False)

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_cols),
            ('cat', categorical_transformer, categorical_cols)
        ],
        remainder='drop' # Drop columns not specified (like title text if present)
    )
    
    # Full Pipeline structure
    # FeatureEngineer first, then ColumnTransformer, then Regressor
    # Note: ColumnTransformer requires specific column names. FeatureEngineer adds columns.
    # To make this work seamlessly, we will apply FeatureEngineer separately or assume it modifies X inplace/returns DF.
    # Our FeatureEngineer returns DataFrame. 
    # BUT sklearn ColumnTransformer applies to the output of previous step.
    # Let's verify: FeatureEngineer takes raw DF -> returns DF with extra cols.
    # Then ColumnTransformer takes that DF.
    # We need to make sure 'num' columns include the NEW derived columns.
    
    derived_cols = ['pages_per_size', 'slides_per_size', 'questions_per_size', 'pages_x_complexity', 'slides_x_complexity', 'complexity_score']
    # Oops, FeatureEngineer maps complexity to score. complexity_score is numeric.
    # We need to add derived_cols to numeric_transformer list.
    
    full_numeric_cols = numeric_cols + derived_cols
    
    # We need a dynamic selector or just list them. 
    # Since FeatureEngineer runs first, these cols will exist.
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, full_numeric_cols),
            ('cat', categorical_transformer, categorical_cols)
        ]
    )
    
    pipeline = Pipeline(steps=[
        ('features', FeatureEngineer()),
        ('preprocessor', preprocessor),
        ('regressor', HistGradientBoostingRegressor(random_state=SEED))
    ])
    
    # 5. HYPERPARAMETER TUNING
    print("Tuning hyperparameters...")
    param_distributions = {
        'regressor__max_iter': [100, 200, 300],
        'regressor__max_depth': [3, 5, 7, 10],
        'regressor__learning_rate': [0.01, 0.05, 0.1],
        'regressor__l2_regularization': [0.0, 0.1, 1.0]
    }
    
    search = RandomizedSearchCV(
        pipeline, 
        param_distributions, 
        n_iter=10, 
        cv=5, 
        scoring='neg_mean_absolute_error', 
        random_state=SEED,
        n_jobs=-1
    )
    
    search.fit(X_train, y_train_log)
    best_model = search.best_estimator_
    print(f"Best params: {search.best_params_}")
    
    # 6. EVALUATION
    print("Evaluating...")
    
    # Predict on Test set
    y_pred_log = best_model.predict(X_test)
    y_pred = np.expm1(y_pred_log)
    y_test = np.expm1(y_test_log)
    
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    
    # Calculate Residuals (in minutes) for Confidence Intervals
    # We compute residuals on the Test set (Simulated 'unseen' data)
    residuals = y_test - y_pred
    residual_std = np.std(residuals)
    
    metrics = {
        "MAE": mae,
        "RMSE": rmse,
        "R2": r2,
        "residual_std": residual_std
    }
    print(f"Metrics: {metrics}")
    
    # 7. SAVE ARTIFACTS
    print("Saving artifacts...")
    joblib.dump(best_model, os.path.join(current_dir, 'models', 'base_model.joblib'))
    
    with open(os.path.join(current_dir, 'models', 'base_model_metrics.json'), 'w') as f:
        json.dump(metrics, f, indent=2)
        
    np.save(os.path.join(current_dir, 'models', 'base_model_residuals.npy'), residuals)
    
    print("Training complete.")

if __name__ == "__main__":
    train_base_model()
