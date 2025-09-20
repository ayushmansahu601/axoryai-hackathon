// ResultsDashboard.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DetectionResult } from "@/types/deepfake";
import detectify from "@/assets/detectifyai.png";

import {
  AlertTriangle,
  CheckCircle,
  Download,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useState } from "react";
import { HeatmapGallery } from "./HeatmapGallery";
import { jsPDF } from "jspdf";
import { createClient } from "@supabase/supabase-js";

// Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ResultsDashboardProps {
  result: DetectionResult;
}

// Helper: Convert URL → Base64
const getBase64ImageFromUrl = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Failed to fetch image:", url, err);
    return null;
  }
};

export const ResultsDashboard = ({ result }: ResultsDashboardProps) => {
  // Confidence & prediction
  const confidence = result.confidence || 0;
  const confidencePercentage = (confidence * 100).toFixed(1);

const handleDownloadReport = async () => {
  try {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    const {
      content_hash,
      avg_real_confidence,
      avg_deepfake_og_confidence,
      avg_deepfake_confidence,
      total_frames,
      prediction,
      inference_time_seconds,
      confidence,
    } = result;

    const confidencePercentage = (confidence * 100).toFixed(1);

    // === Logo on top ===
    const logoBase64 = await getBase64ImageFromUrl(detectify);
    if (logoBase64) {
      const logoWidth = 50;
      const logoHeight = 20;
      doc.addImage(
        logoBase64,
        "PNG",
        pageWidth / 2 - logoWidth / 2,
        currentY,
        logoWidth,
        logoHeight
      );
      currentY += 30;
    }

    // === Title ===
    doc.setFontSize(18).setFont("helvetica", "bold");
    doc.text("Deepfake Detection Report", pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += 12;

    // Metadata
    doc.setFontSize(10).setFont("helvetica", "normal");
    doc.text(`Report Date: ${new Date().toLocaleString()}`, margin, currentY);
    doc.text(`Content Hash: ${content_hash}`, pageWidth - margin, currentY, {
      align: "right",
    });
    currentY += 10;

    // === Detection Result ===
    doc.setFontSize(14).setFont("helvetica", "bold");
    doc.text("Detection Result", margin, currentY);
    currentY += 8;

    doc.setFontSize(12).setFont("helvetica", "normal");
    doc.text(`Prediction: ${prediction}`, margin, currentY);
    doc.text(`Confidence Score: ${confidencePercentage}%`, pageWidth / 2, currentY);
    currentY += 8;

    doc.text(
      `Time Taken: ${inference_time_seconds?.toFixed(2)} secs`,
      margin,
      currentY
    );
    doc.text(`Total Frames: ${total_frames}`, pageWidth / 2, currentY);
    currentY += 12;

    // === Metrics (match ResultsDashboard) ===
    doc.setFontSize(14).setFont("helvetica", "bold");
    doc.text("Detailed Metrics", margin, currentY);
    currentY += 8;

    doc.setFontSize(12).setFont("helvetica", "normal");
    [
      ["Real Score", avg_real_confidence?.toFixed(3)],
      ["DF(From original) Score", avg_deepfake_og_confidence?.toFixed(3)],
      ["DF(Latest) Score", avg_deepfake_confidence?.toFixed(3)],
    ].forEach(([label, value]) => {
      if (value !== undefined) {
        doc.text(`${label}: ${value}`, margin, currentY);
        currentY += 6;
      }
    });

    // === Visuals ===
    if (result.type === "image" && result.image_url) {
      doc.addPage();
      doc.setFontSize(14).setFont("helvetica", "bold");
      doc.text("Analyzed Image", margin, 20);

      const imgData = await getBase64ImageFromUrl(result.image_url);
      if (imgData) {
        doc.addImage(imgData, "PNG", margin, 30, pageWidth - 30, 150);
      }
    } else {
      if (result.heatmap_urls?.length > 0) {
        doc.addPage();
        doc.setFontSize(14).setFont("helvetica", "bold");
        doc.text("Heatmaps", margin, 20);

        let y = 30;
        for (let i = 0; i < result.heatmap_urls.length; i++) {
          const imgData = await getBase64ImageFromUrl(result.heatmap_urls[i]);
          if (imgData) {
            doc.addImage(imgData, "PNG", margin, y, pageWidth - 30, 80);
            y += 90;
            if (y > 250 && i !== result.heatmap_urls.length - 1) {
              doc.addPage();
              y = 30;
            }
          }
        }
      }

      if (result.time_series_plot_url) {
        doc.addPage();
        doc.setFontSize(14).setFont("helvetica", "bold");
        doc.text("Time Series Plot", margin, 20);

        const imgData = await getBase64ImageFromUrl(result.time_series_plot_url);
        if (imgData) {
          doc.addImage(imgData, "PNG", margin, 30, pageWidth - 30, 100);
        }
      }
    }

    // === Save ===
    doc.save(`Deepfake_Report_${content_hash}.pdf`);
  } catch (err) {
    console.error("PDF Generation Failed:", err);
    alert("Failed to generate PDF. Please try again.");
  }
};


  // === Feedback State ===
  const [feedback, setFeedback] = useState("");
  const user_id = localStorage.getItem("user_id");

  const handleFeedback = async (liked: boolean) => {
    if (!user_id || !result.content_hash) {
      alert("User or video info missing.");
      return;
    }
    const userFeedback = liked ? "liked" : "disliked";
    setFeedback(userFeedback);

    const filePath = `${user_id}/${result.content_hash}/${userFeedback}.txt`;
    await supabase.storage
      .from("heatmaps")
      .upload(filePath, new Blob([userFeedback], { type: "text/plain" }));

    await supabase.from("Feedback").insert([
      { id: `${user_id}_${result.content_hash}`, feedback: userFeedback },
    ]);
  };

  // Progress bar color
  const getProgressColor = (confidence: number, prediction:string) => {
    if (prediction == "deepfake_latest" || prediction == "deepfake_og") {
      if (confidence <= 0.3) return "bg-red-300";
      if (confidence <= 0.6) return "bg-red-400";
      if (confidence <= 0.8) return "bg-red-500";
      return "bg-red-600";
    } else {
      if (confidence <= 0.3) return "bg-green-300";
      if (confidence <= 0.6) return "bg-green-400";
      if (confidence <= 0.8) return "bg-green-500";
      return "bg-green-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Detection Summary */}
      <Card className="bg-white border-gray-200 rounded-2xl shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-[#1E1E2F]">
            <span>Detection Result</span>
            <Badge
              variant={result.prediction != "real" ? "destructive" : "default"}
              className={`text-sm ${
                result.prediction != "real" ? "bg-[#E63946] text-white" : "bg-green-600 text-white"
              }`}
            >
             {result.prediction === "deepfake_latest" || result.prediction === "deepfake_og" ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Deepfake
                </>
              ) : result.prediction === "real" && result.confidence!=0 ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Authentic
                </>
              ) : result.confidence===0 ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  No face detected
                </>
              ):(
                <>
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Unknown
                </>
              )}

            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Confidence */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Confidence Score</span>
              <span className="text-2xl font-bold">{confidencePercentage}%</span>
            </div>
            <Progress
              value={confidence * 100}
              className="h-3 bg-gray-200"
              indicatorClassName={getProgressColor(confidence, result.prediction ?? "unknown")}
            />
          </div>
          {result.confidence == 0 ? <p className="text-sm text-gray-500 italic">No face detected.</p> : null}
         <p>
          Time taken for analyzing: {result.inference_time_seconds?.toFixed(2)} secs
        </p>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Real Score:</span>
              <p className="font-semibold">{result.avg_real_confidence?.toFixed(3)}</p>
            </div>
            <div>
              <span className="text-gray-600">DF(From original) Score:</span>
              <p className="font-semibold">{result.avg_deepfake_og_confidence?.toFixed(3)}</p>
            </div>
            <div>
              <span className="text-gray-600">DF(Latest) Score:</span>
              <p className="font-semibold">{result.avg_deepfake_confidence?.toFixed(3)}</p>
            </div>
            <div>
              <span className="text-gray-600">Total Frames:</span>
              <p className="font-semibold">{result.total_frames}</p>
            </div>
          </div>

          {/* Feedback */}
          {!feedback ? (
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => handleFeedback(true)}>
                <ThumbsUp className="h-5 w-5 text-green-600" />
              </Button>
              <Button variant="outline" onClick={() => handleFeedback(false)}>
                <ThumbsDown className="h-5 w-5 text-red-600" />
              </Button>
              <span className="text-sm text-gray-500">Did you like these results?</span>
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic text-center">
              Thank you for your feedback!
            </p>
          )}

          {/* Download Report */}
          <Button
            className="w-full bg-[#E63946] hover:bg-[#E63946]/90 text-white rounded-xl"
            onClick={handleDownloadReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </CardContent>
      </Card>

      {/* Image or Heatmaps */}
      {result.type === "image" ? (
        <img
          src={result.image_url}
          alt="Analyzed Image"
          className="w-full object-contain"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            console.warn("Failed to load image:", target.src);
          }}
        />
      ) : result.heatmap_urls?.length > 0 && result.time_series_plot_url ? (
        <HeatmapGallery
          heatmapUrls={result.heatmap_urls}
          timeseriesplot={result.time_series_plot_url}
        />
      ) : (
        <p className="text-gray-500 text-sm">Loading visualizations...</p>
      )}
    </div>
  );
};
