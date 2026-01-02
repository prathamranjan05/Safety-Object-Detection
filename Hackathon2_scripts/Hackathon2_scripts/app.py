from flask import Flask, request, jsonify, render_template
from ultralytics import YOLO
from PIL import Image
import numpy as np
import io
import os

# ----------------------
# Configuration
# ----------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(
    BASE_DIR,
    "runs",
    "detect",
    "train_full",
    "weights",
    "best.pt"
)

app = Flask(__name__)

# Load YOLO model
model = YOLO(MODEL_PATH)
print("✅ Model loaded successfully!")

# ----------------------
# Routes
# ----------------------
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/predict-image', methods=['POST'])
def predict_image_route():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    try:
        img_bytes = file.read()
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        results = model.predict(source=np.array(image), imgsz=640)
        detections = []

        width, height = image.size

        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls_idx = int(box.cls[0])
                cls_name = model.names[cls_idx]

                detections.append({
                    'class': cls_name,
                    'confidence': conf,
                    'box': [
                        x1 / width,
                        y1 / height,
                        (x2 - x1) / width,
                        (y2 - y1) / height
                    ]
                })

        return jsonify(detections)

    except Exception as e:
        print("Error predicting image:", e)
        return jsonify({'error': str(e)}), 500


@app.route('/predict-frame', methods=['POST'])
def predict_frame_route():
    if 'frame' not in request.files:
        return jsonify([])

    try:
        file = request.files['frame']
        img_bytes = file.read()
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        results = model.predict(source=np.array(image), imgsz=640)
        detections = []

        width, height = image.size

        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls_idx = int(box.cls[0])
                cls_name = model.names[cls_idx]

                detections.append({
                    'class': cls_name,
                    'confidence': conf,
                    'box': [
                        x1 / width,
                        y1 / height,
                        (x2 - x1) / width,
                        (y2 - y1) / height
                    ]
                })

        return jsonify(detections)

    except Exception as e:
        print("Live frame error:", e)
        return jsonify([])


# ----------------------
# Run
# ----------------------
if __name__ == '__main__':
    app.run(debug=True)
