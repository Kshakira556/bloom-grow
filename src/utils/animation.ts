/**
 * Returns Tailwind delay class based on index
 * Example: index 0 -> delay-[0ms], index 1 -> delay-[100ms]
 */
export const delayClass = (index: number, step: number = 100): string => {
  return `delay-[${index * step}ms]`;
};
