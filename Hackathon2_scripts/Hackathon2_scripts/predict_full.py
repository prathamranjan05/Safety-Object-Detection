from ultralytics import YOLO
from pathlib import Path
import os
import yaml
import time
import torch
from collections import Counter

if __name__ == "__main__":
    start_time = time.time()

    this_dir = Path(__file__).parent
    os.chdir(this_dir)

    # ✅ Load YOLO config file
    with open(this_dir / 'yolo_params.yaml', 'r') as file:
        data = yaml.safe_load(file)
        if 'test' not in data or data['test'] is None:
            raise ValueError("Add 'test:' field in yolo_params.yaml with path to test images")

    test_images_dir = Path(data['test']) / 'images'
    if not test_images_dir.exists() or not any(test_images_dir.iterdir()):
        raise FileNotFoundError(f"❌ Test images directory {test_images_dir} is missing or empty")

    # ✅ Get the latest trained model
    detect_path = this_dir / "runs" / "detect"
    train_folders = sorted([f for f in os.listdir(detect_path) if f.startswith("train")], reverse=True)
    if not train_folders:
        raise ValueError("❌ No training folders found in runs/detect")

    model_path = detect_path / train_folders[0] / "weights" / "best.pt"
    print(f"[INFO] Using trained model weights: {model_path}")

    # ✅ Load model
    model = YOLO(model_path)

    # ✅ Run inference (explicit stream loop)
    print("[INFO] Running full inference on test dataset...")

    results_gen = model.predict(
        source=str(test_images_dir),
        imgsz=640,
        conf=0.25,
        iou=0.45,
        device='cuda' if torch.cuda.is_available() else 'cpu',
        save=True,
        save_txt=True,
        save_conf=True,
        project=str(detect_path),
        name="predict_full",
        exist_ok=True,
        verbose=False,
        stream=True  # generator mode
    )

    class_counts = Counter()
    total_images = 0

    # ✅ Iterate through each result (this was missing earlier)
    for r in results_gen:
        total_images += 1
        if r.boxes is not None and len(r.boxes.cls) > 0:
            labels = [int(cls) for cls in r.boxes.cls.cpu().numpy()]
            class_counts.update(labels)
            img_name = Path(r.path).name
            detected = [model.names[int(c)] for c in labels]
            print(f"🖼️ {img_name}: {', '.join(detected)}")
        else:
            print(f"🖼️ {Path(r.path).name}: No detections")

    # ✅ Print summary
    print("\n📊 Detection Summary:")
    if class_counts:
        for cls_id, count in sorted(class_counts.items()):
            cls_name = model.names.get(cls_id, f"class_{cls_id}")
            print(f" - {cls_name:<20}: {count} detections")
    else:
        print("⚠️ No objects detected in any test image.")

    print(f"\n✅ Processed {total_images} images in {time.time() - start_time:.2f}s")
    print(f"📁 Results saved in: {detect_path / 'predict_full'}")
