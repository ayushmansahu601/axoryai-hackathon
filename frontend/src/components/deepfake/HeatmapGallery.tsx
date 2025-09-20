
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Flame, Maximize2, AlertCircle, ExternalLink } from "lucide-react";

interface HeatmapGalleryProps {
  heatmapUrls: string[];
  timeseriesplot: string;
}

// The `HeatmapGallery` component displays a grid of heatmap images and a timeseries plot related to deepfake detection analysis. 
// It accepts an array of `heatmapUrls` and a `timeseriesplot` URL as props. Each heatmap is rendered inside a `Dialog`, 
// allowing users to click and view a larger version in a modal. The component manages image loading errors using an `imageErrors` 
// state to provide fallbacks for failed images, and it logs image load success and failure events for debugging.

// A badge shows the total number of heatmaps. On image click, if the image loads successfully, 
// it opens in a preview modal with descriptive text and an option to open it in a new tab. If loading fails,
//  a graceful error UI is displayed with a retry URL. Below the grid, the timeseries plot is shown in a bordered section with a 
// fallback default image in case it fails to load.

// The component enhances the debugging experience with detailed console logs and user feedback through color-coded states 
// and accessible links. It is visually responsive and designed for clear, informative visualization of AI-generated analysis outputs.


export const HeatmapGallery = ({ heatmapUrls, timeseriesplot }: HeatmapGalleryProps) => {
  const [selectedHeatmap, setSelectedHeatmap] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  useEffect(() => {
  console.log("Updated props in HeatmapGallery:");
  console.log("heatmapUrls:", heatmapUrls);
  console.log("timeseriesplot:", timeseriesplot);
}, [heatmapUrls, timeseriesplot]);

  console.log("in heatmapgallary");
const handleImageError = (index: number) => {
  try {
    console.error(`Failed to load heatmap ${index + 1}:`, heatmapUrls[index]);
    setImageErrors(prev => new Set([...prev, index]));
  } catch (error) {
    console.error("Error in handleImageError:", error);
  }
};
const handletimeseriesimageError = () => {
  try {
    console.error(`Failed to load timeseries plot:`, timeseriesplot);
    
  } catch (error) {
    console.error("Error in handleImageError:", error);
  }
};

const handleImageLoad = (index: number) => {
  try {
    console.log("Problem loading image in heatmap gallery");
    console.log(`Successfully loaded heatmap ${index + 1}:`, heatmapUrls[index]);
  } catch (error) {
    console.error("Error in handleImageLoad:", error);
  }
};

  return (<>
  
    <Card className="w-full rounded=2xl">
      
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 bg-white border-gray-200 rounded-2xl px-3 py-2">
  <span className="text-lg"></span>
  <span>📌 Top deepfake confidence frames</span>
  <Badge variant="secondary">{heatmapUrls.length} images</Badge>
</CardTitle>

      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-2xl">
          {heatmapUrls.map((url, index) => (
            <Dialog key={index}>
              <DialogTrigger asChild>
                <div 
                  className="relative group cursor-pointer rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
                  onClick={() => setSelectedHeatmap(url)}
                >
                  <div className="aspect-square">
                    {imageErrors.has(index) ? (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Failed to load</p>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center justify-center mt-1"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View URL
                          </a>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={url}
                        alt={`Heatmap ${index + 1}`}
                        className="w-full h-full object-cover color-green"
                        onError={() => handleImageError(index)}
                        onLoad={() => handleImageLoad(index)}
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    Frame {index + 1}
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Heatmap Analysis - Frame {index + 1}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="aspect-video rounded-2xl overflow-hidden">
                    {selectedHeatmap && !imageErrors.has(index) ? (
                      <img
                        src={selectedHeatmap}
                        alt={`Heatmap ${index + 1}`}
                        className="w-full h-full object-contain"
                        onError={() => handleImageError(index)}
                        onLoad={() => handleImageLoad(index)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <Flame className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                          <p className="text-lg font-medium">Heatmap Visualization</p>
                          <p className="text-sm text-gray-600 mt-2">
                            Image could not be loaded
                          </p>
                          {selectedHeatmap && (
                            <a 
                              href={selectedHeatmap} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline flex items-center justify-center mt-2"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Open in new tab
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
       
      
         
      </CardContent>
      
    </Card>
    
    </>
  );
};
