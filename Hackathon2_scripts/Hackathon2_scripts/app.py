from flask import Flask, request, jsonify, render_template
from ultralytics import YOLO
from PIL import Image
import numpy as np
import io

# ----------------------
# Configuration
# ----------------------
MODEL_PATH = r"D:\Hackathon2_scripts\Hackathon2_scripts\runs\detect\train_full\weights\best.pt"
app = Flask(__name__)

# Load YOLO model
model = YOLO(MODEL_PATH)
print("✅ Model loaded successfully!")

# ----------------------
# Routes
# ----------------------
@app.route('/')
def index():
    return render_template('index.html')  # your dashboard HTML

@app.route('/predict-image', methods=['POST'])
def predict_image_route():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    try:
        # Read image
        img_bytes = file.read()
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # Predict
        results = model.predict(source=np.array(image), imgsz=640)  # 640x640 size
        detections = []

        # Parse predictions
        for r in results:
            boxes = r.boxes  # Boxes object
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()  # get box coords
                conf = float(box.conf[0])  # confidence
                cls_idx = int(box.cls[0])  # class index
                cls_name = model.names[cls_idx]  # class name

                # Convert to normalized coordinates (0-1) for frontend bounding boxes
                width, height = image.size
                detections.append({
                    'class': cls_name,
                    'confidence': conf,
                    'box': [
                        x1/width,  # x
                        y1/height, # y
                        (x2-x1)/width,  # w
                        (y2-y1)/height  # h
                    ]
                })

        return jsonify(detections)

    except Exception as e:
        print("Error predicting image:", e)
        return jsonify({'error': str(e)}), 500

# ----------------------
# Run
# ----------------------
if __name__ == '__main__':
    app.run(debug=True)
