export function createVNode(type, props?: any, children?: any) {
  const vnode = {
    type,
    props,
    children,
  };

  return vnode;
}
