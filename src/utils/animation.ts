/**
 * Returns Tailwind delay class based on index
 */
const delays = [
  "delay-0",
  "delay-75",
  "delay-100",
  "delay-150",
  "delay-200",
  "delay-300",
  "delay-500",
  "delay-700",
  "delay-1000",
];

export const delayClass = (index: number) =>
  delays[Math.min(index, delays.length - 1)];