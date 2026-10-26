import React, { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Float } from "@react-three/drei";
import * as THREE from "three";
import type { SkinnedMesh, Bone, Group } from "three";
import lisaAvatarFallbackUrl from "../assets/lisa-avatar.jpg";

interface Lisa3DCharacterProps {
  mode: "hero" | "compact";
  isSpeaking: boolean;
  isListening: boolean;
  isMuted?: boolean;
}

// Internal animated model component inside Canvas
function LisaModel({
  mode,
  isSpeaking,
  isListening,
}: {
  mode: "hero" | "compact";
  isSpeaking: boolean;
  isListening: boolean;
}) {
  const gltf = useGLTF("/models/lisa.glb");
  const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const groupRef = useRef<Group>(null);
  const bonesRef = useRef<{
    head: Bone | null;
    neck: Bone | null;
    spine: Bone | null;
    morph: SkinnedMesh | null;
  } | null>(null);

  // Track mouth target for smooth interpolation
  const mouthState = useRef({ current: 0 });

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    if (!bonesRef.current) {
      let head: Bone | null = null;
      let neck: Bone | null = null;
      let spine: Bone | null = null;
      let morph: SkinnedMesh | null = null;

      groupRef.current.traverse((child) => {
        if (child.name === "Head" && !head) head = child as Bone;
        if (child.name === "Neck" && !neck) neck = child as Bone;
        if (child.name === "Spine" && !spine) spine = child as Bone;
        if (
          (child as SkinnedMesh).isSkinnedMesh &&
          (child as SkinnedMesh).morphTargetDictionary &&
          !morph
        ) {
          morph = child as SkinnedMesh;
        }
      });

      bonesRef.current = { head, neck, spine, morph };
    }

    const { head: headBone, neck: neckBone, spine: spineBone, morph: morphMesh } =
      bonesRef.current;
    const time = clock.getElapsedTime();

    // 1. Subtle breathing & posture oscillation on Spine
    if (spineBone) {
      spineBone.rotation.x = Math.sin(time * 1.6) * 0.015;
      spineBone.rotation.y = Math.sin(time * 0.8) * 0.01;
    }

    // 2. Idle Head Motion & State Modulation
    if (headBone) {
      // Natural subtle head sway
      let targetRotY = Math.sin(time * 0.7) * 0.04;
      let targetRotX = Math.sin(time * 1.2) * 0.025;
      let targetRotZ = 0;

      if (isListening) {
        // Inquisitive attentive head tilt when student speaks
        targetRotZ = 0.045;
        targetRotX = -0.02;
        targetRotY += 0.02;
      }

      if (isSpeaking) {
        // Expressive conversational cadence nod while talking
        targetRotX += Math.sin(time * 7) * 0.025;
      }

      headBone.rotation.y = THREE.MathUtils.lerp(headBone.rotation.y, targetRotY, 0.1);
      headBone.rotation.x = THREE.MathUtils.lerp(headBone.rotation.x, targetRotX, 0.1);
      headBone.rotation.z = THREE.MathUtils.lerp(headBone.rotation.z, targetRotZ, 0.1);
    }

    if (neckBone) {
      neckBone.rotation.y = Math.sin(time * 0.7) * 0.015;
    }

    // 3. Facial Morph Targets: Blinking & Speaking Lip-sync
    if (morphMesh && morphMesh.morphTargetDictionary && morphMesh.morphTargetInfluences) {
      const dict = morphMesh.morphTargetDictionary;
      const influences = morphMesh.morphTargetInfluences;

      // Realistic periodic eye blink every 3.6 seconds (duration ~160ms)
      const blinkCycle = time % 3.6;
      let blinkValue = 0;
      if (blinkCycle < 0.16) {
        blinkValue = Math.sin((blinkCycle / 0.16) * Math.PI);
      }

      const leftBlink = dict["eyeBlinkLeft"];
      const rightBlink = dict["eyeBlinkRight"];
      if (leftBlink !== undefined) influences[leftBlink] = blinkValue;
      if (rightBlink !== undefined) influences[rightBlink] = blinkValue;

      // Conversational mouth movement modulation
      const jawOpenIdx = dict["jawOpen"] ?? dict["mouthOpen"];
      const visemeAaIdx = dict["viseme_aa"];
      const visemeOIdx = dict["viseme_O"];
      const smileIdx = dict["mouthSmile"];

      // Baseline gentle pleasant smile
      if (smileIdx !== undefined) influences[smileIdx] = 0.22;

      let targetMouth = 0;
      if (isSpeaking) {
        // Harmonic syllable modulation based on simulated speech frequency
        targetMouth =
          0.38 +
          0.32 * Math.sin(time * 13) * Math.cos(time * 6.5);
        targetMouth = Math.max(0, Math.min(0.85, targetMouth));
      }

      mouthState.current.current = THREE.MathUtils.lerp(
        mouthState.current.current,
        targetMouth,
        0.3,
      );

      const curVal = mouthState.current.current;
      if (jawOpenIdx !== undefined) influences[jawOpenIdx] = curVal;
      if (visemeAaIdx !== undefined) influences[visemeAaIdx] = curVal * 0.7;
      if (visemeOIdx !== undefined) influences[visemeOIdx] = curVal * 0.4;
    }
  });

  // Vertical offset centering head and shoulders comfortably in viewport
  // Model height range is Y ~ [0.28, 0.75]. Head is centered near Y = 0.65
  const modelYOffset = mode === "hero" ? -0.58 : -0.62;
  const modelScale = mode === "hero" ? 1.05 : 1.15;

  return (
    <group ref={groupRef} position={[0, modelYOffset, 0]} scale={modelScale}>
      <primitive object={clonedScene} />

      {/* Holographic Pedestal / Energy Ring beneath character */}
      <mesh position={[0, 0.29, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.32, 48]} />
        <meshBasicMaterial
          color={isSpeaking ? "#38bdf8" : isListening ? "#34d399" : "#818cf8"}
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.36, 48]} />
        <meshBasicMaterial
          color={isSpeaking ? "#0284c7" : isListening ? "#059669" : "#6366f1"}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Fallback image card with active state animations
function LisaFallback({
  mode,
  isSpeaking,
  isListening,
}: {
  mode: "hero" | "compact";
  isSpeaking: boolean;
  isListening: boolean;
}) {
  return (
    <div className={`lisa-3d-fallback ${mode}`}>
      <div
        className={`lisa-avatar-ring ${isSpeaking ? "speaking" : ""} ${
          isListening ? "listening" : ""
        }`}
      >
        <img
          src={lisaAvatarFallbackUrl}
          alt="Lisa Virtual Guide"
          className={mode === "hero" ? "lisa-avatar-img" : "compact-avatar-img"}
        />
      </div>
    </div>
  );
}

// Error Boundary for WebGL stability
class WebGLBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function Lisa3DCharacter({
  mode,
  isSpeaking,
  isListening,
  isMuted = false,
}: Lisa3DCharacterProps) {
  // Camera framing: hero shows head & upper torso; compact is closer portrait
  const cameraConfig = useMemo(() => {
    if (mode === "hero") {
      return { position: [0, 0.04, 0.96] as [number, number, number], fov: 38 };
    }
    return { position: [0, 0.06, 0.82] as [number, number, number], fov: 34 };
  }, [mode]);

  const auraColor = isSpeaking
    ? "#38bdf8" // Cyan active speech
    : isListening
      ? "#34d399" // Emerald listening
      : "#818cf8"; // Violet idle

  return (
    <div
      className={`lisa-3d-container ${mode} ${isSpeaking ? "speaking-aura" : ""} ${
        isListening ? "listening-aura" : ""
      }`}
    >
      <WebGLBoundary
        fallback={
          <LisaFallback
            mode={mode}
            isSpeaking={isSpeaking}
            isListening={isListening}
          />
        }
      >
        <Suspense
          fallback={
            <div className="lisa-3d-loading">
              <div className="lisa-loader-spinner" />
              <span>Loading 3D Lisa...</span>
            </div>
          }
        >
          <Canvas
            camera={cameraConfig}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
            className="lisa-3d-canvas"
          >
            {/* Studio Rim & Key Lighting for 3D Character */}
            <ambientLight intensity={1.1} />
            <directionalLight
              position={[1.5, 3, 2.5]}
              intensity={2.2}
              color="#ffffff"
            />
            {/* Cyan key rim light */}
            <pointLight
              position={[-1.8, 1.2, 1.2]}
              intensity={isSpeaking ? 5.0 : 3.0}
              color={auraColor}
            />
            {/* Soft violet fill light */}
            <pointLight
              position={[1.5, -0.5, 1.2]}
              intensity={2.5}
              color="#a855f7"
            />
            {/* Top spotlight for hair & face highlights */}
            <spotLight
              position={[0, 2.2, 1.5]}
              intensity={1.8}
              angle={0.6}
              penumbra={0.5}
              color="#f8fafc"
            />

            <Float
              speed={mode === "hero" ? 1.4 : 1.1}
              rotationIntensity={0.06}
              floatIntensity={0.08}
            >
              <LisaModel
                mode={mode}
                isSpeaking={isSpeaking && !isMuted}
                isListening={isListening}
              />
            </Float>
          </Canvas>
        </Suspense>
      </WebGLBoundary>

      {/* Futuristic Holographic Status Pill overlaid on viewport */}
      <div className={`lisa-3d-status-badge ${isSpeaking ? "speaking" : isListening ? "listening" : "idle"}`}>
        <span className="status-dot" />
        <span className="status-text">
          {isSpeaking ? "SPEAKING" : isListening ? "LISTENING" : "ONLINE"}
        </span>
      </div>
    </div>
  );
}

// Preload avatar asset for instantaneous rendering
useGLTF.preload("/models/lisa.glb");
