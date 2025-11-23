import { useState } from 'react';
import { CNNVisualization } from '@/components/CNNVisualization';
import { DrawingCanvas } from '@/components/DrawingCanvas';
import { OutputVisualization } from '@/components/OutputVisualization';
import { ConfidenceTrend } from '@/components/ConfidenceTrend';
import { ActivationHeatmap } from '@/components/ActivationHeatmap';
import { StatusIndicators } from '@/components/StatusIndicators';
import { useMNISTModel } from '@/hooks/useMNISTModel';
import { toast } from 'sonner';

const Index = () => {
  const { model, isLoading: modelLoading, predict } = useMNISTModel();
  
  const [predictions, setPredictions] = useState([
    { class: '7', probability: 0.0 },
    { class: '1', probability: 0.0 },
    { class: '2', probability: 0.0 },
    { class: '3', probability: 0.0 },
    { class: '9', probability: 0.0 },
    { class: '4', probability: 0.0 },
    { class: '5', probability: 0.0 },
    { class: '0', probability: 0.0 },
  ]);

  const [confidenceHistory, setConfidenceHistory] = useState([
    { timestamp: '0s', confidence: 0 },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);

  const [heatmapData, setHeatmapData] = useState(() => {
    return Array(28).fill(null).map(() => 
      Array(28).fill(null).map(() => Math.random())
    );
  });

  const [topNodes] = useState([
    { layer: 'Conv2', node: 42, contribution: 0.89 },
    { layer: 'Dense1', node: 108, contribution: 0.76 },
    { layer: 'Conv1', node: 23, contribution: 0.68 },
    { layer: 'Dense2', node: 54, contribution: 0.61 },
    { layer: 'Pool2', node: 18, contribution: 0.55 },
  ]);

  const handlePredict = async (imageData) => {
    if (!model) {
      toast.error('Model is still loading, please wait...');
      return;
    }

    setIsProcessing(true);
    setIsPredicting(true);
    
    try {
      const newPredictions = await predict(imageData);
      
      if (newPredictions.length > 0) {
        setPredictions(newPredictions);
        
        const now = new Date();
        const timestamp = `${now.getMinutes()}:${now.getSeconds()}`;
        setConfidenceHistory(prev => [
          ...prev.slice(-9),
          { timestamp, confidence: newPredictions[0].probability * 100 },
        ]);

        const canvas = document.createElement('canvas');
        canvas.width = 28;
        canvas.height = 28;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            await createImageBitmap(imageData),
            0, 0, imageData.width, imageData.height,
            0, 0, 28, 28
          );
          const resizedData = ctx.getImageData(0, 0, 28, 28);
          const newHeatmap = [];
          for (let i = 0; i < 28; i++) {
            const row = [];
            for (let j = 0; j < 28; j++) {
              const idx = (i * 28 + j) * 4;
              const brightness = (resizedData.data[idx] + resizedData.data[idx + 1] + resizedData.data[idx + 2]) / (255 * 3);
              row.push(1 - brightness);
            }
            newHeatmap.push(row);
          }
          setHeatmapData(newHeatmap);
        }
        
        toast.success(`Predicted: ${newPredictions[0].class} (${(newPredictions[0].probability * 100).toFixed(1)}%)`);
      }
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error('Prediction failed');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setIsPredicting(false), 2000);
    }
  };

  const handleClassClick = (className) => {
    console.log('Class clicked:', className);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto">
        <header className="mb-8">
          <h1 className="text-5xl font-bold neon-glow mb-2">
            CNN Visual Explorer
          </h1>
          <p className="text-muted-foreground text-lg">
            Interactive 3D Neural Network Visualization & Analysis Dashboard • Digit Recognition (0-9)
          </p>
          {modelLoading && (
            <div className="mt-2 text-sm text-neon-cyan animate-pulse">
              Loading TensorFlow.js MNIST model...
            </div>
          )}
          {!modelLoading && model && (
            <div className="mt-2 text-sm text-green-500">
              ✓ Model ready - Draw digits 0-9 for accurate recognition
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 h-[600px]">
            <CNNVisualization isPredicting={isPredicting} predictions={predictions} />
          </div>
          
          <div className="h-[600px]">
            <DrawingCanvas onPredict={handlePredict} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="h-[500px]">
            <OutputVisualization 
              predictions={predictions}
              onClassClick={handleClassClick}
            />
          </div>

          <div className="h-[500px]">
            <ConfidenceTrend data={confidenceHistory} />
          </div>

          <div className="h-[500px]">
            <ActivationHeatmap 
              data={heatmapData}
              topNodes={topNodes}
            />
          </div>
        </div>

        <StatusIndicators isProcessing={isProcessing} />
      </div>
    </div>
  );
};

export default Index;
