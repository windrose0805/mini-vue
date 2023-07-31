import { mutableHandles, readonlyHandles } from "./baseHandlers";

export function reactive(raw) {
  return new Proxy(raw, mutableHandles);
}

export function readonly(raw) {
  return new Proxy(raw, readonlyHandles);
}
