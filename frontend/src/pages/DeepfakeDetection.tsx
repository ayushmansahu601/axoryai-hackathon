// DeepfakeDetection.tsx
import logoImage1 from "@/assets/logo1.png";
import detectify from "@/assets/detectifyai.png";
import { ProcessingStatus } from "@/components/deepfake/ProcessingStatus";
import { ResultsDashboard } from "@/components/deepfake/ResultsDashboard";
import { UploadComponent } from "@/components/deepfake/UploadComponent";
import { API_CONFIG } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import { DetectionResult } from "@/types/deepfake";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { createClient } from "@supabase/supabase-js";

// Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DeepfakeDetection = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hasText, setHasText] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();


  // 🔹 Health check
  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BACKEND_URL}/health`, {
        method: "GET",
        mode: "cors",
        headers: { Accept: "application/json" },
      });
      return response.ok;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  };



  // 🔹 File upload handler (supports video + image)
 const handleFileUpload = async (file: File) => {
  setIsProcessing(true);
  setResult(null);

  try {
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) throw new Error("Backend server unreachable");

    toast({
      title: "Uploading file...",
      description: "Sending file to AI processing server",
    });

    const formData = new FormData();
    formData.append("file", file);

    const fileType = file.type.startsWith("video") ? "video" : "image";
    const contentHash = `${fileType}_${Date.now()}`;
    formData.append("content_hash", contentHash);
    formData.append("type", fileType);
    formData.append("has_text", hasText ? "true" : "false");

    const response = await fetch(
      `${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS.PROCESS_VIDEO}`,
      {
        method: "POST",
        mode: "cors",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server error: ${response.status}`);
    }

    const backendResult = await response.json();
    console.log("Backend result:", backendResult);

    const transformedResult: DetectionResult = {
      type: backendResult.type,
      content_hash: backendResult.content_hash,
      confidence: backendResult.prediction_confidence,
      confidence_score: backendResult.prediction_confidence,
      avg_real_confidence: backendResult.avg_real_confidence,
      avg_deepfake_og_confidence: backendResult.avg_deepfake_og_confidence,
      avg_deepfake_confidence: backendResult.avg_deepfake_confidence,
      prediction: backendResult.prediction,
      is_deepfake: backendResult.prediction !== "real",
      total_frames: backendResult.total_frames || 1,
      frame_confidences: Array.from(
        { length: backendResult.total_frames || 1 },
        () => backendResult.prediction_confidence + (Math.random() - 0.5) * 0.2
      ),
      heatmap_urls: backendResult.heatmap_urls || [],
      image_url: fileType === "image" ? backendResult.image_url : undefined,
      video_url: fileType === "video" ? backendResult.video_url : undefined,
      time_series_plot_url: fileType === "video" ? backendResult.timeseries_plot : undefined,
      raw_json_url: "",
      inference_time_seconds: backendResult.time_taken,
    };

    setResult(transformedResult);
    toast({
      title: `Analysis Completed in ${backendResult.time_taken.toFixed(2)}s`,
      description: `Prediction: ${backendResult.prediction} with ${(backendResult.prediction_confidence * 100).toFixed(1)}% confidence.`,
    });
  } catch (error) {
    console.error("Processing error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message.includes("Failed to fetch") || error.name === "TypeError"
          ? `Cannot connect to backend at ${API_CONFIG.BACKEND_URL}`
          : "No face detected or file invalid"
        : "An unknown error occurred";

    toast({
      title: "Processing Failed",
      description: errorMessage,
      variant: "destructive",
    });
  } finally {
    setIsProcessing(false);
  }
};


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-[#e2f0ee] font-[Poppins]">
      {/* 🔹 Header */}
      <header className="bg-white border-b border-gray-400 p-4 sticky top-0 z-10">
        <div className="relative max-w-6xl mx-auto flex items-center justify-between">
          {/* Left Logo */}
          <div className="flex-shrink-0">
            <Link to="/">
              <img src={logoImage1} alt="Company Logo" className="h-14 w-auto" />
            </Link>
          </div>

          {/* Centered Logo + Title */}
          <div className="absolute left-1/2 transform -translate-x-1/2 text-center flex flex-col items-center">
            <img
              src={detectify}
              alt="DetectifAI Logo"
              className="h-16 w-auto mb"
            />
            <p className="text-sm text-gray-600">
              Advanced AI-powered media authenticity analysis
            </p>
          </div>

        
        </div>
      </header>

      {/* 🔹 Main Section */}
      <main className="p-6 bg-white rounded-lg mx-4 md:mx-auto md:max-w-6xl mt-6">
        <div className="space-y-10">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-[#1E1E2F] mb-2 font-[Poppins]">
              Upload a video or image to analyze for synthetic media
            </h2>
            <p className="text-sm text-gray-500">Axory AI Private Limited</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <UploadComponent
                onFileUpload={handleFileUpload}
                isProcessing={isProcessing}
              />
             <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">Does the video contain text?</label>
              <button
                onClick={() => {
                  const newValue = !hasText;
                  setHasText(newValue);

                  if (newValue) {
                    toast({
                      title: "Longer Processing Time",
                      description: "Since the video contains text, analysis may take more time.",
                      variant: "default",
                    });
                  }
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                  hasText ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    hasText ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>


              {isProcessing && <ProcessingStatus />}
            </div>


            <div className="space-y-6">
              {result && <ResultsDashboard result={result} />}
            </div>
          </div>
        </div>
      </main>
{result && result.type === "video" && result.time_series_plot_url && (  
  <div className="mt-8 p-4 mx-auto md:max-w-6xl bg-white rounded-lg shadow">
    <h2 className="text-lg font-medium mb-4">📈 Timeseries Plot:</h2>
    <img
      src={result.time_series_plot_url}
      alt="Timeseries Plot"
      className="w-full max-h-[600px] object-contain rounded-md border"
      loading="lazy"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        console.warn("Failed to load image:", target.src);
      }}
    />
  </div>
)}


      {/* 🔹 Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white p-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs text-gray-500">
            Powered by{" "}
            <span className="text-[#1E1E2F] font-medium">Axory AI</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DeepfakeDetection;
