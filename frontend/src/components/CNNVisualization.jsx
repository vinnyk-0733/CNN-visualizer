// src/components/CNNVisualization.jsx
import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/* ───────────── helpers ───────────── */

const getPredictedDigit = (predictions) => {
  if (!predictions || !predictions.length) return null;

  let bestIdx = 0;
  let bestProb =
    predictions[0].probability ?? predictions[0].score ?? 0;

  for (let i = 1; i < predictions.length; i++) {
    const p = predictions[i].probability ?? predictions[i].score ?? 0;
    if (p > bestProb) {
      bestProb = p;
      bestIdx = i;
    }
  }

  const cls = predictions[bestIdx].class;
  const parsed = parseInt(cls, 10);
  return Number.isNaN(parsed) ? bestIdx : parsed;
};

/* ───────────── nodes / lines ───────────── */

const NetworkNode = ({
  position,
  activation,
  layer,
  index,
  contribution,
  isActive,
  isOutputPredicted,
}) => {
  const meshRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (!meshRef.current) return;
    const targetScale = isActive || isOutputPredicted ? 1.4 : 1;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.12
    );
  });

  const baseColor = isOutputPredicted
    ? "#00ffff"
    : isActive
    ? "#00d4ff"
    : "#b847ff";

  const emissive = isOutputPredicted ? "#00ffff" : baseColor;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissive}
          emissiveIntensity={
            isOutputPredicted ? 1.5 : Math.max(0.3, activation * 2)
          }
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      {hovered && (
        <Html distanceFactor={10}>
          <div className="glass-card px-3 py-2 text-xs whitespace-nowrap pointer-events-none">
            <div className="font-semibold text-neon-blue">{layer}</div>
            <div className="text-muted-foreground">Node #{index}</div>
            <div className="text-foreground">
              Activation: {activation.toFixed(3)}
            </div>
            <div className="text-neon-purple">
              Contribution: {(contribution * 100).toFixed(1)}%
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

const NetworkConnection = ({
  start,
  end,
  weight,
  active,
  animationSpeed,
  isPredicting,
  highlight, // ⭐ new: is this connection on the path to predicted output?
}) => {
  const lineRef = useRef(null);

  useFrame((state) => {
    if (!lineRef.current) return;
    const material = lineRef.current.material;
    const t = state.clock.getElapsedTime();

    // 🔅 base: all connections very dim
    // 🔆 highlight path (to predicted output): much brighter + stronger pulse
    const baseOpacity = highlight ? 0.35 : 0.04;
    const pulseAmp = highlight ? 0.35 : 0.06;

    material.opacity =
      baseOpacity +
      pulseAmp *
        (0.5 +
          0.5 * Math.sin(t * animationSpeed * 2 + (highlight ? 0 : 1.2)));

    // linewidth only if highlighted
    material.linewidth = highlight ? 2.5 : 1;
  });

  const points = useMemo(
    () => [new THREE.Vector3(...start), new THREE.Vector3(...end)],
    [start, end]
  );

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, [points]);

  const color = highlight ? "#00ffff" : active ? "#00d4ff" : "#4b9dff";

  return (
    <primitive
      object={
        new THREE.Line(
          geometry,
          new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0.1, // real opacity handled in useFrame
            linewidth: 1,
          })
        )
      }
      ref={lineRef}
    />
  );
};

/* ───────────── architecture ───────────── */

const CNNArchitecture = ({
  animationSpeed,
  showLabels,
  activeNodes,
  isPredicting,
  predictedDigit,
}) => {
  // use x positions for isometric, not z
  const layers = useMemo(
    () => [
      { name: "Input", count: 784, x: -10, displayCount: 64 },
      { name: "Conv1", count: 32, x: -7.5, displayCount: 32 },
      { name: "Pool1", count: 16, x: -5.0, displayCount: 16 },
      { name: "Conv2", count: 64, x: -2.5, displayCount: 48 },
      { name: "Pool2", count: 32, x: 0.0, displayCount: 32 },
      { name: "Flatten", count: 128, x: 2.5, displayCount: 64 },
      { name: "Dense1", count: 128, x: 5.0, displayCount: 64 },
      { name: "Dense2", count: 64, x: 7.5, displayCount: 48 },
      { name: "Output", count: 10, x: 10.0, displayCount: 10 },
    ],
    []
  );

  // nodes arranged per layer
  const nodes = useMemo(() => {
    const result = [];

    layers.forEach((layer, layerIdx) => {
      const gridSize = Math.ceil(Math.sqrt(layer.displayCount));
      const spacing = 0.5;
      const offset = (gridSize * spacing) / 2;

      for (let i = 0; i < layer.displayCount; i++) {
        const y = Math.floor(i / gridSize) * spacing - offset;
        const z = (i % gridSize) * spacing - offset;

        result.push({
          position: [layer.x, y, z],
          activation: Math.random(),
          layer: layer.name,
          layerIdx,
          index: i,
          contribution: Math.random(),
        });
      }
    });

    return result;
  }, [layers]);

  // connections (⭐ now mark which ones go to predicted output)
  const connections = useMemo(() => {
    const result = [];
    const nodesByLayer = {};

    nodes.forEach((node) => {
      if (!nodesByLayer[node.layerIdx]) {
        nodesByLayer[node.layerIdx] = [];
      }
      nodesByLayer[node.layerIdx].push(node);
    });

    for (let layerIdx = 0; layerIdx < layers.length - 1; layerIdx++) {
      const currentLayerNodes = nodesByLayer[layerIdx] || [];
      const nextLayerNodes = nodesByLayer[layerIdx + 1] || [];

      currentLayerNodes.forEach((startNode, i) => {
        const connectionsPerNode = Math.min(3, nextLayerNodes.length);
        for (let j = 0; j < connectionsPerNode; j++) {
          const targetIdx = (i + j) % nextLayerNodes.length;
          const endNode = nextLayerNodes[targetIdx];
          if (endNode) {
            const weight = Math.random();
            const isActive = isPredicting || weight > 0.7;

            // ⭐ highlight if this connection ends on the predicted output node
            const isToPredictedOutput =
              endNode.layer === "Output" &&
              predictedDigit !== null &&
              endNode.index === predictedDigit;

            result.push({
              start: startNode.position,
              end: endNode.position,
              weight,
              active: isActive,
              highlight: isToPredictedOutput,
            });
          }
        }
      });
    }

    return result;
  }, [nodes, layers, isPredicting, predictedDigit]);

  // layer label positions
  const layerLabelPositions = useMemo(
    () =>
      layers.map((layer) => ({
        name: layer.name,
        position: [layer.x, 3.2, 0],
      })),
    [layers]
  );

  return (
    // isometric tilt
    <group rotation={[-Math.PI / 6, Math.PI / 4, 0]}>
      {/* subtle base plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
        <planeGeometry args={[40, 16]} />
        <meshStandardMaterial color="#050816" roughness={1} />
      </mesh>

      {/* background feature planes per layer (conv/pool feel) */}
      {layers.map((layer, idx) => (
        <group key={`bg-${idx}`} position={[layer.x, 0, 0]}>
          {[...Array(3)].map((_, i) => (
            <mesh key={i} position={[0, 0, (i - 1) * 0.3]}>
              <boxGeometry args={[2.6, 2.6, 0.05]} />
              <meshStandardMaterial
                color={idx <= 4 ? "#111827" : "#1f2937"}
                emissive={idx <= 4 ? "#4b9dff" : "#a855f7"}
                emissiveIntensity={0.12}
                roughness={0.6}
                metalness={0.5}
                transparent
                opacity={0.35 - i * 0.08}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* optional text labels */}
      {showLabels &&
        layerLabelPositions.map((l) => (
          <Html
            key={l.name}
            position={l.position}
            distanceFactor={15}
          >
            <div className="text-[10px] px-2 py-1 rounded-full bg-black/60 border border-white/10 text-white/80 backdrop-blur">
              {l.name}
            </div>
          </Html>
        ))}

      {/* nodes */}
      {nodes.map((node, i) => {
        const isOutputLayer = node.layer === "Output";
        const isOutputPredicted =
          isOutputLayer &&
          predictedDigit !== null &&
          node.index === predictedDigit;

        const isActiveNode =
          isOutputPredicted || activeNodes.has(`node-${i}`);

        return (
          <NetworkNode
            key={i}
            {...node}
            isActive={isActiveNode}
            isOutputPredicted={isOutputPredicted}
          />
        );
      })}

      {/* connections */}
      {connections.map((conn, i) => (
        <NetworkConnection
          key={i}
          {...conn}
          animationSpeed={animationSpeed}
          isPredicting={isPredicting}
          highlight={conn.highlight}
        />
      ))}

      {/* lights */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 12, 10]} intensity={1.2} color="#00d4ff" />
      <pointLight position={[-12, -8, -10]} intensity={0.5} color="#b847ff" />
    </group>
  );
};

/* ───────────── exported component ───────────── */

export const CNNVisualization = ({
  isPredicting = false,
  predictions = [],
}) => {
  const [animationSpeed, setAnimationSpeed] = useState([2]);
  const [showLabels, setShowLabels] = useState(true);
  const [activeNodes] = useState(new Set());

  const predictedDigit = useMemo(
    () => getPredictedDigit(predictions),
    [predictions]
  );

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-2xl font-bold neon-glow mb-1">
          CNN Architecture
        </h2>
        <p className="text-xs text-muted-foreground">
          Isometric view of your Conv → Pool → Dense → Output pipeline.
          The predicted digit node in the output layer glows cyan, and only
          its incoming connections are strongly highlighted.
        </p>

        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-3 flex-1">
            <Label className="text-sm text-muted-foreground">Speed</Label>
            <Slider
              value={animationSpeed}
              onValueChange={setAnimationSpeed}
              min={0.5}
              max={5}
              step={0.5}
              className="flex-1"
            />
            <span className="text-sm text-neon-blue">
              {animationSpeed[0]}x
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={showLabels}
              onCheckedChange={setShowLabels}
            />
            <Label className="text-sm text-muted-foreground">
              Show Labels
            </Label>
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-lg overflow-hidden neon-border">
        <Canvas camera={{ position: [12, 10, 18], fov: 45 }}>
          <color attach="background" args={["#0a0e1a"]} />
          <CNNArchitecture
            animationSpeed={animationSpeed[0]}
            showLabels={showLabels}
            activeNodes={activeNodes}
            isPredicting={isPredicting}
            predictedDigit={predictedDigit}
          />
          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            minDistance={8}
            maxDistance={30}
          />
        </Canvas>
      </div>
    </div>
  );
};
