
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FrameChartProps {
  frameConfidences: number[];
}


// The `FrameChart` component visualizes per-frame deepfake confidence scores using a line chart built with `recharts`. 
// It takes an array of `frameConfidences` as a prop, where each value represents the deepfake confidence (from 0 to 1) for a video frame. 
// These values are converted to percentages and plotted against their respective frame numbers.

// The chart includes two lines:
// 1. **Confidence Line (Red)** — Displays the AI-predicted deepfake confidence for each frame.
// 2. **Threshold Line (Gray Dashed)** — A constant reference line at 60% to indicate the decision boundary for deepfake detection.

// The `Tooltip` enhances interactivity by showing exact percentages when hovering over data points, clearly labeling each value. Axes are labeled for clarity, and the chart adapts responsively to its container's size.

// This component provides an intuitive and interactive way to interpret AI detection results over the duration of a video, helping users identify specific frames with high deepfake likelihood.

export const FrameChart = ({ frameConfidences }: FrameChartProps) => {
  const data = frameConfidences.map((confidence, index) => ({
    frame: index + 1,
    confidence: confidence * 100,
    threshold: 60 // Default threshold at 60%
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="frame" 
            label={{ value: 'Frame Number', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            label={{ value: 'Confidence (%)', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip 
            formatter={(value, name) => [
              `${Number(value).toFixed(1)}%`, 
              name === 'confidence' ? 'Deepfake Confidence' : 'Threshold'
            ]}
            labelFormatter={(label) => `Frame ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="confidence" 
            stroke="#ef4444" 
            strokeWidth={2}
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
            name="confidence"
          />
          <Line 
            type="monotone" 
            dataKey="threshold" 
            stroke="#94a3b8" 
            strokeDasharray="5 5"
            strokeWidth={1}
            dot={false}
            name="threshold"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
