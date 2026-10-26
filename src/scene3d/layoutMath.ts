export function computeProcessPositions(count: number): [number, number, number][] {
  const radius = Math.max(3.6, Math.min(5.2, 3.2 + count * 0.22));
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const x = Number((Math.cos(angle) * radius).toFixed(3));
    const y = Number((Math.sin(angle) * (radius * 0.68)).toFixed(3));
    const z = Number((Math.sin(i * 1.4) * 0.7).toFixed(3));
    return [x, y, z];
  });
}

export function computeResourcePositions(count: number): [number, number, number][] {
  if (count === 1) return [[0, 0, 0]];
  const radius = Math.max(1.6, Math.min(2.7, 1.2 + count * 0.25));
  return Array.from({ length: count }, (_, j) => {
    const angle = (j / count) * Math.PI * 2;
    const x = Number((Math.cos(angle) * radius).toFixed(3));
    const y = Number((Math.sin(angle) * (radius * 0.6)).toFixed(3));
    const z = j % 2 === 0 ? 0.35 : -0.35;
    return [x, y, z];
  });
}
