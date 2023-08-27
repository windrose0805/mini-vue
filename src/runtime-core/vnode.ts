import { ShapeFlags } from "../shared/ShapeFlags";

export function createVNode(type, props?: any, children?: any) {
  // type -> {setup, render}
  const vnode = {
    type,
    props,
    children,
    shapeFlag: getShapFlag(type),
    // el: null,
  };

  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  return vnode;
}

function getShapFlag(type: any) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}
