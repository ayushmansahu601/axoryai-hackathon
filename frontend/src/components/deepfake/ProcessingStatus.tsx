
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Video, Eye, Brain, Image } from "lucide-react";

const processingStages = [
  { id: 'extracting', label: 'Extracting frames', icon: Video, duration: 2000 },
  { id: 'detecting', label: 'Detecting faces', icon: Eye, duration: 1500 },
  { id: 'analyzing', label: 'AI analysis', icon: Brain, duration: 3000 },
  { id: 'generating', label: 'Generating heatmaps', icon: Image, duration: 2000 }
];


// The `ProcessingStatus` component visually represents the multi-step progress 
// of deepfake video analysis. It defines four sequential stages—frame extraction,
//  face detection, AI analysis, and heatmap generation—each with an associated icon and duration.
//  Using `useEffect`, it starts a timer upon component mount, incrementally updating a progress bar and
//  switching stages based on elapsed time. The `currentStage` index determines which stage is active,
//  while completed stages are shown with different background and icon colors for intuitive visual feedback. 
// As the process runs, the UI dynamically highlights the current step with animations like a spinning loader and pulsing icons.
//  Once all stages complete, the progress bar reaches 100%, and the interval clears. 
// This component enhances the user experience by simulating real-time feedback and giving users 
// clear visibility into what part of the analysis is currently running.

export const ProcessingStatus = () => {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = processingStages.reduce((sum, stage) => sum + stage.duration, 0);
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 100;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);

      // Update current stage based on elapsed time
      let cumulativeDuration = 0;
      for (let i = 0; i < processingStages.length; i++) {
        cumulativeDuration += processingStages[i].duration;
        if (elapsed <= cumulativeDuration) {
          setCurrentStage(i);
          break;
        }
      }

      if (elapsed >= totalDuration) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Processing Video</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Progress value={progress} className="w-full" />
        
        <div className="space-y-4">
          {processingStages.map((stage, index) => {
            const Icon = stage.icon;
            const isActive = index === currentStage;
            const isCompleted = index < currentStage;
            
            return (
              <div
                key={stage.id}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 border border-blue-200' 
                    : isCompleted 
                      ? 'bg-green-50' 
                      : 'bg-gray-50'
                }`}
              >
                <Icon 
                  className={`h-5 w-5 ${
                    isActive 
                      ? 'text-blue-600 animate-pulse' 
                      : isCompleted 
                        ? 'text-green-600' 
                        : 'text-gray-400'
                  }`} 
                />
                <span 
                  className={`font-medium ${
                    isActive 
                      ? 'text-blue-900' 
                      : isCompleted 
                        ? 'text-green-900' 
                        : 'text-gray-600'
                  }`}
                >
                  {stage.label}
                </span>
                {isActive && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 ml-auto" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
