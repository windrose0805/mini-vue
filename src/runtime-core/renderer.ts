import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupCompoent } from "./component";

export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode, container) {
  // 处理组件
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    processComponent(vnode, container);
  }
}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function processElement(vnode, container) {
  mountElement(vnode, container);
}

function mountElement(vnode, container) {
  const el = (vnode.el = document.createElement(vnode.type));

  const { children, shapeFlag } = vnode;

  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el);
  }

  const { props } = vnode;

  for (const key in props) {
    const val = props[key];
    const isOn = (key: string) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
      const event = key.slice(2).toLocaleLowerCase()
      el.addEventListener(event, val);
    } else {
      el.setAttribute(key, val);
    }
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
  setupRenderEffect(instance, vnode, container);
}
function setupRenderEffect(instance: any, vnode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container);

  vnode.el = subTree.el;
}
