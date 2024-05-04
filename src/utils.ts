export function capitalizeFirst(str: string, allCapsMax = 0) {
  if (str.length <= allCapsMax) return str.toUpperCase();
  return str.charAt(0).toUpperCase() + str.slice(1);
}