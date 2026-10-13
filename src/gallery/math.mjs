export const wrap = (value, length) => ((value + length / 2) % length + length) % length - length / 2;
export const damp = (current, target, rate, delta) => current + (target - current) * (1 - Math.exp(-rate * delta));
export const wasDrag = (distance) => distance > 7;
export const pointerPosition = (x, y, bounds) => ({
  x: Math.max(-1, Math.min(1, (x - bounds.left) / Math.max(bounds.width, 1) * 2 - 1)),
  y: Math.max(-1, Math.min(1, (y - bounds.top) / Math.max(bounds.height, 1) * 2 - 1)),
});
