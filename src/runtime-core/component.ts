export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
  };
  return component;
}

export function setupCompoent(instance) {
  // todo
  // initProps()
  // initSlots()
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
  const Component = instance.vnode.type;

  instance.proxy = new Proxy(
    {},
    {
      get(target, key) {
        const { setupState } = instance;
        if (key in setupState) {
          return setupState[key];
        }
        if (key === "$el") {
          return instance.vnode.el;
        }
      },
    }
  );

  const { setup } = Component;
  if (setup) {
    const setupResult = setup();

    handleSetupResult(instance, setupResult);
  }
}
function handleSetupResult(instance, setupResult: any) {
  // todo function
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }
  finishComponentSetup(instance);
}
function finishComponentSetup(instance: any) {
  const Component = instance.type;
  if (Component.render) {
    instance.render = Component.render;
  }
}
