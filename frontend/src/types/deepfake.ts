
export interface DetectionResult {
  type: 'video' | 'image';
  user_id?: string;
  content_hash?: string;

  // Confidence mapping
  confidence?: number;              // maps backend.prediction_confidence
  confidence_score?: number;       // fallback for legacy cases

  // Frame stats
  avg_real_confidence?: number;
  avg_deepfake_og_confidence?: number;
  avg_deepfake_confidence?: number;

  // Prediction result
  prediction?: string;
  is_deepfake?: boolean;           // derive on frontend (prediction !== "real")

  // Video / processing info
  total_frames?: number;
  frame_confidences?: number[];    // optional, fake-generated
  time_series_plot_url?: string;
  heatmap_urls?: string[];
  video_url?: string;
  raw_json_url?: string;

  // Timing
  inference_time_seconds?: number;  // maps backend.time_taken
  //for image
  image_url?: string;
  time_taken?: number; // time taken to process the image
}


export interface ProcessingStatus {
  stage: 'upload' | 'extracting' | 'detecting' | 'analyzing' | 'generating' | 'complete';
  progress: number;
  message: string;
}
