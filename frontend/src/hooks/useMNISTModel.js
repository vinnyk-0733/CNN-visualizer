// src/hooks/useMNISTModel.js
import { useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import { toast } from "sonner";

export const useMNISTModel = () => {
  const [model, setModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadModel = async () => {
      setIsLoading(true);
      try {
        // ✅ This matches public/mnist/model.json
        const url = `${window.location.origin}/mnist/model.json`;
        console.log("Loading model from:", url);

        const loadedModel = await tf.loadLayersModel(url);

        if (cancelled) {
          loadedModel.dispose();
          return;
        }

        setModel(loadedModel);
        toast.success("MNIST model loaded ✅");
      } catch (err) {
        console.error("Error loading MNIST model:", err);
        toast.error("Failed to load MNIST model ❌");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadModel();

    return () => {
      cancelled = true;
    };
  }, []);

  const preprocessImage = (imageData) =>
    tf.tidy(() => {
      let tensor = tf.browser.fromPixels(imageData, 1);   // [H, W, 1]
      tensor = tf.image.resizeBilinear(tensor, [28, 28]); // 28x28

      tensor = tensor.toFloat().div(255);                 // [0, 1]

      // 🔥 IMPORTANT: invert colors (white digit on black background)
      tensor = tf.scalar(1).sub(tensor);

      return tensor.expandDims(0);                        // [1, 28, 28, 1]
    });


  const predict = async (imageData) => {
    if (!model) {
      toast.error("Model not loaded yet");
      return [];
    }

    try {
      const input = preprocessImage(imageData);
      const logits = model.predict(input);
      const probs = await logits.data();
      input.dispose();
      logits.dispose();

      const classes = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

      return Array.from(probs)
        .slice(0, 10)
        .map((p, i) => ({ class: classes[i], probability: p }))
        .sort((a, b) => b.probability - a.probability);
    } catch (err) {
      console.error("Prediction error:", err);
      toast.error("Prediction failed");
      return [];
    }
  };

  return { model, isLoading, predict };
};
