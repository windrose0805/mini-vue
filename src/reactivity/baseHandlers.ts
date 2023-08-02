import { track, trigger } from "./effect";

function createGetter(isReadonly = false) {
  return function (target, key) {
    const res = Reflect.get(target, key);
    //收集依赖
    if (!isReadonly) track(target, key);
    return res;
  };
}

function creatSetter(isReadonly = false) {
  return function (target, key, value) {
    if (isReadonly) {
      console.warn("只读");
      return true;
    }
    const res = Reflect.set(target, key, value);
    //触发依赖
    trigger(target, key);
    return res;
  };
}

export const mutableHandles = {
  get: createGetter(),
  set: creatSetter(),
};

export const readonlyHandles = {
  get: createGetter(true),
  set: creatSetter(true),
};