/**
 * Reorder an array by moving an item from one position to another
 */
export function reorderArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = Array.from(array);
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Move an item in array to a new position
 */
export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  return reorderArray(array, from, to);
}
