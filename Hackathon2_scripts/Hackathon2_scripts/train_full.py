"""
Full Training Script for YOLOv8 — Duality AI Challenge
Optimized for CPU (longer, stable training for accuracy).
"""

import argparse
from ultralytics import YOLO
import os
import torch

# Default settings (optimized for CPU training)
EPOCHS = 15           # full run for benchmark accuracy
IMGSZ = 640           # standard YOLOv8 input size
MOSAIC = 0.3          # moderate augmentation
MIXUP = 0.1           # light mixup for better generalization
OPTIMIZER = 'AdamW'
MOMENTUM = 0.937
LR0 = 0.001
LRF = 0.01
SINGLE_CLS = False
WORKERS = 2           # CPU safe
PROJECT = "runs/detect"
NAME = "train_full"   # folder name for results

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Full YOLOv8 Training for Duality Challenge")
    parser.add_argument('--epochs', type=int, default=EPOCHS)
    parser.add_argument('--imgsz', type=int, default=IMGSZ)
    args = parser.parse_args()

    this_dir = os.path.dirname(__file__)
    os.chdir(this_dir)

    # Detect device
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"[INFO] Training on device: {device}")

    # Load base model
    model = YOLO(os.path.join(this_dir, "yolov8s.pt"))

    # Train model (full configuration)
    results = model.train(
        data=os.path.join(this_dir, "yolo_params.yaml"),
        epochs=args.epochs,
        imgsz=args.imgsz,
        device=device,
        single_cls=SINGLE_CLS,
        mosaic=MOSAIC,
        mixup=MIXUP,
        optimizer=OPTIMIZER,
        lr0=LR0,
        lrf=LRF,
        momentum=MOMENTUM,
        workers=WORKERS,
        project=PROJECT,
        name=NAME,
        verbose=True
    )

    print("\n✅ Full training completed successfully.")
    print(f"📂 Results saved in: {os.path.join(this_dir, PROJECT, NAME)}")
