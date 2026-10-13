export function galleryLayout(width, height) {
  const compact = width < 768;
  const short = Math.min(width, height);
  return {
    compact,
    cardHeight: Math.min(height * .435, compact ? width * .90 / 1.7 : Infinity),
    ringRadius: short * (compact ? .32 : .30) / width,
    ringBand: short * .14 / width,
    pixelRatioLimit: compact ? 1.25 : 1.5,
  };
}
