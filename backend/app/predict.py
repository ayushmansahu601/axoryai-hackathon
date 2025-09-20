# 📦 Step 1: Import libraries
import os
import cv2
import numpy as np
import matplotlib.pyplot as plt
from scipy.fftpack import dct
import tempfile
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import easyocr
from collections import defaultdict, Counter
import onnxruntime as ort
import time
import torch
import mediapipe as mp


# Path to your ONNX model
onnx_model_path = os.path.join(os.path.dirname(__file__), "ml_models", "face_crops_best_xgb_model.onnx")
print(onnx_model_path) # Create session
session = ort.InferenceSession(onnx_model_path, providers=["CPUExecutionProvider"])

input_names = [inp.name for inp in session.get_inputs()]
output_names = [out.name for out in session.get_outputs()]
# 🏷️ Step 3: Label mapping
label_map = {0: "real", 1: "deepfake_og", 2: "deepfake_latest"}

# ===============================
# 🔎 Step 5: ONNX Prediction
# ===============================
def onnx_predict_proba(features: np.ndarray):
    outputs = session.run(None, {input_names[0]: features.astype(np.float32)})
    return outputs[1][0]   # probability vector list of dictionory  [{0: 0.05989639461040497, 1: 0.940058708190918, 2: 4.489738785196096e-05}]
                

# ===============================
# 🖼️ Step 6: Image Inference (Updated)
# ===============================
def remove_text(img, conf_threshold=0.25):
    output = img.copy()
    results = reader.readtext(img)
    for (bbox, _, score) in results:
        if score > conf_threshold:
            pts = np.array(bbox).astype(np.int32)
            cv2.fillPoly(output, [pts], (255, 255, 255))
    return output

mp_face_detection = mp.solutions.face_detection
reader = easyocr.Reader(['en'], gpu=True)

# ===============================
# ⚙️ Step 4: Feature Extraction
# ===============================
def extract_beta_vector(img):
    """
    Extract β-vector using blockwise DCT.
    Works for grayscale image or face crop.
    """
    try:
        if isinstance(img, str):  # if path given
            img = cv2.imread(img, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError("Image not found or unreadable.")

        if img.ndim == 3:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        img = cv2.resize(img, (256, 256))
        h, w = img.shape
        beta_vector = []
        all_coeffs = [[] for _ in range(64)]

        for i in range(0, h, 8):
            for j in range(0, w, 8):
                block = img[i:i+8, j:j+8]
                if block.shape != (8, 8):
                    continue
                dct_block = dct(dct(block.T, norm='ortho').T, norm='ortho')
                dct_zigzag = dct_block.flatten()
                for k in range(64):
                    all_coeffs[k].append(dct_zigzag[k])

        for k in range(1, 64):  # skip DC
            coeffs = np.array(all_coeffs[k])
            sigma = np.std(coeffs)
            beta = sigma / np.sqrt(2)
            beta_vector.append(beta)

        return np.array(beta_vector, dtype=np.float32).reshape(1, -1)

    except Exception as e:
        print("❌ Error in feature extraction:", e)
        return None
    

import uuid
def predict_image(image_path, has_text=False, conf_threshold=0.25):
    start = time.time()
    img = cv2.imread(image_path)
    if img is None:
        print("❌ Image not found:", image_path)
        return

    # If text is present (checkbox ticked), mask it
    if has_text:
        img = remove_text(img, conf_threshold)
     # Run face detection
    detector = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = detector.process(rgb_img)
    save_dir = tempfile.mkdtemp()

    if results.detections:
        face_probs, face_betas = [], []
        for detection in results.detections:
            bboxC = detection.location_data.relative_bounding_box
            h, w, c = img.shape
            x, y, bw, bh = int(bboxC.xmin * w), int(bboxC.ymin * h), \
                        int(bboxC.width * w), int(bboxC.height * h)
            face_crop = img[y:y+bh, x:x+bw]

            beta = extract_beta_vector(face_crop)
            beta = beta.astype(np.float32)
            if beta is not None:
                raw_probs = onnx_predict_proba(beta)            #list of dictionory  [{0: 0.05989639461040497, 1: 0.940058708190918, 2: 4.489738785196096e-05}]
                proba = [raw_probs[k] for k in sorted(raw_probs.keys())]
                face_probs.append(proba)
                face_betas.append(beta.flatten())

        if face_probs:
            # Average across all detected faces
            avg_probs = np.mean(face_probs, axis=0)
            pred_class = np.argmax(avg_probs)

            result = {}
            result["prediction"] = label_map[pred_class]
            result["prediction_confidence"] = float(avg_probs[pred_class])
            result["real_confidence"] = float(avg_probs[0])
            result["deepfake_og_confidence"] = float(avg_probs[1])
            result["deepfake_confidence"] = float(avg_probs[2])
            for detection in results.detections:
                bboxC = detection.location_data.relative_bounding_box
                h, w, c = img.shape
                x, y, bw, bh = int(bboxC.xmin * w), int(bboxC.ymin * h), \
                            int(bboxC.width * w), int(bboxC.height * h)
                cv2.rectangle(img, (x, y), (x+bw, y+bh), (0, 255, 0), 2)
            os.makedirs(save_dir, exist_ok=True)
            save_path = os.path.join(save_dir, f"prediction_{uuid.uuid4().hex}.png")

            plt.imshow(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
            plt.title(f"Predicted: {label_map[pred_class]}")
            plt.axis('off')
            plt.savefig(save_path, bbox_inches="tight")
            
            result["saved_plot"] = save_path
        else:
            result = {
                "prediction": "real",
                "real_confidence": 0.0,
                "deepfake_og_confidence": 0.0,
                "deepfake_confidence": 0.0,
                "prediction_confidence": 0.0,
                "saved_plot": None,

                }
    end = time.time()
    result["time_taken"] = end - start

    return result
# response = predict_image('../Screenshot 2025-08-19 214629.png', has_text=False)
# print(response)
# ===============================
# Video Analyzer
# ===============================

def analyze_video(video_path,has_text=False, conf_threshold=0.25):
    start = time.time()
    cap = cv2.VideoCapture(video_path)
    detector = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)

    frame_predictions, frame_confidences, frame_indices = [], [], []
    frame_raw_probs, frame_raw_inputs, suspicious_frames = [], [], []

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"🎥 Total Frames: {total_frames}, FPS: {cap.get(cv2.CAP_PROP_FPS)}")

    num_classes = len(label_map)  # Ensure label_map is defined globally

    idx = 0
    while True:
        ret, frame = cap.read()
        if not ret: break

        frame_face_probs, frame_face_betas = [], []

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = detector.process(rgb_frame)
        if results.detections:
            if has_text:
                frame = remove_text(frame, conf_threshold)

            frame_face_probs, frame_face_betas = [], []
            for detection in results.detections:
                bboxC = detection.location_data.relative_bounding_box
                h, w, c = frame.shape
                x, y, bw, bh = int(bboxC.xmin * w), int(bboxC.ymin * h), \
                               int(bboxC.width * w), int(bboxC.height * h)
                face_crop = frame[y:y+bh, x:x+bw]

                beta = extract_beta_vector(face_crop)
                if beta is not None:
                    raw_probs = onnx_predict_proba(beta)            #list of dictionory  [{0: 0.05989639461040497, 1: 0.940058708190918, 2: 4.489738785196096e-05}]
                    proba = [raw_probs[k] for k in sorted(raw_probs.keys())]
                    frame_face_probs.append(proba)
                    frame_face_betas.append(beta.flatten())

            if frame_face_probs:
                avg_face_probs = np.mean(frame_face_probs, axis=0)
                pred_class = np.argmax(avg_face_probs)

                frame_predictions.append(label_map[pred_class])
                frame_confidences.append(avg_face_probs[pred_class])
                frame_indices.append(idx)
                frame_raw_probs.append(avg_face_probs)
                frame_raw_inputs.append(np.mean(frame_face_betas, axis=0))
            else:
                # Face not usable → push zero vector
                frame_predictions.append("no_face")
                frame_confidences.append(0.0)
                frame_indices.append(idx)
                frame_raw_probs.append(np.zeros(num_classes))
                frame_raw_inputs.append(np.zeros(63))  # match beta dim
        else:
            # No face detected → push zero vector
            frame_predictions.append("no_face")
            frame_confidences.append(0.0)
            frame_indices.append(idx)
            frame_raw_probs.append(np.zeros(num_classes))
            frame_raw_inputs.append(np.zeros(63))

        idx += 1

    cap.release()

    # Convert lists → arrays (safe now)
    frame_raw_probs = np.array(frame_raw_probs)
    frame_raw_inputs = np.array(frame_raw_inputs)

    return frame_indices, frame_predictions, frame_confidences, frame_raw_probs, frame_raw_inputs



# ===============================
# 📊 Step 9: Plotting (Updated)
# ===============================
import os
import tempfile
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.patches import Patch

def plot_confidences(frame_indices, frame_predictions, frame_confidences, frame_raw_probs, label_map):
    fig = plt.figure(figsize=(18, 6))
    gs = fig.add_gridspec(3, 2, width_ratios=[2, 1])

    # -------------------- MAIN PLOT --------------------
    ax_main = fig.add_subplot(gs[:, 0])  # span all 3 rows
    xs, ys, colors = [], [], []
    for i, (pred, conf) in enumerate(zip(frame_predictions, frame_confidences)):
        if pred == "no_face" or conf is None:
            continue
        xs.append(frame_indices[i])
        ys.append(conf)
        colors.append("green" if pred == "real" else "red")

    ax_main.plot(xs, ys, color="black", linewidth=1, label="Confidence line")
    ax_main.scatter(xs, ys, c=colors, s=30)

    # Shade no_face frames
    for i, pred in enumerate(frame_predictions):
        if pred == "no_face":
            ax_main.axvspan(frame_indices[i]-0.5, frame_indices[i]+0.5,
                            color="lightgray", alpha=0.5)

    ax_main.set_xlabel("Frame index")
    ax_main.set_ylabel("Confidence (0 to 1)")
    ax_main.set_title("Binary Deepfake vs Real Confidence per Frame")

    legend_elements = [
        Line2D([0], [0], color="black", label="Confidence line"),
        Line2D([0], [0], marker="o", color="w", markerfacecolor="green", markersize=8, label="Real (dot)"),
        Line2D([0], [0], marker="o", color="w", markerfacecolor="red", markersize=8, label="Deepfake (dot)"),
        Patch(facecolor="lightgray", edgecolor="gray", label="No face detected")
    ]
    ax_main.legend(handles=legend_elements, loc="lower right")

    # -------------------- MINI PLOTS --------------------
    for idx, (label, class_name) in enumerate(label_map.items()):
        ax = fig.add_subplot(gs[idx, 1])
        ax.plot(frame_indices, [p[label] if p is not None else 0 for p in frame_raw_probs],
                label=f"Class: {class_name}")
        ax.set_ylim(0, 1)
        ax.set_ylabel("Prob.")
        ax.set_title(f"Class: {class_name}")
        ax.legend(loc="upper right", fontsize=8)

    fig.tight_layout(rect=[0, 0, 1, 0.97])

    temp_dir = tempfile.mkdtemp()
    save_path = os.path.join(temp_dir, "confidence_plot.png")
    plt.savefig(save_path, bbox_inches="tight")
    plt.close(fig)
    return save_path

# ===============================
# Utility: Convert numpy types to native Python types
# ===============================# ===============================
# Threaded Prediction
# ===============================

def to_python(obj):
    """Convert NumPy types into native Python types for JSON serialization."""
    if isinstance(obj, (np.generic,)):  # np.float32, np.int64, etc.
        return obj.item()
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    return obj

def threaded_predict(file_path, has_text):
    temp_dir = tempfile.mkdtemp()
    start = time.time()

    # ✅ Run inference
    response = analyze_video(file_path)
   
    frame_indices, frame_predictions, frame_confidences, frame_raw_probs, frame_raw_inputs = response

    # ✅ Save confidence plot
    plot_path = plot_confidences(frame_indices, frame_predictions, frame_confidences, frame_raw_probs, label_map)

    # ✅ Collect confidences per label
    label_confidences = {"real": [], "deepfake_og": [], "deepfake_latest": []}
    sum_probs = np.zeros(3)
    count = 0

    for proba in frame_raw_probs:
        sum_probs += proba
        count += 1

    for label, conf in zip(frame_predictions, frame_confidences):
        if label in label_confidences:
            label_confidences[label].append(to_python(conf))

    avg_probs = sum_probs / max(count, 1)
    avg_real_conf = label_confidences["real"] and (sum(label_confidences["real"]) / len(label_confidences["real"])) or 0.0
    avg_deepfake_og_conf = label_confidences["deepfake_og"] and (sum(label_confidences["deepfake_og"]) / len(label_confidences["deepfake_og"])) or 0.0
    avg_deepfake_latest_conf = label_confidences["deepfake_latest"] and (sum(label_confidences["deepfake_latest"]) / len(label_confidences["deepfake_latest"])) or 0.0

    # Determine final prediction
    final_pred_idx = np.argmax(avg_probs)
    final_pred_label = label_map[final_pred_idx]
    final_pred_confidence = float(avg_probs[final_pred_idx])

    # Identify top 10 suspicious frames
    suspicious_frames = [
        (idx, label, conf) for idx, label, conf in zip(frame_indices, frame_predictions, frame_confidences)
        if label != "real"
    ]
    suspicious_frames.sort(key=lambda x: x[2], reverse=True)

    suspicious_paths = []
    cap = cv2.VideoCapture(file_path)
    for rank, (i, label, conf) in enumerate(suspicious_frames[:10], 1):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if ret:
            save_path = os.path.join(temp_dir, f"top_suspicious_{rank}_frame_{i}.png")
            frame = remove_text(frame) if has_text else frame
            cv2.imwrite(save_path, frame)
            suspicious_paths.append({
                "frame_index": int(i),
                "label": label,
                "confidence": float(conf),
                "path": save_path
            })
    cap.release()

    end = time.time()
    print(end-start, 'is total time taken for threaded predict')

    # ✅ Return JSON-safe response
    return {
        "confidence_plot": plot_path,
        "suspicious_frames": suspicious_paths,
        "avg_real_confidence": float(avg_real_conf),
        "avg_deepfake_og_confidence": float(avg_deepfake_og_conf),
        "avg_deepfake_latest_confidence": float(avg_deepfake_latest_conf),
        "total_frames": int(len(frame_indices)),
        "final_prediction": final_pred_label,
        "final_prediction_confidence": float(final_pred_confidence),
        "time_taken": float(end - start)
    }
# ===============================
# Run Test
# # ===============================
# response2 = threaded_predict('../WhatsApp Video 2025-08-24 at 12.59.06_ea28dc29.mp4', has_text=False)
# print(response2)
# res = predict_image('../ayush_pic.png')
# res2 = predict_image('../ayush_side.png')
# print(res,res2)
