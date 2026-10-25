
import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, Line, OrbitControls, Stars } from "@react-three/drei";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  FlaskConical,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  XCircle,
} from "lucide-react";
import {
  calculateNeed,
  runSafetyAlgorithm,
  type BankerInput,
} from "./algorithm/banker";
import "./App.css";

const INITIAL_INPUT: BankerInput = {
  allocation: [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ],
  max: [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ],
  available: [3, 3, 2],
};

const RESOURCE_NAMES = ["Resource A", "Resource B", "Resource C"];
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

function cloneInput(input: BankerInput): BankerInput {
  return {
    allocation: input.allocation.map((row) => [...row]),
    max: input.max.map((row) => [...row]),
    available: [...input.available],
  };
}

function ResourceScene({
  allocation,
  activeProcess,
  completedProcesses,
}: {
  allocation: number[][];
  activeProcess: number | null;
  completedProcesses: number[];
}) {
  return (
    <Canvas camera={{ position: [0, 0.3, 9], fov: 48 }}>
      <color attach="background" args={["#070b14"]} />
      <ambientLight intensity={1.1} />
      <pointLight position={[0, 4, 5]} intensity={35} color="#67e8f9" />
      <pointLight position={[-4, -2, 3]} intensity={20} color="#8b5cf6" />
      <Stars radius={70} depth={35} count={1600} factor={2} fade speed={0.5} />

      {RESOURCE_POSITIONS.map((resourcePosition, resourceIndex) => (
        <group key={`resource-${resourceIndex}`} position={resourcePosition}>
          <Float speed={1.2 + resourceIndex * 0.25} rotationIntensity={0.3} floatIntensity={0.5}>
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
              if (!allocation[processIndex]?.[resourceIndex]) return null;

              return (
                <Line
                  key={`edge-${processIndex}-${resourceIndex}`}
                  points={[ [0, 0, 0], [
                    resourcePosition[0] - position[0],
                    resourcePosition[1] - position[1],
                    resourcePosition[2] - position[2],
                  ] ]}
                  color={RESOURCE_COLORS[resourceIndex]}
                  lineWidth={1 + allocation[processIndex][resourceIndex] * 0.35}
                  transparent
                  opacity={isActive || isCompleted ? 0.8 : 0.25}
                />
              );
            })}

            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
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
                <meshBasicMaterial color={nodeColor} transparent opacity={0.8} />
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

function NumberCell({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <input
      className="matrix-input"
      type="number"
      min={0}
      step={1}
      aria-label={label}
      value={value}
      onChange={(event) => {
        const next = Number(event.target.value);
        if (Number.isSafeInteger(next) && next >= 0) onChange(next);
        if (event.target.value === "") onChange(0);
      }}
    />
  );
}

function App() {
  const [input, setInput] = useState<BankerInput>(() => cloneInput(INITIAL_INPUT));
  const [stepIndex, setStepIndex] = useState(0);
  const [processChoice, setProcessChoice] = useState(1);
  const [request, setRequest] = useState([1, 0, 2]);
  const [requestMessage, setRequestMessage] = useState<{
    type: "success" | "error" | "info";
    title: string;
    detail: string;
  } | null>(null);

  const need = useMemo(
    () => calculateNeed(input.allocation, input.max),
    [input.allocation, input.max],
  );

  const result = useMemo(() => {
    try {
      return runSafetyAlgorithm(input);
    } catch {
      return null;
    }
  }, [input]);

  const currentStep =
    result && stepIndex > 0 ? result.steps[stepIndex - 1] ?? null : null;

  const activeProcess = currentStep?.process ?? null;
  const completedProcesses = result
    ? result.steps.slice(0, stepIndex).map((step) => step.process)
    : [];

  function updateMatrix(
    matrixName: "allocation" | "max",
    row: number,
    column: number,
    value: number,
  ) {
    setInput((previous) => {
      const next = cloneInput(previous);
      next[matrixName][row][column] = value;
      return next;
    });
    setRequestMessage(null);
    setStepIndex(0);
  }

  function updateAvailable(index: number, value: number) {
    setInput((previous) => {
      const next = cloneInput(previous);
      next.available[index] = value;
      return next;
    });
    setRequestMessage(null);
    setStepIndex(0);
  }

  function resetSimulation() {
    setInput(cloneInput(INITIAL_INPUT));
    setStepIndex(0);
    setProcessChoice(1);
    setRequest([1, 0, 2]);
    setRequestMessage(null);
  }

  function runNextStep() {
    if (!result || stepIndex >= result.steps.length) return;
    setStepIndex((previous) => previous + 1);
  }

  function submitRequest() {
    setRequestMessage(null);

    if (!result) {
      setRequestMessage({
        type: "error",
        title: "Invalid system state",
        detail: "Correct the matrix values before submitting a request.",
      });
      return;
    }

    const processNeed = need[processChoice];

    if (!request.every((value) => Number.isSafeInteger(value) && value >= 0)) {
      setRequestMessage({
        type: "error",
        title: "Invalid request",
        detail: "Every requested quantity must be a non-negative integer.",
      });
      return;
    }

    if (request.some((value, j) => value > processNeed[j])) {
      setRequestMessage({
        type: "error",
        title: "Request exceeds Need",
        detail: `P${processChoice} cannot request more than its remaining declared maximum claim.`,
      });
      return;
    }

    if (request.some((value, j) => value > input.available[j])) {
      setRequestMessage({
        type: "error",
        title: "Insufficient Available resources",
        detail: "The system does not currently have enough free instances to grant this request.",
      });
      return;
    }

    const tentative = cloneInput(input);

    for (let j = 0; j < request.length; j++) {
      tentative.available[j] -= request[j];
      tentative.allocation[processChoice][j] += request[j];
    }

    const tentativeResult = runSafetyAlgorithm(tentative);

    if (!tentativeResult.isSafe) {
      setRequestMessage({
        type: "error",
        title: "Request denied · Unsafe state",
        detail: `Granting this request would leave P${tentativeResult.unfinishedProcesses
          .map((process) => `P${process}`)
          .join(", ")} unable to complete in the safety check. The original state has been preserved.`,
      });
      return;
    }

    setInput(tentative);
    setStepIndex(0);
    setRequestMessage({
      type: "success",
      title: "Request granted · State remains safe",
      detail: `Safe sequence after allocation: ${tentativeResult.safeSequence
        .map((process) => `P${process}`)
        .join(" → ")}.`,
    });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Cpu size={23} /></div>
          <div>
            <div className="brand-name">KERNEL <span>3D</span></div>
            <div className="brand-subtitle">RESOURCE ALLOCATION INTELLIGENCE</div>
          </div>
        </div>

        <div className="system-status">
          <span className="status-dot" />
          SYSTEM ONLINE
          <span className="status-divider">/</span>
          BANKER'S ALGORITHM
        </div>

        <button className="secondary-button" onClick={resetSimulation}>
          <RotateCcw size={15} /> Reset
        </button>
      </header>

      <section className="hero">
        <div>
          <div className="eyebrow"><Activity size={14} /> OPERATING SYSTEMS LAB / 01</div>
          <h1>Resource <span>Universe</span></h1>
          <p className="hero-description">
            Explore resource allocation, simulate process requests, and inspect
            system safety in real time.
          </p>
        </div>
        <div className={`verdict-chip ${result?.isSafe ? "safe" : "unsafe"}`}>
          {result?.isSafe ? <ShieldCheck size={17} /> : <ShieldAlert size={17} />}
          {result?.isSafe ? "SAFE STATE" : "UNSAFE STATE"}
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">PROCESSES</span>
          <strong>{input.allocation.length.toString().padStart(2, "0")}</strong>
          <span className="stat-foot">Active process units</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">RESOURCE TYPES</span>
          <strong>{input.available.length.toString().padStart(2, "0")}</strong>
          <span className="stat-foot">Independent resource classes</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">SAFE SEQUENCE</span>
          <strong>{result?.safeSequence.length ?? 0}<small>/{input.allocation.length}</small></strong>
          <span className="stat-foot">Processes currently schedulable</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">EXECUTION STEP</span>
          <strong>{stepIndex.toString().padStart(2, "0")}<small>/{result?.steps.length ?? 0}</small></strong>
          <span className="stat-foot">Safety trace progress</span>
        </div>
      </section>

      <section className="main-grid">
        <article className="panel matrix-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">01 / SYSTEM STATE</div>
              <h2>Resource Matrix</h2>
            </div>
            <span className="panel-tag">EDITABLE</span>
          </div>

          <p className="panel-description">
            Adjust Allocation, Max, and Available. Need is calculated automatically.
          </p>

          <div className="matrix-block">
            <div className="matrix-title">
              <span>ALLOCATION</span>
              <span className="matrix-symbol">Currently held</span>
            </div>
            <div className="matrix-table">
              <div className="matrix-row matrix-header">
                <span>PROC</span>
                {RESOURCE_NAMES.map((name, j) => <span key={name} style={{ color: RESOURCE_COLORS[j] }}>{name.slice(-1)}</span>)}
              </div>
              {input.allocation.map((row, i) => (
                <div className="matrix-row" key={`allocation-${i}`}>
                  <strong>P{i}</strong>
                  {row.map((value, j) => (
                    <NumberCell
                      key={j}
                      value={value}
                      label={`Allocation P${i} resource ${j}`}
                      onChange={(next) => updateMatrix("allocation", i, j, next)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="matrix-block">
            <div className="matrix-title">
              <span>MAX CLAIM</span>
              <span className="matrix-symbol">Declared maximum</span>
            </div>
            <div className="matrix-table">
              <div className="matrix-row matrix-header">
                <span>PROC</span>
                {RESOURCE_NAMES.map((name, j) => <span key={name} style={{ color: RESOURCE_COLORS[j] }}>{name.slice(-1)}</span>)}
              </div>
              {input.max.map((row, i) => (
                <div className="matrix-row" key={`max-${i}`}>
                  <strong>P{i}</strong>
                  {row.map((value, j) => (
                    <NumberCell
                      key={j}
                      value={value}
                      label={`Max P${i} resource ${j}`}
                      onChange={(next) => updateMatrix("max", i, j, next)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="matrix-block">
            <div className="matrix-title">
              <span>NEED</span>
              <span className="matrix-symbol">Max − Allocation</span>
            </div>
            <div className="matrix-table">
              <div className="matrix-row matrix-header">
                <span>PROC</span>
                {RESOURCE_NAMES.map((name, j) => <span key={name} style={{ color: RESOURCE_COLORS[j] }}>{name.slice(-1)}</span>)}
              </div>
              {need.map((row, i) => (
                <div className="matrix-row" key={`need-${i}`}>
                  <strong>P{i}</strong>
                  {row.map((value, j) => (
                    <span className="matrix-value" key={j}>{value}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="available-block">
            <div>
              <div className="matrix-title">AVAILABLE RESOURCES</div>
              <div className="available-caption">Unallocated instances</div>
            </div>
            <div className="available-inputs">
              {input.available.map((value, j) => (
                <label className="available-field" key={j}>
                  <span style={{ color: RESOURCE_COLORS[j] }}>{RESOURCE_NAMES[j].slice(-1)}</span>
                  <NumberCell
                    value={value}
                    label={`Available resource ${j}`}
                    onChange={(next) => updateAvailable(j, next)}
                  />
                </label>
              ))}
            </div>
          </div>
        </article>

        <article className="panel universe-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">02 / LIVE VISUALIZATION</div>
              <h2>Resource Universe</h2>
            </div>
            <span className="live-tag"><span className="status-dot" /> LIVE</span>
          </div>
          <p className="panel-description">
            Rotate the scene to inspect process nodes and their resource links.
          </p>

          <div className="scene-container">
            <ResourceScene
              allocation={input.allocation}
              activeProcess={activeProcess}
              completedProcesses={completedProcesses}
            />
            <div className="scene-label scene-label-left">RESOURCE NODES</div>
            <div className="scene-label scene-label-right">PROCESS NODES</div>
          </div>

          <div className="scene-legend">
            {RESOURCE_NAMES.map((name, j) => (
              <span key={name}><i style={{ background: RESOURCE_COLORS[j] }} />{name}</span>
            ))}
          </div>
          <div className="process-node-list">
            {input.allocation.map((_, i) => (
              <div
                className={`process-pill ${activeProcess === i ? "active" : ""} ${completedProcesses.includes(i) ? "completed" : ""}`}
                key={i}
              >
                <span />P{i}
                {completedProcesses.includes(i) && <CheckCircle2 size={12} />}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="lower-grid">
        <article className="panel safety-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">03 / DEADLOCK AVOIDANCE</div>
              <h2>Safety Analysis</h2>
            </div>
            <Terminal size={19} className="heading-icon" />
          </div>

          <div className={`analysis-banner ${result?.isSafe ? "safe" : "unsafe"}`}>
            {result?.isSafe ? <CheckCircle2 size={21} /> : <XCircle size={21} />}
            <div>
              <strong>{result?.isSafe ? "System is in a safe state" : "System is in an unsafe state"}</strong>
              <span>
                {result?.isSafe
                  ? "At least one complete execution order exists."
                  : "No complete safe sequence was found for the current state."}
              </span>
            </div>
          </div>

          <div className="sequence-label">SAFE SEQUENCE</div>
          <div className="sequence-flow">
            {result?.safeSequence.length ? result.safeSequence.map((process, i) => (
              <div className="sequence-item" key={process}>
                <span className={`sequence-node ${completedProcesses.includes(process) ? "done" : ""}`}>P{process}</span>
                {i < result.safeSequence.length - 1 && <ArrowRight size={15} />}
              </div>
            )) : <span className="empty-state">No safe sequence available.</span>}
          </div>

          <div className="trace-divider" />
          <div className="trace-heading">
            <div>
              <div className="sequence-label">EXECUTION TRACE</div>
              <p>Advance one process at a time.</p>
            </div>
            <button className="primary-button" onClick={runNextStep} disabled={!result || stepIndex >= result.steps.length}>
              <Play size={14} /> Next step
            </button>
          </div>

          {currentStep ? (
            <div className="trace-card">
              <div className="trace-card-top">
                <span className="trace-process">P{currentStep.process}</span>
                <span className="trace-complete"><CheckCircle2 size={14} /> COMPLETED</span>
              </div>
              <div className="trace-equation">
                <div><span>WORK BEFORE</span><strong>[{currentStep.workBefore.join(", ")}]</strong></div>
                <ArrowRight size={16} />
                <div><span>WORK AFTER</span><strong>[{currentStep.workAfter.join(", ")}]</strong></div>
              </div>
              <div className="trace-need">Need: [{currentStep.need.join(", ")}] ≤ Work before execution</div>
            </div>
          ) : (
            <div className="trace-empty">
              <Activity size={19} />
              <span>Run the next step to inspect Work and Need comparisons.</span>
            </div>
          )}

          {result && stepIndex >= result.steps.length && result.isSafe && (
            <div className="completion-note">All processes in the safe sequence have completed.</div>
          )}
        </article>

        <article className="panel request-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">04 / WHAT-IF SIMULATION</div>
              <h2>Future Request Lab</h2>
            </div>
            <FlaskConical size={20} className="heading-icon" />
          </div>
          <p className="panel-description">
            Simulate a process requesting more resources. The state changes only if the request passes the safety check.
          </p>

          <label className="form-label" htmlFor="process-choice">REQUESTING PROCESS</label>
          <select
            id="process-choice"
            className="request-select"
            value={processChoice}
            onChange={(event) => {
              setProcessChoice(Number(event.target.value));
              setRequestMessage(null);
            }}
          >
            {input.allocation.map((_, i) => (
              <option value={i} key={i}>Process P{i}</option>
            ))}
          </select>

          <div className="request-vector-heading">
            <span className="form-label">REQUEST VECTOR</span>
            <span className="matrix-symbol">[A, B, C]</span>
          </div>
          <div className="request-vector">
            {request.map((value, j) => (
              <label className="request-resource" key={j}>
                <span style={{ color: RESOURCE_COLORS[j] }}>{RESOURCE_NAMES[j]}</span>
                <NumberCell
                  value={value}
                  label={`Request for resource ${j}`}
                  onChange={(next) => {
                    setRequest((previous) => previous.map((v, i) => i === j ? next : v));
                    setRequestMessage(null);
                  }}
                />
                <small>Need: {need[processChoice]?.[j] ?? 0} · Free: {input.available[j]}</small>
              </label>
            ))}
          </div>

          <button className="primary-button request-submit" onClick={submitRequest}>
            <FlaskConical size={16} /> Evaluate & simulate request
          </button>

          {requestMessage ? (
            <div className={`request-result ${requestMessage.type}`}>
              <div className="request-result-title">
                {requestMessage.type === "success"
                  ? <CheckCircle2 size={18} />
                  : requestMessage.type === "error"
                    ? <ShieldAlert size={18} />
                    : <Activity size={18} />}
                <strong>{requestMessage.title}</strong>
              </div>
              <p>{requestMessage.detail}</p>
            </div>
          ) : (
            <div className="request-hint">
              <ShieldCheck size={17} />
              <span>Request checks: Need limit → Available limit → tentative allocation → safety test.</span>
            </div>
          )}

          <div className="request-rules">
            <div><span>01</span>Request ≤ Need</div>
            <div><span>02</span>Request ≤ Available</div>
            <div><span>03</span>Resulting state must be safe</div>
          </div>
        </article>
      </section>

      <footer className="app-footer">
        <span>KERNEL 3D <span className="footer-dot">/</span> BANKER'S ALGORITHM SIMULATOR</span>
        <span>BUILT FOR OS LEARNING <span className="footer-dot">·</span> INTERACTIVE MODE</span>
      </footer>
    </main>
  );
}

export default App;
