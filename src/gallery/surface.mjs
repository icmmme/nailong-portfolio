export function smooth(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// The resting silhouette and the additional motion response are independent.
export function surfaceColumn(x, halfWidth, velocity) {
  const q = x / halfWidth * 1.15 - .2;
  const g = Math.exp(-q * q);
  const derivative = (Math.PI * Math.cos(Math.PI * q) - 2 * q * Math.sin(Math.PI * q)) * g;
  const edge = 1 - smooth(.55, 1, Math.abs(x / halfWidth));
  const speed = Math.max(-1, Math.min(1, velocity));
  const twist = .15 * speed * smooth(.15, .65, Math.abs(x / halfWidth)) * Math.sign(x) * edge;
  const angle = -.16 * derivative / Math.PI + twist;
  const lean = Math.max(-1, Math.min(1, x / halfWidth));
  const depth = -halfWidth * .2 * Math.sin(Math.PI * q) * g - halfWidth * .12 * lean * (1.5 - .5 * lean * lean);
  return { sin: Math.sin(angle), cos: Math.cos(angle), y: .03 * x, z: depth * (1 + .15 * Math.abs(speed) * edge), twist };
}
