/**
 * Returns Tailwind animation delay using arbitrary property (avoids ambiguity warning)
 * Example: index 0 -> [animation-delay:0ms], index 1 -> [animation-delay:100ms]
 */
export const delayClass = (index: number, step: number = 100): string => {
  return `[animation-delay:${index * step}ms]`;
};