export function initSlots(instance, children) {
  if (children) normalizeObjectSlots(instance.slots = {}, children);
}

function normalizeObjectSlots(slots, children) {
  for (const key in children) {
    const value = children[key];
    slots[key] = (props) => normalizeSlotValue(value(props));
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
