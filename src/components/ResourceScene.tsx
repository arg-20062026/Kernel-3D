
import { Canvas } from "@react-three/fiber";
import { Float, Line, OrbitControls, Stars } from "@react-three/drei";

const RESOURCE_COLORS = ["#67e8f9", "#a78bfa", "#34d399"];

const PROCESS_POSITIONS: [number, number, number][] = [
  [-2.4, 1.35, 0],
  [-1.15, -1.35, 0.4],
  [0, 1.7, -0.3],
  [1.25, -1.25, 0.3],
  [2.4, 1.2, 0],
];

const RESOURCE_POSITIONS: [number, number, number][] = [
  [-3.1, 0, 0],
  [0, 0, -0.5],
  [3.1, 0, 0],
];

interface ResourceSceneProps {
  allocation: number[][];
  activeProcess: number | null;
  completedProcesses: number[];
}

export default function ResourceScene({
  allocation,
  activeProcess,
  completedProcesses,
}: ResourceSceneProps) {
  return (
    <Canvas camera={{ position: [0, 0.3, 9], fov: 48 }}>
      <color attach="background" args={["#070b14"]} />
      <ambientLight intensity={1.1} />
      <pointLight position={[0, 4, 5]} intensity={35} color="#67e8f9" />
      <pointLight position={[-4, -2, 3]} intensity={20} color="#8b5cf6" />
      <Stars
        radius={70}
        depth={35}
        count={1600}
        factor={2}
        fade
        speed={0.5}
      />

      {RESOURCE_POSITIONS.map((resourcePosition, resourceIndex) => (
        <group
          key={`resource-${resourceIndex}`}
          position={resourcePosition}
        >
          <Float
            speed={1.2 + resourceIndex * 0.25}
            rotationIntensity={0.3}
            floatIntensity={0.5}
          >
            <mesh>
              <icosahedronGeometry args={[0.48, 1]} />
              <meshStandardMaterial
                color={RESOURCE_COLORS[resourceIndex]}
                emissive={RESOURCE_COLORS[resourceIndex]}
                emissiveIntensity={0.45}
                metalness={0.65}
                roughness={0.2}
                wireframe
              />
            </mesh>
          </Float>
        </group>
      ))}

      {PROCESS_POSITIONS.map((position, processIndex) => {
        const isActive = activeProcess === processIndex;
        const isCompleted = completedProcesses.includes(processIndex);

        const nodeColor = isActive
          ? "#facc15"
          : isCompleted
            ? "#34d399"
            : "#a78bfa";

        return (
          <group key={`process-${processIndex}`} position={position}>
            {RESOURCE_POSITIONS.map((resourcePosition, resourceIndex) => {
              if (!allocation[processIndex]?.[resourceIndex]) {
                return null;
              }

              return (
                <Line
                  key={`edge-${processIndex}-${resourceIndex}`}
                  points={[
                    [0, 0, 0],
                    [
                      resourcePosition[0] - position[0],
                      resourcePosition[1] - position[1],
                      resourcePosition[2] - position[2],
                    ],
                  ]}
                  color={RESOURCE_COLORS[resourceIndex]}
                  lineWidth={
                    1 + allocation[processIndex][resourceIndex] * 0.35
                  }
                  transparent
                  opacity={isActive || isCompleted ? 0.8 : 0.25}
                />
              );
            })}

            <Float
              speed={1.5}
              rotationIntensity={0.2}
              floatIntensity={0.3}
            >
              <mesh>
                <sphereGeometry args={[0.19, 24, 24]} />
                <meshStandardMaterial
                  color={nodeColor}
                  emissive={nodeColor}
                  emissiveIntensity={isActive ? 1.8 : 0.65}
                  metalness={0.4}
                  roughness={0.25}
                />
              </mesh>

              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.31, 0.018, 8, 40]} />
                <meshBasicMaterial
                  color={nodeColor}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            </Float>
          </group>
        );
      })}

      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={13}
        autoRotate
        autoRotateSpeed={0.35}
      />
    </Canvas>
  );
}
