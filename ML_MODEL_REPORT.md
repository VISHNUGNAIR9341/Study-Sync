# Comprehensive ML Model Report for Study-Sync

## 1. Introduction

This report details the internal workings of the Machine Learning (ML) system implemented in "Study-Sync." The system is designed to predict the **Actual Completion Time** of study tasks based on various input parameters. It employs a **hybrid modeling strategy**, combining a robust pre-trained base model with user-specific personalization.

---

## 2. System Architecture

The ML service operates as an independent microservice integrated with the main application via a Node.js backend.

### 2.1 Component Overview
*   **Dataset Layer:** A curated CSV dataset (~2000 records) serving as the knowledge base.
*   **Offline Training Pipeline (`train_base_model.py`):** Processes data and produces the "General Intelligence" model.
*   **Online Prediction Engine (`predict.py`):** A Python script invoked on-demand to generate predictions for user tasks.
*   **Continuous Learning Module (`ml_trainer.py`):** A background process that trains "Personalized Models" for individual users based on their completion history.

---

## 3. The Dataset

The foundation of the model is `generated_dataset_2000_realistic.csv`.

### 3.1 Features (Inputs)
The model consumes structured data characterizing the task and the environment:

| Feature Name | Type | Description |
| :--- | :--- | :--- |
| **Category** | Categorical | The subject (e.g., *Reading, Writing, Project*). |
| **Complexity** | Categorical | Subjective difficulty (*Low, Medium, High*). |
| **Estimated Size** | Numerical | User's rough estimate of magnitude (e.g., *5.0*). |
| **Priority** | Categorical | Urgency (*Low, Medium, Urgent*). |
| **Detailed Metrics** | Numerical | *Num Pages, Num Slides, Num Questions.* |
| **Context** | Categorical | *Time of Day, Day of Week, User Experience Level.* |

### 3.2 Target (Output)
*   **`actual_time_minutes`**: The ground-truth duration required to complete the task.

---

## 4. Algorithmic Approach

The system uses two distinct algorithms to balance **general accuracy** with **personal adaptability**.

### 4.1 Algorithm 1: Histogram-Based Gradient Boosting Regressor
Used for the **Base Model** (General Population).

*   **Why it was chosen:**
    *   It is an ensemble method that builds hundreds of decision trees sequentially.
    *   It natively handles the non-linear relationship between complexity and time (e.g., a "High" complexity task might take 3x longer, not just 1.5x).
    *   It uses "Histogram Binning" ($O(n)$ complexity) to group continuous data into discrete bins (max 255), making training significantly faster and memory-efficient.
*   **How it learns:**
    1.  **Tree 1:** Predicts the average time for all tasks.
    2.  **Tree 2:** Predicts the *error* (residual) of Tree 1.
    3.  **Tree N:** Predicts the error of the combined previous trees.
    *   **Result:** A highly accurate model that minimizes the overall loss function.

### 4.2 Algorithm 2: Linear Regression
Used for the **Personalized Model** (User-Specific).

*   **Why it was chosen:**
    *   Gradient Boosting requires hundreds of data points to be effective. A new user might only have 5 completed tasks.
    *   **Linear Regression** is robust on small datasets. It avoids overfitting (memorizing noise) and simply finds the "trend" of the user's velocity.
*   **How it works:**
    *   It fits a straight line equation: $Time = (\text{Weight} \times \text{Size}) + \text{Bias}$.
    *   It effectively calculates a "User Speed Factor" to scale the baseline predictions up or down.

---

## 5. The Process Pipeline

### 5.1 Step 1: Data Preprocessing & Feature Engineering
Before algorithms see the data, it undergoes transformations in `improved_predictor.py`:

1.  **Derived Features:**
    *   *Complexity Score:* Maps "Low/Medium/High" $\rightarrow$ 1, 2, 3.
    *   *Density Metrics:* Calculates `pages_per_size` to understand information density.
2.  **Imputation:** Missing numerical values (e.g., user left "Pages" blank) are filled with the **Median** of the dataset.
3.  **Normalization (`RobustScaler`):** Scales numerical features using the Interquartile Range (IQR) to make the model immune to extreme outliers (e.g., a 500-page book).
4.  **Encoding (`OneHotEncoder`):** Converts categorical strings (e.g., "Monday") into binary vectors (0, 1) usable by the math models.
5.  **Target Transformation:** The target time is **Log-Transformed** ($\log(1+y)$). This compresses the range of time (handling minute vs. hour tasks better) and ensures predictions are never negative.

### 5.2 Step 2: Training (Hyperparameter Tuning)
For the Base Model, we don't just use default settings. We use **RandomizedSearchCV** to find the optimal configuration:
*   *Learning Rate:* How fast the model learns (e.g., 0.05).
*   *Max Depth:* How deep each decision tree can grow (e.g., 5 levels).
*   *L2 Regularization:* Penalties to prevent complexity.

The system tests random combinations and selects the one with the lowest Mean Absolute Error (MAE).

### 5.3 Step 3: Prediction (Inference)
When a user requests a prediction:
1.  **Load:** The Python script loads the saved model artifacts (`.joblib`).
2.  **Select:** It checks if a *Personalized Model* exists for this user.
    *   *Yes:* Use Linear Regression (Personalized).
    *   *No:* Use HistGradientBoosting (Base).
3.  **Predict:** The model outputs a value.
    *   *Inverse Transform:* If the Base Model was used, the output is in Log-scale. We apply `exp(x) - 1` to convert back to minutes.
4.  **Confidence Interval:** The system looks at the historical error distribution (residuals). It calculates a 90% probably range (e.g., "30-45 mins") based on the 5th and 95th percentiles of past errors.

---

## 6. Continuous Improvement Loop

The system is designed to get smarter over time:
1.  **Feedback:** Every time a user marks a task as "Complete," the actual duration is recorded in the PostgreSQL database.
2.  **Trigger:** Once a user accumulates 5+ completed tasks, the Node.js backend triggers the training script.
3.  **Retrain:** The `LinearRegression` model acts as a "Personal Calibration Layer," learning the user's specific work habits to refine future estimates.

## 7. Summary of Technologies

*   **Language:** Python 3.9+
*   **Main Library:** Scikit-Learn (sklearn)
*   **Data Handling:** Pandas, NumPy
*   **Serialization:** Joblib
*   **Integration:** precise JSON communication via Stdin/Stdout pipes.
