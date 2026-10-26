import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, Line, OrbitControls, Stars, Html } from "@react-three/drei";
import type { SimulationModel } from "../types/simulation";
import type { SafetyResult } from "../algorithm/banker";
import {
  computeProcessPositions,
  computeResourcePositions,
} from "./layoutMath";

interface DynamicResourceSceneProps {
  model: SimulationModel;
  safetyResult: SafetyResult;
  stepIndex: number;
  resourceColors: string[];
  prefersReducedMotion?: boolean;
}

export default function DynamicResourceScene({
  model,
  safetyResult,
  stepIndex,
  resourceColors,
  prefersReducedMotion = false,
}: DynamicResourceSceneProps) {
  const processPositions = useMemo(
    () => computeProcessPositions(model.processCount),
    [model.processCount],
  );

  const resourcePositions = useMemo(
    () => computeResourcePositions(model.resourceCount),
    [model.resourceCount],
  );

  const currentStep =
    stepIndex > 0 ? safetyResult.steps[stepIndex - 1] ?? null : null;
  const activeProcess = currentStep?.process ?? null;
  const completedProcesses = useMemo(
    () => safetyResult.steps.slice(0, stepIndex).map((s) => s.process),
    [safetyResult.steps, stepIndex],
  );

  // Current free resources at this step
  const currentWork = currentStep
    ? currentStep.workAfter
    : model.available;

  return (
    <div className="canvas-wrapper">
      <Canvas
        camera={{ position: [0, 0.4, 9.8], fov: 46 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#050811"]} />
        <ambientLight intensity={1.2} />
        <pointLight position={[0, 5, 6]} intensity={32} color="#55e8ff" />
        <pointLight position={[-5, -3, 4]} intensity={22} color="#a78bfa" />
        <Stars
          radius={80}
          depth={40}
          count={prefersReducedMotion ? 600 : 1800}
          factor={2}
          fade
          speed={prefersReducedMotion ? 0 : 0.4}
        />

        {/* RESOURCE NODES */}
        {resourcePositions.map((pos, rIndex) => {
          const color = resourceColors[rIndex % resourceColors.length];
          const rName = model.resourceNames[rIndex] ?? `R${rIndex}`;
          const instancesFree = currentWork[rIndex] ?? 0;

          return (
            <group key={`res-${rIndex}`} position={pos}>
              <Float
                speed={prefersReducedMotion ? 0 : 1.2 + rIndex * 0.2}
                rotationIntensity={prefersReducedMotion ? 0 : 0.3}
                floatIntensity={prefersReducedMotion ? 0 : 0.4}
              >
                <mesh>
                  <octahedronGeometry args={[0.42, 0]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.65}
                    metalness={0.7}
                    roughness={0.2}
                    wireframe
                  />
                </mesh>

                <Html
                  position={[0, -0.65, 0]}
                  center
                  distanceFactor={10}
                  className="scene-3d-label res-label"
                >
                  <div
                    className="label-pill res-pill"
                    style={{ borderColor: color }}
                  >
                    <span className="pill-dot" style={{ background: color }} />
                    <span className="pill-text">{rName}</span>
                    <span className="pill-val">({instancesFree} free)</span>
                  </div>
                </Html>
              </Float>
            </group>
          );
        })}

        {/* PROCESS NODES & CONNECTIONS */}
        {processPositions.map((pos, pIndex) => {
          const isActive = activeProcess === pIndex;
          const isCompleted = completedProcesses.includes(pIndex);
          const isBlocked =
            !safetyResult.isSafe &&
            safetyResult.unfinishedProcesses.includes(pIndex);

          const nodeColor = isActive
            ? "#facc15" // Yellow active
            : isCompleted
              ? "#34d399" // Green completed
              : isBlocked
                ? "#ff718c" // Coral blocked
                : "#a78bfa"; // Violet pending

          const pName = model.processNames[pIndex] ?? `P${pIndex}`;

          return (
            <group key={`proc-${pIndex}`} position={pos}>
              {/* Dynamic Connection lines to allocated resources */}
              {resourcePositions.map((rPos, rIndex) => {
                const allocVal = model.allocation[pIndex]?.[rIndex] ?? 0;
                if (allocVal <= 0) return null;

                const rColor = resourceColors[rIndex % resourceColors.length];
                const lineThickness = Math.min(4.5, 1.2 + allocVal * 0.4);

                return (
                  <Line
                    key={`edge-${pIndex}-${rIndex}`}
                    points={[
                      [0, 0, 0],
                      [rPos[0] - pos[0], rPos[1] - pos[1], rPos[2] - pos[2]],
                    ]}
                    color={rColor}
                    lineWidth={lineThickness}
                    transparent
                    opacity={isActive || isCompleted ? 0.85 : 0.28}
                  />
                );
              })}

              <Float
                speed={prefersReducedMotion ? 0 : 1.4}
                rotationIntensity={prefersReducedMotion ? 0 : 0.2}
                floatIntensity={prefersReducedMotion ? 0 : 0.25}
              >
                {/* Process Core Sphere */}
                <mesh>
                  <sphereGeometry args={[0.22, 28, 28]} />
                  <meshStandardMaterial
                    color={nodeColor}
                    emissive={nodeColor}
                    emissiveIntensity={isActive ? 1.9 : 0.7}
                    metalness={0.4}
                    roughness={0.2}
                  />
                </mesh>

                {/* Orbiting halo ring */}
                <mesh rotation={[Math.PI / 2.3, 0, 0]}>
                  <torusGeometry args={[0.36, 0.02, 10, 48]} />
                  <meshBasicMaterial
                    color={nodeColor}
                    transparent
                    opacity={isActive ? 0.95 : 0.65}
                  />
                </mesh>

                {/* 3D Label */}
                <Html
                  position={[0, 0.62, 0]}
                  center
                  distanceFactor={10}
                  className="scene-3d-label proc-label"
                >
                  <div
                    className={`label-pill proc-pill ${
                      isActive ? "active-pill" : ""
                    } ${isCompleted ? "completed-pill" : ""} ${
                      isBlocked ? "blocked-pill" : ""
                    }`}
                  >
                    <span className="pill-text">{pName}</span>
                    {isActive && <span className="pill-state">EVAL</span>}
                    {isCompleted && <span className="pill-state">DONE</span>}
                    {isBlocked && <span className="pill-state">BLOCKED</span>}
                  </div>
                </Html>
              </Float>
            </group>
          );
        })}

        <OrbitControls
          enablePan={true}
          panSpeed={0.8}
          minDistance={4.5}
          maxDistance={16}
          autoRotate={!prefersReducedMotion}
          autoRotateSpeed={0.25}
        />
      </Canvas>
    </div>
  );
}
