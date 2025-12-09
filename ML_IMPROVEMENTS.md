# ML Prediction Improvements

We have upgraded the task time prediction system from a simple rule-based approach to a **personalized Machine Learning model**.

## 🚀 New Features

1.  **Personalized Learning**: The model now learns from YOUR specific work speed.
2.  **Historical Data**: It uses your completed tasks (actual time vs estimated time) to improve future predictions.
3.  **Smart Fallback**: If there isn't enough data yet, it uses a smarter category-based estimation system.

## 🧠 How It Works

1.  **Data Collection**: As you complete tasks, the system records the `actual_time` it took you.
2.  **Training**: Once you have **3 or more completed tasks**, you can trigger the training process.
3.  **Prediction**: When you create a new task, the model analyzes:
    *   Task Category (Writing, Reading, etc.)
    *   Complexity (Low, Medium, High)
    *   Estimated Size
    *   Additional details (pages, slides, questions)
    *   **YOUR personal speed factor** derived from history.

## 🛠️ Technical Details

*   **Algorithm**: Linear Regression with Feature Scaling (`sklearn`).
*   **Features**: Category, Complexity, Size, Pages, Slides, Questions.
*   **Storage**: User-specific models are saved as `.pkl` files in `ml_service/models/`.

## 📋 How to Use

1.  **Just use the app!** Create tasks and mark them as complete.
2.  **Provide Feedback**: If a task took longer/shorter, update the `manual_time` or let the timer record the `actual_time`.
3.  **Automatic Improvement**: The system is designed to get more accurate the more you use it.

## 🔍 Status Check

You can check the status of your ML model via the API:
`GET /api/ml/status/:userId`

Trigger training manually (if needed):
`POST /api/ml/train/:userId`
