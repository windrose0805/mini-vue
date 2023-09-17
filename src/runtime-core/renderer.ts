import { effect } from "../index";
import { isOn } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupCompoent } from "./component";
import { Fragment, Text } from "./vnode";
import { patchProp } from "../runtime-dom/index";

export function render(n1, n2, container) {
  patch(n1, n2, container);
}

// 新旧节点对比

function patch(n1, n2, container) {
  // 处理组件
  const { type, shapeFlag } = n2;
  switch (type) {
    case Fragment:
      processFragment(n1, n2, container);
      break;
    case Text: {
      processText(n1, n2, container);
      break;
    }
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(n1, n2, container);
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(n1, n2, container);
      }
  }
}

// Fragment特殊节点处理
function processFragment(n1, n2, container) {
  mountChildren(n2.children, container);
}

// text特殊节点处理
function processText(n1, n2, container) {
  mountText(n2, container);
}

function processComponent(n1, n2, container) {
  mountComponent(n2, container);
}

function processElement(n1, n2, container) {
  if (!n1) {
    mountElement(n2, container);
  } else {
    patchElement(n1, n2, container);
  }
}

function patchElement(n1, n2, container) {
  const oldProps = n1.props || EMPTY_ONJ;
  const newProps = n2.props || EMPTY_ONJ;
  const el = (n2.el = n1.el);
  patchChildren(n1, n2)
  patchProps(el, oldProps, newProps);
}

const EMPTY_ONJ = {};


function patchChildren(n1, n2, ) {

}

function patchProps(el, oldProps, newProps) {
  if (oldProps === newProps) return;
  for (const key in newProps) {
    const prevProp = oldProps[key];
    const nextProp = newProps[key];
    if (prevProp !== nextProp) {
      patchProp(el, key, prevProp, nextProp);
    }
  }

  if (oldProps !== EMPTY_ONJ) {
    for (const key in oldProps) {
      const prevProp = oldProps[key];
      if (!(key in newProps)) {
        patchProp(el, key, prevProp, null);
      }
    }
  }
}

function mountElement(n2, container) {
  const el = (n2.el = document.createElement(n2.type));

  const { children, shapeFlag } = n2;

  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el);
  }

  const { props } = n2;

  for (const key in props) {
    const val = props[key];
    if (isOn(key)) {
      const event = key.slice(2).toLocaleLowerCase();
      el.addEventListener(event, val);
    } else {
      el.setAttribute(key, val);
    }
  }

  container.append(el);
}

function mountChildren(n2, container) {
  n2.forEach((v) => {
    patch(null, v, container);
  });
}

function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode);
  setupCompoent(instance);
  setupRenderEffect(instance, vnode, container);
}

function mountText(vnode, container) {
  const el = (vnode.el = document.createTextNode(vnode.children));
  container.append(el);
}

function setupRenderEffect(instance: any, vnode, container) {
  const { proxy } = instance;
  effect(() => {
    if (!instance.isMounted) {
      const subTree = (instance.subTree = instance.render.call(proxy));
      // vnode -> patch
      // vnode -> element -> mountElement
      patch(null, subTree, container);
      vnode.el = subTree.el;

      instance.isMounted = true;
    } else {
      const subTree = instance.render.call(proxy);
      const prevTree = instance.subTree;
      vnode.el = subTree.el;
      instance.subTree = subTree;
      patch(prevTree, subTree, container);
    }
  });
}
