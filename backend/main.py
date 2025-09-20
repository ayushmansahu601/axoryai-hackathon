
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import time
import random
import hashlib
import traceback
from supabase_utils import upload_to_supabase
from app.predict import threaded_predict, predict_image
from typing import Optional
import uuid
import secrets
from pydantic import BaseModel
from fastapi import Header
from dotenv import load_dotenv
import httpx
from fastapi.security import HTTPBasic,HTTPBasicCredentials, HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends

# Create FastAPI app
app = FastAPI(
    title="Deepfake Detection API",
    version="1.0.0",
    
)

# Configure CORS - Allow all origins for Railway deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.post("/analyze")
async def analyze_file(
    file: UploadFile = File(...),
    content_hash: str = Form(None),
    has_text: bool = Form(False), 
):
    temp_file_path = None

    try:
        print("=== Starting file analysis endpoint ===")
        user_id = "public_user"
        # Allowed types
        allowed_video_types = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm']
        allowed_image_types = ['image/jpeg', 'image/png', 'image/jpg']

        if file.content_type not in allowed_video_types + allowed_image_types:
            raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {', '.join(allowed_video_types + allowed_image_types)}")

        # Check file size (max 100MB)
        file_content = await file.read()
        file_size = len(file_content)
        if file_size > 50 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File size exceeds allowed limit")

        # Save uploaded file temporarily
        suffix = os.path.splitext(file.filename)[1] or ".dat"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_content)
            temp_file_path = tmp.name

        # Generate fallback content_hash if not provided
        if not content_hash:
            content_hash = f"file_{int(time.time())}"

        # === Handle Video ===
        if file.content_type in allowed_video_types:
            results = threaded_predict(temp_file_path, has_text=has_text)

            # Upload confidence plot
            timeseries_url = ""
            timeseries_url_supabase = ""
            try:
                with open(results["confidence_plot"], "rb") as f:
                    base_url = "https://opmkhhuupytffsqsonnk.supabase.co/storage/v1/object/public/heatmaps"
                    folder_url = f"{base_url}/{user_id}/{content_hash}"
                       
                    supabase_path = f"{user_id}/{content_hash}/timeseries.png"
                    timeseries_url_supabase = f"{folder_url}/{supabase_path}"
                    timeseries_url = upload_to_supabase(supabase_path, f.read())
            except Exception as e:
                print(f"Failed to upload confidence plot: {e}")

            # Upload suspicious frames
            suspicious_urls = []
            heatmapurls = []
            for sf in results["suspicious_frames"]:
                try:
                    with open(sf["path"], "rb") as f:
                        base_url = "https://opmkhhuupytffsqsonnk.supabase.co/storage/v1/object/public/heatmaps"
                        folder_url = f"{base_url}/{user_id}/{content_hash}"
                        heatmapurl =  f"{folder_url}/{os.path.basename(sf['path'])}"
                        heatmapurls.append(heatmapurl)
                        supabase_path = f"{user_id}/{content_hash}/{os.path.basename(sf['path'])}"
                        url = upload_to_supabase(supabase_path, f.read())
                        suspicious_urls.append({
                            "frame_index": sf["frame_index"],
                            "confidence": sf["confidence"],
                            "url": url
                        })
                except Exception as e:
                    print(f"Failed to upload suspicious frame {sf['frame_index']}: {e}")

            # Upload original video
            video_url = ""
            try:
                with open(temp_file_path, "rb") as f:
                    supabase_path = f"{user_id}/{content_hash}/video{suffix}"
                    video_url = upload_to_supabase(supabase_path, f.read())
            except Exception as e:
                print(f"Failed to upload original video: {e}")
        #  "confidence_plot": plot_path,
        # "suspicious_frames": suspicious_paths,
        # "avg_real_confidence": avg_real_conf,
        # "avg_deepfake_og_confidence": avg_deepfake_og_conf,
        # "avg_deepfake_latest_confidence": avg_deepfake_latest_conf,
        # "total_frames": len(frame_indices),
        # "final_prediction": final_pred_label,
        # "final_prediction_confidence": final_pred_confidence,
        # "time_taken": end - start
            return {
                "type": "video",
                "content_hash": content_hash,
                "avg_real_confidence": results["avg_real_confidence"],
                "avg_deepfake_og_confidence": results["avg_deepfake_og_confidence"],
                "avg_deepfake_confidence": results["avg_deepfake_latest_confidence"],
                "total_frames": results["total_frames"],
                "timeseries_plot": timeseries_url,
                "heatmap_urls": heatmapurls,
                "file_url": video_url,
                "prediction": results["final_prediction"],
                "prediction_confidence": results["final_prediction_confidence"],
                "time_taken": results["time_taken"],

            }
        

        # === Handle Image ===
        elif file.content_type in allowed_image_types:
            results = predict_image(temp_file_path,  has_text=has_text)

            image_plot_url = ""
            try:
                with open(results["saved_plot"], "rb") as f:
                    supabase_path = f"{user_id}/{content_hash}/prediction_plot.png"
                    image_plot_url = upload_to_supabase(supabase_path, f.read())
            except Exception as e:
                print(f"Failed to upload prediction plot: {e}")

            image_url = ""
            try:
                with open(temp_file_path, "rb") as f:
                    supabase_path = f"{user_id}/{content_hash}/{file.filename}"
                    image_url = upload_to_supabase(supabase_path, f.read())
            except Exception as e:
                print(f"Failed to upload original image: {e}")
            
            return {
                "type": "image",
                "content_hash": content_hash,
                "prediction": results["prediction"],
                "image_url": image_plot_url,
                "file_url": image_url,
                "avg_real_confidence": results["real_confidence"],
                "avg_deepfake_og_confidence": results["deepfake_og_confidence"], 
                "avg_deepfake_confidence": results["deepfake_confidence"],
                "time_taken": results["time_taken"],
                "total_frames":1,
                "prediction_confidence": results["prediction_confidence"],



                #  "type": "video",
                # "content_hash": content_hash,
                # "avg_real_confidence": results["avg_real_confidence"],
                # "avg_deepfake_og_confidence": results["avg_deepfake_og_confidence"],
                # "avg_deepfake_confidence": results["avg_deepfake_latest_confidence"],
                # "total_frames": results["total_frames"],
                # "timeseries_plot": timeseries_url,
                # "heatmap_urls": heatmapurls,
                # "video_url": video_url,
                # "prediction": results["final_prediction"],
                # "prediction_confidence": results["final_prediction_confidence"],
                # "time_taken": results["time_taken"],

            }


    except HTTPException:
        raise
    except Exception as e:
        print("=== UNEXPECTED ERROR in analyze_file ===")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                print(f"Temporary file cleaned up: {temp_file_path}")
            except Exception as e:
                print(f"Failed to clean up temporary file: {e}")




@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "Deepfake Detection API",
        "version": "1.0.0",
        "mode": "mock",
    }

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message":" Welcome to the Deepfake Detection API. Use the /analyze endpoint to analyze videos or images. ",
        "version": "1.0.0",
        "/analyze": "POST endpoint to analyze videos or images.",
        "/health": "GET endpoint for health check.",
        
    }

if __name__ == "__main__":
    import uvicorn
    # Railway provides PORT environment variable
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

