
# Technical Documentation

## System Architecture

### Architecture

The frontend follows a modern React architecture with TypeScript:

``` Components Hierarchy:
src
├── components
│   └── deepfake
│       ├── VideoUpload.tsx
│       ├── ProcessingStatus.tsx
│       ├── ResultsDashboard.tsx
│       ├── FrameChart.tsx
│       └── HeatmapGallery.tsx
├── pages
│   ├── Index.tsx
│   ├── DeepfakeDetection.tsx
│   └── NotFound.tsx
├── types
│   └── deepfake.ts
├── config
│   └── api.ts
├── lib
│   ├── supabase.ts
│   └── utils.ts
└── backend
    ├── app
    │   ├── ml_models
    │   │          └── model_with_timeframes..h5
    │   ├── main.py
    │   ├──database.py
    │   ├──final_model_1.py
    │   └──model.py
    ├── supabase_utils.py
    └── requirements.txt

```

### Backend Architecture

The backend uses FastAPI with a simple processing pipeline:

```
Backend Flow:
main.py → final_model.py → supabase_utils.py
   ↓           ↓              ↓
FastAPI   Processing    File Storage
```

## Data Flow

### 1. Upload Phase
```typescript
User selects file → VideoUpload component → FormData creation → API call
```

### 2. Processing Phase
```python
FastAPI receives file → Temporary storage → Frame extraction → Mock analysis → Heatmap generation → Supabase upload
```

### 3. Response Phase
```typescript
API response → Data transformation → UI updates → Results display
```

## Key Interfaces

### DetectionResult Type
```typescript
interface DetectionResult {
  content_hash?: string;
  confidence: number;
  confidence_score?: number;
  anomaly: number;
  fake_accuracy: number;
  real_accuracy: number;
  is_deepfake?: boolean;
  total_frames: number;
  timeseries_plot?: string;
  heatmap_urls: string[];
  raw_json_url?: string;
}
```

### Processing Pipeline Functions

#### Frame Extraction (`process_videos_or_images`)
- Input: Video file path
- Output: NumPy array of frames (64x64 normalized)
- Max frames: 30
- Error handling for corrupted videos

#### Mock Processing (`Threaded_predict`)
- Generates reproducible mock results
- Creates confidence scores (0.4-0.7 range)
- Calculates anomaly scores
- Generates heatmaps and timeseries plots

## File Storage

### Supabase Integration
- Storage bucket: 'heatmaps'
- File path structure: `public/{content_hash}/{filename}`
- Automatic public URL generation
- Error handling for upload failures

## Error Handling

### Frontend Error Handling
```typescript
try {
  // API call
} catch (error) {
  if (error.message.includes('fetch')) {
    // Connection error
  } else {
    // Processing error
  }
  toast({ title: "Error", description: errorMessage });
}
```

### Backend Error Handling
```python
try:
    # Processing logic
except Exception as e:
    print(f"Error: {str(e)}")
    traceback.print_exc()
    raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
```

### final_model_1.py
- Performs the core logic of deepfake detection using deep learning.
- Loads a classification model and an autoencoder.
- Extracts frames, resizes and normalizes them.

- Classification model provides confidence scores for deepfakeness.

- Autoencoder generates residual maps to compute anomaly scores.

- Generates and saves:

- Per-frame heatmaps

- A timeseries plot of confidence scores

- Key Function: process_videos_or_images — called by the API.

- Wrapper: threaded_predict — handles model loading and orchestrates the process.

### main.py
- Serves as the entry point for FastAPI backend.

- Exposes an /analyze POST endpoint to receive video files.

- Performs:

-  File validation

-  Content hashing
- Temporary storage of files

- Invokes threaded_predict for processing

- Returns structured response JSON

- Handles exceptions and logs processing status.

### database.py (Database Connectivity Layer)
(Optional) Manages connection and operations with databases.

Can store detection metadata like timestamps, scores, etc.

### VideoUpload.tsx (Video Upload UI Component)
- Accepts video files via drag-and-drop or file browser.

- Validates file size (≤ 100MB) and video formats (.mp4, .avi, .mov).

- Displays upload progress and disables UI during processing.

- On successful selection, enables "Analyze for Deepfakes" button.

- Calls onVideoUpload to send file to backend.

### ProcessingStatus.tsx (UI Feedback Component)
Displays animated indicators or loading bars during backend processing.

- Helps users understand processing is ongoing.

- Can be conditionally rendered using isProcessing state.

- ResultsDashboard.tsx (Detection Summary Display)
Shows aggregated results like:

- Average confidence

- Fake vs real accuracy

- Anomaly score

- Total number of frames

- Renders values in clean dashboard layout (e.g., cards or badges).

### FrameChart.tsx (Confidence Score Chart)
- Visualizes per-frame deepfake confidence as a line chart (recharts).

- Two lines:

- Red — Per-frame confidence percentage.

- Gray Dashed — 60% decision threshold.

-   Includes tooltips, responsive layout, and axis labels.

- HeatmapGallery.tsx (Heatmap Grid Viewer)
Displays a gallery of heatmaps + timeseries plot.

- Clickable images open in a modal with preview and link.

- Handles loading errors gracefully, logs success/failure.

- Shows badge for total heatmaps and fallback if plot fail



## Performance Considerations

### Frontend Optimization
- React.memo for expensive components
- Lazy loading for large components
- Debounced file upload
- Progress tracking for user feedback

### Backend Optimization
- Temporary file cleanup
- Memory-efficient frame processing
- Async file operations
- Limited frame extraction (30 max)

## Security Measures

### File Validation
- File type restrictions
- Size limits (100MB)
- Extension validation
- MIME type checking

### API Security
- CORS configuration
- Input validation
- Error message sanitization
- Temporary file cleanup

## Development Guidelines

### Code Organization
- Small, focused components (< 50 lines)
- Separation of concerns
- TypeScript for type safety
- Consistent naming conventions

### Testing Strategy
- Component unit tests
- API endpoint testing
- File upload validation
- Error scenario testing

### Deployment Considerations
- Environment variable management
- Build optimization
- Static asset serving
- Database migration strategies

## Dependencies

### Frontend Dependencies
```json
{
  "react": "^18.3.1",
  "react-dropzone": "^14.3.8",
  "recharts": "^2.12.7",
  "lucide-react": "^0.462.0",
  "@tanstack/react-query": "^5.56.2"
}
```

### Backend Dependencies
```txt
fastapi
uvicorn
opencv-python
matplotlib
numpy
supabase
python-dotenv
python-multipart
```

## Configuration Management

### Environment Variables
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- Development vs Production configurations

### Build Configuration
- Vite configuration for development
- TypeScript compiler options
- Tailwind CSS configuration
- PostCSS processing

## Monitoring and Logging

### Frontend Logging
- Console logging for development
- Error tracking for production
- Performance monitoring

### Backend Logging
- Request/response logging
- Error stack traces
- Processing time tracking
- File operation logging

## Future Scalability

### Planned Improvements
- Real AI model integration
- Horizontal scaling capabilities
- Caching strategies
- Database optimization
- CDN integration for static assets

### Architecture Evolution
- Microservices transition
- Queue-based processing
- Real-time WebSocket updates
- Advanced authentication