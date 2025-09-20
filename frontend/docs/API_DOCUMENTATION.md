
# API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication
Currently no authentication required. Future versions will implement JWT tokens.

## Endpoints

### POST /analyze
Analyzes a video file for deepfake content.

#### Request
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Body**: 
  - `video` (file): Video file to analyze

#### Supported Formats
- MP4, AVI, MOV, WMV, FLV, WebM
- Maximum size: 100MB
- Recommended: 720p resolution or higher

#### Response
```json
{
  "confidence": 0.65,
  "anomaly": 0.23,
  "fake_accuracy": 65.2,
  "real_accuracy": 34.8,
  "total_frames": 150,
  "heatmap_urls": [
    "https://supabase-url/storage/v1/object/public/heatmaps/public/video_123/residual_0.png",
    "https://supabase-url/storage/v1/object/public/heatmaps/public/video_123/residual_1.png"
  ],
  "timeseries_plot": "https://supabase-url/storage/v1/object/public/heatmaps/public/video_123/timeseries.png"
}
```

#### Response Fields
- `confidence` (float): Overall deepfake confidence (0.0-1.0)
- `anomaly` (float): Anomaly detection score (0.0-1.0)
- `fake_accuracy` (float): Percentage accuracy for fake classification
- `real_accuracy` (float): Percentage accuracy for real classification
- `total_frames` (int): Number of frames analyzed
- `heatmap_urls` (array): URLs to generated heatmap images
- `timeseries_plot` (string): URL to timeseries analysis plot

#### Error Responses

**400 Bad Request**
```json
{
  "detail": "Invalid file format. Supported formats: MP4, AVI, MOV, WMV, FLV, WebM"
}
```

**413 Payload Too Large**
```json
{
  "detail": "File size exceeds maximum limit of 100MB"
}
```

**500 Internal Server Error**
```json
{
  "detail": "Processing failed: Unable to extract frames from video"
}
```




### get /results
generates the heatmaps and timeseriesplot graph urls
#### Request
- **Method**: POST
- **Content-Type**: multipart/form-data
- **Body**: 
  - `video` (file): Video file to analyze

#### Supported Formats
- MP4, AVI, MOV, WMV, FLV, WebM
- Maximum size: 100MB
- Recommended: 720p resolution or higher

#### Response
```json
{
  "confidence": 0.65,
  "anomaly": 0.23,
  "fake_accuracy": 65.2,
  "real_accuracy": 34.8,
  "total_frames": 150,
  "heatmap_urls": [
    "https://supabase-url/storage/v1/object/public/heatmaps/public/video_123/residual_0.png",
    "https://supabase-url/storage/v1/object/public/heatmaps/public/video_123/residual_1.png"
  ],
  "timeseries_plot": "https://supabase-url/storage/v1/object/public/heatmaps/public/video_123/timeseries.png"
}
```

#### Response Fields
- `confidence` (float): Overall deepfake confidence (0.0-1.0)
- `anomaly` (float): Anomaly detection score (0.0-1.0)
- `fake_accuracy` (float): Percentage accuracy for fake classification
- `real_accuracy` (float): Percentage accuracy for real classification
- `total_frames` (int): Number of frames analyzed
- `heatmap_urls` (array): URLs to generated heatmap images
- `timeseries_plot` (string): URL to timeseries analysis plot

#### Error Responses

**400 Bad Request**
```json
{
  "detail": "Invalid file format. Supported formats: MP4, AVI, MOV, WMV, FLV, WebM"
}
```

**413 Payload Too Large**
```json
{
  "detail": "File size exceeds maximum limit of 100MB"
}
```

**500 Internal Server Error**
```json
{
  "detail": "Processing failed: Unable to extract frames from video"
}
```


### GET /health
Health check endpoint to verify server status.

#### Request
- **Method**: GET
- **Parameters**: None

#### Response
```json
{
  "status": "ok"
}
```

## Processing Pipeline

### Step 1: Frame Extraction
- Extracts up to 30 frames from the video
- Resizes frames to 64x64 pixels
- Normalizes pixel values (0.0-1.0)

### Step 2: Mock Analysis
- Generates reproducible confidence scores
- Calculates reconstruction errors
- Determines anomaly scores

### Step 3: Visualization Generation
- Creates heatmap comparisons (original vs reconstructed vs anomaly)
- Generates timeseries plot of frame-by-frame analysis
- Saves all visualizations as PNG files

### Step 4: File Storage
- Uploads generated images to Supabase storage
- Returns public URLs for frontend access
- Cleans up temporary files

## Rate Limiting
Currently no rate limiting implemented. Production version will include:
- 10 requests per minute per IP
- 100MB total upload per hour per IP

## Error Handling
All errors return appropriate HTTP status codes with descriptive messages:
- Client errors (4xx): Invalid requests, unsupported formats
- Server errors (5xx): Processing failures, storage issues

## Example Usage

### cURL
```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "video=@sample_video.mp4"
```

### JavaScript (Fetch)
```javascript
const formData = new FormData();
formData.append('video', videoFile);

const response = await fetch('http://localhost:8000/analyze', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

### Python (Requests)
```python
import requests

with open('video.mp4', 'rb') as f:
    files = {'video': f}
    response = requests.post('http://localhost:8000/analyze', files=files)
    result = response.json()
```

## WebSocket Support (Future)
Planned WebSocket endpoint for real-time processing updates:
```
ws://localhost:8000/ws/analyze/{session_id}
```

## Versioning
Current version: v1
Future versions will be available at `/v2/`, `/v3/`, etc.
