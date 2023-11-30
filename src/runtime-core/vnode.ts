// 完整参数签名
// https://cn.vuejs.org/api/render-function.html#h
// function h(
//   type: string | Component,
//   props?: object | null,
//   children?: Children | Slot | Slots
// ): VNode

// // 省略 props
// function h(type: string | Component, children?: Children | Slot): VNode

// type Children = string | number | boolean | VNode | null | Children[]

// type Slot = () => Children

// type Slots = { [name: string]: Slot }

import { ShapeFlags } from "../shared/ShapeFlags";

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");

export function createVNode(type, props?: any, children?: any) {
  const vnode = {
    type,
    props,
    children,
    key: props && props.key,
    shapeFlag: getShapFlag(type),
    el: null,
  };

  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  normalizeChildren(vnode, children);

  return vnode;
}

// children还要区分是不是slots
export function normalizeChildren(vnode, children) {
  if (typeof children === "object") {
    if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
      // 如果是 element 类型的话，那么 children 肯定不是 slots
    } else {
      // 这里就必然是 component 了
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
    }
  }
}

function getShapFlag(type: any) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}
