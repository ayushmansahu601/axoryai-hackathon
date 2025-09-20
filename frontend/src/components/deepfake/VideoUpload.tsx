// VideoUpload
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Video, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface VideoUploadProps {
  onVideoUpload: (file: File) => void;
  isProcessing: boolean;
}

export const VideoUpload = ({ onVideoUpload, isProcessing }: VideoUploadProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      // Simulate upload progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm']
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: isProcessing
  });

  const handleAnalyze = () => {
    if (selectedFile) {
      onVideoUpload(selectedFile);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-4">
            {selectedFile ? (
              <Video className="h-12 w-12 text-green-500" />
            ) : (
              <Upload className="h-12 w-12 text-gray-400" />
            )}
            
            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                {uploadProgress < 100 && (
                  <Progress value={uploadProgress} className="w-64" />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive ? 'Drop video here' : 'Upload video file'}
                </p>
                <p className="text-sm text-gray-500">
                  Drag & drop or click to select (MP4, AVI, MOV, etc.)
                </p>
                <p className="text-xs text-gray-400">
                  Max file size: 100MB
                </p>
              </div>
            )}
          </div>
        </div>

        {fileRejections.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700">
                {fileRejections[0].errors[0].message}
              </p>
            </div>
          </div>
        )}

        {selectedFile && uploadProgress === 100 && !isProcessing && (
          <div className="mt-6">
            <Button 
              onClick={handleAnalyze}
              className="w-full"
              size="lg"
            >
              Analyze for Deepfakes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
