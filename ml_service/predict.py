
import sys
import json
import argparse
import os
from improved_predictor import ImprovedTimePredictor

def predict():
    parser = argparse.ArgumentParser(description='Estimate task duration.')
    parser.add_argument('--input', type=str, help='Path to input JSON file')
    parser.add_argument('--output', type=str, help='Path to output JSON file')
    
    args, unknown = parser.parse_known_args()
    
    # 1. READ INPUT
    data = None
    if args.input:
        try:
            with open(args.input, 'r') as f:
                data = json.load(f)
        except Exception as e:
            print(f"Error reading input file: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        # Read from stdin (Node backend compatibility)
        try:
            input_str = sys.stdin.read()
            if not input_str:
                return # Nothing to do
            data = json.loads(input_str)
        except Exception as e:
            # If standard input is empty or invalid, just exit or print error depending on context
            # For backend integration, silent exit on empty might be safer, but let's log to stderr
            print(f"Error reading stdin: {e}", file=sys.stderr)
            sys.exit(1)

    if not data:
        sys.exit(1)

    # 2. PREDICT
    try:
        user_id = data.get('user_id', 'default')
        predictor = ImprovedTimePredictor(user_id)
        
        # Unpack tuple
        # Returns: (predicted_time, confidence, explanations, explanation_text, model_source, confidence_interval)
        prediction_result = predictor.predict(data)
        
        # Handle unpacking safely in case return signature changes
        if len(prediction_result) == 6:
            predicted_minutes, confidence, explanations, text, source, interval = prediction_result
        else:
            # Fallback for older signature if any
            predicted_minutes = prediction_result[0]
            confidence = prediction_result[1]
            explanations = []
            text = "Prediction"
            source = "unknown"
            interval = [int(predicted_minutes*0.8), int(predicted_minutes*1.2)]
            
        # 3. FORMAT OUTPUT
        output_data = {
            "predicted_minutes": predicted_minutes, # Requirement calls it 'predicted_minutes' (int)
            "predicted_time": predicted_minutes,    # Keep 'predicted_time' for Backend compatibility
            "model_source": source,
            "confidence_interval": interval,
            "explanations": explanations,
            "explanations_text": text,
            "confidence": confidence
        }
        
        # 4. WRITE OUTPUT
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(output_data, f, indent=2)
        else:
            # Stdout for Node backend
            print(json.dumps(output_data))
            
    except Exception as e:
        error_msg = {"error": str(e)}
        print(f"Prediction Error: {e}", file=sys.stderr)
        if args.output:
             with open(args.output, 'w') as f:
                json.dump(error_msg, f)
        else:
            print(json.dumps(error_msg))
        sys.exit(1)

if __name__ == "__main__":
    predict()
