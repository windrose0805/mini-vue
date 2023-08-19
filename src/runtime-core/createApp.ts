import { createComponentInstance } from "./component";
import { createVNode } from "./vnode";
import { render } from "./renderer";

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      // component -> vnode
      // 所有逻辑处理基于vnode

      const vnode = createVNode(rootComponent);

      render(vnode, rootContainer);
    },
  };
}
