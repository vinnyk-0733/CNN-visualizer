import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eraser, Trash2, Play } from "lucide-react";
import { toast } from "sonner";

export const DrawingCanvas = ({ onPredict }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [autoPredict, setAutoPredict] = useState(false);
  const [ctx, setCtx] = useState(null);

  /* -------------------- INIT CANVAS -------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // White background for MNIST-style input
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = "#000000";
    context.lineWidth = 20;
    context.lineCap = "round";
    context.lineJoin = "round";

    setCtx(context);
  }, []);

  /* -------------------- POINTER HELPERS -------------------- */

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    if (!ctx) return;
    e.preventDefault();

    setIsDrawing(true);

    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || !ctx) return;
    e.preventDefault();

    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    setIsDrawing(false);
    ctx?.closePath();

    if (autoPredict && canvasRef.current) {
      const imageData = ctx.getImageData(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      onPredict(imageData);
    }
  };

  /* -------------------- CONTROLS -------------------- */

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    toast.success("Canvas cleared");
  };

  const handlePredict = () => {
    if (!ctx || !canvasRef.current) return;

    const imageData = ctx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    onPredict(imageData);
    toast.success("Prediction started");
  };

  /* -------------------- UI -------------------- */

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold neon-glow mb-4">Draw Character</h2>

      <div className="flex-1 flex items-center justify-center mb-4">
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          className="
            border-2 border-neon-blue rounded-lg cursor-crosshair
            shadow-[0_0_20px_rgba(0,212,255,0.3)]
            touch-none select-none
          "
          // 🔥 Pointer Events — work on both mobile + desktop
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
        />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Switch checked={autoPredict} onCheckedChange={setAutoPredict} />
        <Label className="text-sm text-muted-foreground">Auto-predict</Label>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handlePredict}
          className="flex-1 bg-neon-blue hover:bg-neon-blue/80 text-background"
          disabled={autoPredict}
        >
          <Play className="mr-2 h-4 w-4" />
          Predict
        </Button>
        <Button
          onClick={clearCanvas}
          variant="outline"
          className="border-neon-purple text-neon-purple hover:bg-neon-purple/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
