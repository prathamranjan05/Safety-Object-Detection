# AstraSafe: AI-Powered Space Station Safety Object Detection
🛰️ Event -  
👨‍🚀 Team Name - CODE2AIM
💡 Problem Statement - Safety Object Detection in Confined Space Environments  
📩 Team Leader Email - 

---

🌠 **A Brief of the Prototype**  
![alt text](image.png)
AstraSafe is an AI-powered computer vision system designed to **detect, monitor, and assess safety-critical objects inside space stations**.  

It uses a **custom-trained YOLOv8 model** to automatically identify key safety objects, display confidence scores, and draw bounding boxes over detected objects.  

The platform supports both **live camera feed detection** and **image uploads**, making it ideal for real-time monitoring as well as offline audits.

---

🌍 **Modules Overview**
![alt text](image-2.png)
🧠 1. **Live Camera Feed Detection**
- Uses device camera for **real-time inference**  
- Captures frames every second and predicts safety objects  
- Draws bounding boxes with **object names and confidence scores**  
- Dynamically updates the **Recent Detections** panel  

💡 Simulates continuous safety monitoring for astronauts in mission-critical environments.

☁️ 2. **Image Upload Detection**
![alt text](image-1.png)
- Click or drag-and-drop to upload images  
- Runs YOLOv8 predictions on uploaded images  
- Draws bounding boxes on detected objects  
- Displays **confidence scores** for each detection  

📸 Useful for **offline inspections and safety audits**.

📊 3. **Detection Stats**
- Shows **how well the model performs** during training  
- Key metrics from training:

| Metric | Value | Meaning |
|--------|-------|---------|
| Precision | 0.841 | Accurately identifies safety objects without false positives |
| Recall | 0.682 | Finds most true positives in frames |
| mAP@0.5 | 0.742 | Detection accuracy at 50% IoU |
| mAP@0.5–0.95 | 0.596 | Robustness across stricter IoU thresholds |
| Fitness | 0.596 | Overall balanced performance |

🧠 Interpretation:
- Confidently identifies most safety-critical objects (OxygenTank, Extinguisher, etc.)  
- Good generalization with minimal overfitting  
- Ready for inference & demo

🧩 **Safety Objects Detected**
- OxygenTank  
- NitrogenTank  
- FirstAidBox  
- FireAlarm  
- SafetySwitchPanel  
- EmergencyPhone  
- FireExtinguisher  

✅ Model achieves **strong and competitive detection metrics** for all 7 classes.

---

🧰 **Tech Stack**

| Layer | Technologies |
|-------|-------------|
| Frontend | HTML · CSS · JavaScript · Leaflet.js |
| Backend | Flask |
| AI & ML | YOLOv8 · Ultralytics · NumPy · PIL |

---

👨‍👩‍👧‍👦 **Meet the Team – CODE2AIM**

| Member | Role |
|--------|------|
| Pratham Ranjan | AI/ML Engineer / Backend |
| [Other Members] | [Roles] |

✨ Together, Team CODE2AIM ensures astronaut safety through **AI-powered monitoring systems**.

---

🧩 **Code Execution Instructions**

▶️ **How to Run the Frontend**
```bash
# 1. Clone the Repository
git clone https://github.com/prathamranjan05/Safety-Object-Detection.git
cd Safety-Object-Detection

# 2. Open index.html in browser
# Or serve via simple HTTP server
python -m http.server 8080
