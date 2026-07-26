export function applySelectionRange(
  selected: ReadonlySet<string>,
  orderedKeys: string[],
  startIndex: number,
  endIndex: number,
  action: "add" | "remove",
): Set<string> {
  const next = new Set(selected);
  const low = Math.min(startIndex, endIndex);
  const high = Math.max(startIndex, endIndex);
  for (let index = low; index <= high; index += 1) {
    const key = orderedKeys[index];
    if (key) {
      if (action === "add") next.add(key);
      else next.delete(key);
    }
  }
  return next;
}
