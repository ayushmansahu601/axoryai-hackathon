
# Deepfake Detection System

A full-stack AI-powered deepfake detection application built with React frontend and FastAPI backend.

## 🎯 Overview

This application allows users to upload videos and analyze them for deepfake content using AI models. The system provides detailed analysis including confidence scores, frame-by-frame analysis, anomaly detection, and visual heatmaps.

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Build Tool**: Vite
- **State Management**: React hooks + TanStack Query
- **File Upload**: react-dropzone
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend (Python FastAPI)
- **Framework**: FastAPI
- **Video Processing**: OpenCV
- **Data Analysis**: NumPy, Matplotlib
- **File Storage**: Supabase Storage
- **Environment**: Python with uvicorn

## 📁 Project Structure

```
src/
├── components/
│   └── deepfake/
│       ├── VideoUpload.tsx          # Video file upload component
│       ├── ProcessingStatus.tsx     # Real-time processing status
│       ├── ResultsDashboard.tsx     # Analysis results display
│       ├── FrameChart.tsx          # Frame confidence visualization
│       └── HeatmapGallery.tsx      # Anomaly heatmap gallery
├── pages/
│   ├── Index.tsx                   # Main entry point
│   ├── DeepfakeDetection.tsx       # Main detection page
│   └── NotFound.tsx               # 404 page
├── types/
│   └── deepfake.ts                # TypeScript interfaces
├── config/
│   └── api.ts                     # API configuration
└── backend/
    ├── main.py                    # FastAPI application
    ├── app/
    │   └── ml_utils.py           # Video processing utilities
    ├── supabase_utils.py         # Supabase integration
    └── requirements.txt          # Python dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- Supabase account (for file storage)

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd src/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Environment Variables
Create a `.env` file in `src/backend/`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔄 Application Flow

### 1. Video Upload
- User drags/drops or selects video file
- File validation (format, size limits)
- Progress tracking during upload

### 2. Processing Pipeline
- **Frame Extraction**: Extract frames from video using OpenCV
- **Mock Analysis**: Generate confidence scores and anomaly detection
- **Heatmap Generation**: Create visual anomaly heatmaps
- **Timeseries Plot**: Generate frame-by-frame analysis chart

### 3. Results Display
- Overall confidence score and classification
- Frame-by-frame confidence chart
- Anomaly heatmaps gallery
- Downloadable analysis report

## 📊 API Endpoints

### POST `/analyze`
Analyzes uploaded video for deepfake content.

**Request:**
- `video`: Video file (multipart/form-data)

**Response:**
```json
{
  "confidence": 0.75,
  "anomaly": 0.23,
  "fake_accuracy": 75.2,
  "real_accuracy": 24.8,
  "total_frames": 150,
  "heatmap_urls": ["url1", "url2", ...],
  "timeseries_plot": "plot_url"
}
```

### GET `/health`
Health check endpoint.

## 🎨 UI Components

### VideoUpload Component
- Drag & drop interface
- File validation and preview
- Upload progress tracking
- Support for multiple video formats

### ProcessingStatus Component
- Real-time processing stages
- Animated progress indicators
- Stage-by-stage status updates

### ResultsDashboard Component
- Confidence score visualization
- Classification badge (Authentic/Deepfake)
- Metrics grid display
- Download report functionality

### FrameChart Component
- Interactive line chart using Recharts
- Frame-by-frame confidence visualization
- Threshold line overlay

## 🔧 Configuration

### API Configuration (`src/config/api.ts`)
```typescript
export const API_CONFIG = {
  BACKEND_URL: 'http://localhost:8000',
  ENDPOINTS: {
    PROCESS_VIDEO: '/analyze',
    HEALTH: '/health'
  }
}
```

### Supported Video Formats
- MP4, AVI, MOV, WMV, FLV, WebM
- Maximum file size: 100MB
- Recommended resolution: 720p or higher

## 🧪 Current Implementation Status

### ✅ Implemented Features
- Video file upload with validation
- Mock deepfake analysis pipeline
- Frame extraction and processing
- Heatmap generation
- Results visualization
- File storage integration
- Responsive UI design

### 🚧 Mock Implementation
Currently using mock data for:
- AI model predictions
- Confidence score calculations
- Anomaly detection
- All analysis is simulated for demonstration

### 🔮 Future Enhancements
- Real AI model integration
- Batch video processing
- User authentication
- Analysis history
- Advanced filtering options
- Real-time streaming analysis

## 🐛 Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Ensure FastAPI server is running on port 8000
   - Check CORS configuration
   - Verify network connectivity

2. **File Upload Errors**
   - Check file format and size limits
   - Verify Supabase configuration
   - Ensure proper environment variables

3. **Processing Timeouts**
   - Large files may take longer to process
   - Check server logs for detailed errors
   - Monitor memory usage during processing

### Development Tips
- Use browser DevTools to monitor network requests
- Check backend logs in terminal for detailed error messages
- Enable verbose logging in development mode

## 📜 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section
- Review the API documentation
