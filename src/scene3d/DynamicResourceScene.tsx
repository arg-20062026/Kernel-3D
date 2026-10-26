import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line, OrbitControls, Html, Sparkles } from "@react-three/drei";
import * as THREE from "three";
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

// Gyroscopic containment rings for futuristic reactor cores
function GyroscopicRings({
  color,
  speed,
}: {
  color: string;
  speed: number;
}) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * speed;
      ring1Ref.current.rotation.y += delta * speed * 0.7;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * speed * 0.8;
      ring2Ref.current.rotation.z += delta * speed * 0.5;
    }
  });

  return (
    <group>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.54, 0.016, 12, 48]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.92}
          roughness={0.15}
          emissive={color}
          emissiveIntensity={0.65}
        />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, Math.PI / 6]}>
        <torusGeometry args={[0.66, 0.014, 12, 48]} />
        <meshStandardMaterial
          color="#64748b"
          metalness={0.92}
          roughness={0.15}
          emissive={color}
          emissiveIntensity={0.45}
        />
      </mesh>
    </group>
  );
}

// Pulsing status core inside futuristic computational process module
function PulsingProcessCore({
  color,
  isActive,
}: {
  color: string;
  isActive: boolean;
}) {
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (coreRef.current && isActive) {
      const pulse = 1.3 + 0.7 * Math.sin(clock.getElapsedTime() * 7);
      (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
  });

  return (
    <mesh ref={coreRef} position={[0, 0, 0.02]}>
      <boxGeometry args={[0.42, 0.44, 0.38]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isActive ? 1.6 : 0.45}
        metalness={0.3}
        roughness={0.2}
      />
    </mesh>
  );
}

// Sci-Fi Cybernetic Floor Grid & Containment Ring Platform
function CyberneticFloor() {
  return (
    <group position={[0, -3.4, 0]}>
      {/* Grid helper with futuristic cyan/slate styling */}
      <gridHelper args={[24, 24, "#0284c7", "#0f172a"]} />

      {/* Concentric glowing energy rings on containment floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[3.8, 3.86, 64]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[6.2, 6.28, 64]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
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

  // Current available resources at this execution step
  const currentWork = currentStep
    ? currentStep.workAfter
    : model.available;

  return (
    <div className="canvas-wrapper dark-viewport">
      <Canvas
        camera={{ position: [0, 0.5, 10.2], fov: 46 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        {/* Cinematic Deep Space Dark Environment */}
        <color attach="background" args={["#060a14"]} />
        <fog attach="fog" args={["#060a14", 9, 24]} />

        {/* Cinematic Lighting: High-Contrast Studio Environment */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[6, 12, 8]} intensity={2.2} color="#f8fafc" />
        {/* Vibrant cyan rim light */}
        <pointLight position={[0, 5, 4]} intensity={25} color="#00e5ff" />
        {/* Deep violet fill light */}
        <pointLight position={[-6, -4, 3]} intensity={20} color="#8b5cf6" />
        {/* Warm bottom specular bounce */}
        <pointLight position={[0, -3, 2]} intensity={12} color="#0284c7" />

        {/* Ambient Floating Cyber Energy Dust */}
        {!prefersReducedMotion && (
          <Sparkles
            count={45}
            scale={14}
            size={2.4}
            speed={0.4}
            color="#38bdf8"
            opacity={0.65}
          />
        )}

        {/* Cybernetic Containment Grid Floor */}
        <CyberneticFloor />

        {/* ========================================== */}
        {/* RESOURCE NODES — Futuristic Energy Cores */}
        {/* ========================================== */}
        {resourcePositions.map((pos, rIndex) => {
          const color = resourceColors[rIndex % resourceColors.length];
          const rName = model.resourceNames[rIndex] ?? `R${rIndex}`;
          const instancesFree = currentWork[rIndex] ?? 0;

          return (
            <group key={`res-${rIndex}`} position={pos}>
              <Float
                speed={prefersReducedMotion ? 0 : 1.2 + rIndex * 0.2}
                rotationIntensity={prefersReducedMotion ? 0 : 0.25}
                floatIntensity={prefersReducedMotion ? 0 : 0.35}
              >
                {/* 1. Internal Plasma Crystalline Core */}
                <mesh>
                  <icosahedronGeometry args={[0.32, 1]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={1.8}
                    roughness={0.1}
                    metalness={0.2}
                  />
                </mesh>

                {/* 2. Outer Translucent Containment Sphere */}
                <mesh>
                  <sphereGeometry args={[0.42, 32, 32]} />
                  <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.28}
                    roughness={0.1}
                    metalness={0.9}
                    transmission={0.6}
                    thickness={0.5}
                  />
                </mesh>

                {/* 3. Dual Gyroscopic Counter-Rotating Rings */}
                <GyroscopicRings
                  color={color}
                  speed={prefersReducedMotion ? 0 : 0.9 + rIndex * 0.15}
                />

                {/* 4. Magnetic Confinement Pylons (4 vertical energy pins) */}
                {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, pylonIdx) => {
                  const px = Math.cos(angle) * 0.46;
                  const pz = Math.sin(angle) * 0.46;
                  return (
                    <group key={`pylon-${pylonIdx}`} position={[px, 0, pz]}>
                      <mesh>
                        <cylinderGeometry args={[0.018, 0.018, 0.45, 8]} />
                        <meshStandardMaterial
                          color="#334155"
                          metalness={0.9}
                          roughness={0.2}
                        />
                      </mesh>
                      <mesh position={[0, 0.23, 0]}>
                        <sphereGeometry args={[0.03, 12, 12]} />
                        <meshBasicMaterial color={color} />
                      </mesh>
                    </group>
                  );
                })}

                {/* 5. Holographic Status Telemetry Pill */}
                <Html
                  position={[0, -0.72, 0]}
                  center
                  distanceFactor={10}
                  className="scene-3d-label res-label"
                >
                  <div
                    className="sci-fi-pill res-pill"
                    style={{ borderColor: color, boxShadow: `0 0 12px ${color}33` }}
                  >
                    <span className="pill-dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                    <span className="pill-text">{rName}</span>
                    <span className="pill-val">({instancesFree} free)</span>
                  </div>
                </Html>
              </Float>
            </group>
          );
        })}

        {/* ============================================== */}
        {/* PROCESS NODES — Computational Metallic Pods    */}
        {/* ============================================== */}
        {processPositions.map((pos, pIndex) => {
          const isActive = activeProcess === pIndex;
          const isCompleted = completedProcesses.includes(pIndex);
          const isBlocked =
            !safetyResult.isSafe &&
            safetyResult.unfinishedProcesses.includes(pIndex);

          // State-reactive cybernetic hues
          const nodeColor = isActive
            ? "#f59e0b" // Radiant Amber active evaluation
            : isCompleted
              ? "#10b981" // Emerald completed
              : isBlocked
                ? "#ef4444" // Crimson blocked / deadlock risk
                : "#0284c7"; // Cyan idle pending

          const pName = model.processNames[pIndex] ?? `P${pIndex}`;

          return (
            <group key={`proc-${pIndex}`} position={pos}>
              {/* Dynamic Energy Conduits to Allocated Resource Reactors */}
              {resourcePositions.map((rPos, rIndex) => {
                const allocVal = model.allocation[pIndex]?.[rIndex] ?? 0;
                if (allocVal <= 0) return null;

                const rColor = resourceColors[rIndex % resourceColors.length];
                const lineThickness = Math.min(5.5, 1.6 + allocVal * 0.5);

                return (
                  <Line
                    key={`edge-${pIndex}-${rIndex}`}
                    points={[
                      [0, 0, 0],
                      [rPos[0] - pos[0], rPos[1] - pos[1], rPos[2] - pos[2]],
                    ]}
                    color={isActive || isCompleted ? nodeColor : rColor}
                    lineWidth={lineThickness}
                    transparent
                    opacity={isActive || isCompleted ? 0.95 : 0.4}
                  />
                );
              })}

              <Float
                speed={prefersReducedMotion ? 0 : 1.3}
                rotationIntensity={prefersReducedMotion ? 0 : 0.18}
                floatIntensity={prefersReducedMotion ? 0 : 0.22}
              >
                {/* 1. Metallic Chassis Pod Outer Armor Shell */}
                <mesh>
                  <boxGeometry args={[0.72, 0.76, 0.46]} />
                  <meshStandardMaterial
                    color="#0f172a"
                    metalness={0.9}
                    roughness={0.16}
                  />
                </mesh>

                {/* 2. Top & Bottom Layered Armor Plates */}
                <mesh position={[0, 0.39, 0]}>
                  <boxGeometry args={[0.66, 0.05, 0.42]} />
                  <meshStandardMaterial
                    color="#1e293b"
                    metalness={0.85}
                    roughness={0.2}
                  />
                </mesh>
                <mesh position={[0, -0.39, 0]}>
                  <boxGeometry args={[0.66, 0.05, 0.42]} />
                  <meshStandardMaterial
                    color="#1e293b"
                    metalness={0.85}
                    roughness={0.2}
                  />
                </mesh>

                {/* 3. Inset Status Core with Dynamic Pulsing Glow */}
                <PulsingProcessCore color={nodeColor} isActive={isActive} />

                {/* 4. Side Status LED Indicator Strips */}
                <mesh position={[-0.37, 0, 0]}>
                  <boxGeometry args={[0.02, 0.52, 0.2]} />
                  <meshBasicMaterial color={nodeColor} />
                </mesh>
                <mesh position={[0.37, 0, 0]}>
                  <boxGeometry args={[0.02, 0.52, 0.2]} />
                  <meshBasicMaterial color={nodeColor} />
                </mesh>

                {/* 5. Holographic Perimeter Energy Containment Frame */}
                <mesh>
                  <boxGeometry args={[0.78, 0.82, 0.52]} />
                  <meshBasicMaterial
                    color={nodeColor}
                    wireframe
                    transparent
                    opacity={isActive ? 0.95 : isCompleted ? 0.7 : 0.3}
                  />
                </mesh>

                {/* 6. Futuristic Holographic HUD Display Tag */}
                <Html
                  position={[0, 0.78, 0]}
                  center
                  distanceFactor={10}
                  className="scene-3d-label proc-label"
                >
                  <div
                    className={`sci-fi-pill proc-pill ${
                      isActive ? "active-pill" : ""
                    } ${isCompleted ? "completed-pill" : ""} ${
                      isBlocked ? "blocked-pill" : ""
                    }`}
                    style={{ borderColor: nodeColor, boxShadow: `0 0 14px ${nodeColor}44` }}
                  >
                    <span className="pill-dot" style={{ background: nodeColor, boxShadow: `0 0 8px ${nodeColor}` }} />
                    <span className="pill-text">{pName}</span>
                    {isActive && <span className="pill-badge eval">EVAL</span>}
                    {isCompleted && <span className="pill-badge done">DONE</span>}
                    {isBlocked && <span className="pill-badge blocked">BLOCKED</span>}
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
          maxDistance={18}
          autoRotate={!prefersReducedMotion}
          autoRotateSpeed={0.25}
        />
      </Canvas>
    </div>
  );
}
