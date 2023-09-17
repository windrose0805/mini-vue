export const extend = Object.assign;

export const isOn = (key) => /^on[A-Z]/.test(key);

export const isObject = (val) => {
  return val !== null && typeof val === "object";
};

export function hasChanged(value, oldValue) {
  return !Object.is(value, oldValue);
}

export function hasOwn(val, key) {
  return Object.prototype.hasOwnProperty.call(val, key);
}

export const camelize = (str) => {
  return str.replace(/-(\w)/g, (_, c) => {
    return c ? c.toUpperCase() : "";
  });
};

export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const toHandlerKey = (str) => {
  return str ? "on" + capitalize(str) : "";
};
