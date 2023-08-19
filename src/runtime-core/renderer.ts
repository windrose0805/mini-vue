import { createComponentInstance, setupCompoent } from "./component";

export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode, container) {
  // 处理组件
  processComponent(vnode, container);
}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode);
  setupCompoent(instance);
  setupRenderEffect(instance, container);
}
function setupRenderEffect(instance: any, container) {
  debugger
  const subTree = instance.render();
  // vnode -> patch
  // vnode -> element -> mountElement
  patch(subTree, container);
}
