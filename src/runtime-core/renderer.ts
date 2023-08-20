import { isObject } from "../shared/index";
import { createComponentInstance, setupCompoent } from "./component";

export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode, container) {
  // 处理组件
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
    processComponent(vnode, container);
  }
}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function processElement(vnode, container) {
  const el = document.createElement(vnode.type);

  const { children } = vnode;

  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    mountChildren(children, el);
  }

  const { props } = vnode;

  for (const key in props) {
    const val = props[key];
    el.setAttribute(key, val);
  }

  container.append(el);
}

function mountChildren(children, container) {
  children.forEach((v) => {
    patch(v, container);
  });
}

function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode);
  setupCompoent(instance);
  setupRenderEffect(instance, container);
}
function setupRenderEffect(instance: any, container) {
  const subTree = instance.render();
  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container);
}
