export const extend = Object.assign;

export const isObject = (val) => {
  return val !== null && typeof val === "object";
};

export function hasChanged(value, oldValue) {
  return !Object.is(value, oldValue);
}