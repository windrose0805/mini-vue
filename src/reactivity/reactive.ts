import { mutableHandlers, readonlyHandlers } from "./baseHandlers";

export function reactive(target) {
  return createReactiveObject(target, mutableHandlers);
}

export function readonly(target) {
  return createReactiveObject(target, readonlyHandlers);
}

export function createReactiveObject(target, baseHandlers) {
  return new Proxy(target, baseHandlers);
}
