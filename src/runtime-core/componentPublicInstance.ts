import { hasOwn } from "../shared/index";

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props } = instance;
    if (key in setupState) {
      return setupState[key];
    }
    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }
    if (key === "$el") {
      return instance.vnode.el;
    }
    if (key === "$slots") {
      return instance.slots;
    }
  },
};
