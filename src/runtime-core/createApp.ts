import { createVNode } from "./vnode";
// import { render } from "./renderer";

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        // component -> vnode
        // 所有逻辑处理基于vnode
        const vnode = createVNode(rootComponent);

        render(null, vnode, rootContainer);
      },
    };
  };
}
