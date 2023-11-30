import { effect } from "../index";
import { isOn } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupCompoent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRnderer(options) {
  const {
    createElement,
    patchProp,
    insert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  function render(n1, n2, container) {
    patch(n1, n2, container);
  }

  // 新旧节点对比

  function patch(
    n1,
    n2,
    container = null,
    parentComponent = null,
    anchor = null
  ) {
    // 处理组件
    const { type, shapeFlag } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text: {
        processText(n1, n2, container);
        break;
      }
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor);
        }
    }
  }

  // Fragment特殊节点处理
  function processFragment(n1, n2, container, parentComponent, anchor) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  // text特殊节点处理
  function processText(n1, n2, container) {
    mountText(n2, container);
  }

  function processComponent(n1, n2, container, parentComponent, anchor) {
    mountComponent(n2, container, parentComponent, anchor);
  }

  function processElement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    const oldProps = n1.props || EMPTY_ONJ;
    const newProps = n2.props || EMPTY_ONJ;
    const el = (n2.el = n1.el);
    patchProps(el, oldProps, newProps);
    patchChildren(n1, n2, el, parentComponent, anchor);
  }

  function patchProps(el, oldProps, newProps) {
    for (const key in newProps) {
      const prevProp = oldProps[key];
      const nextProp = newProps[key];
      if (prevProp !== nextProp) {
        patchProp(el, key, prevProp, nextProp);
      }
    }
    for (const key in oldProps) {
      const prevProp = oldProps[key];
      const nextProp = null;
      if (!(key in newProps)) {
        patchProp(el, key, prevProp, nextProp);
      }
    }
  }

  const EMPTY_ONJ = {};

  function patchChildren(n1, n2, el, parentComponent, anchor) {
    const { shapeFlag: prevShapeFlag } = n1;
    const c1 = n1.children;
    const { shapeFlag } = n2;
    const c2 = n2.children;
    const container = el;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 1、老的children清空
        unmountChildren(n1.children);
      }
      // 2、设置新的text
      if (c1 !== c2) {
        hostSetElementText(container, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, "");
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  // diff算法
  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    // 起始索引
    let i = 0;
    const l2 = c2.length;
    const l1 = c1.length;
    let e1 = l1 - 1;
    let e2 = l2 - 1;
    function isSameVNodeType(n1, n2) {
      return n1.type === n1.type && n1.key === n2.key;
    }

    // 左侧对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      i++;
    }

    // 右侧对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // 新的比老的多 需要创建
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        // 定位的锚点
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
      // 老的比新的多，需要删除
    } else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      // 乱序的部分
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      hostRemove(el);
    }
  }

  function mountElement(n2, container, parentComponent, anchor) {
    const el = (n2.el = createElement(n2.type));

    const { children, shapeFlag } = n2;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent, anchor);
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

    insert(el, container, anchor);
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }

  function mountComponent(vnode, container, parentComponent, anchor) {
    const instance = createComponentInstance(vnode);
    setupCompoent(instance);
    setupRenderEffect(instance, vnode, container, parentComponent, anchor);
  }

  function mountText(vnode, container) {
    const el = (vnode.el = document.createTextNode(vnode.children));
    container.append(el);
  }

  function setupRenderEffect(
    instance: any,
    vnode,
    container,
    parentComponent,
    anchor
  ) {
    const { proxy } = instance;
    effect(() => {
      if (!instance.isMounted) {
        const subTree = (instance.subTree = instance.render.call(proxy));
        // vnode -> patch
        // vnode -> element -> mountElement
        patch(null, subTree, container, parentComponent, anchor);
        vnode.el = subTree.el;

        instance.isMounted = true;
      } else {
        const subTree = instance.render.call(proxy);
        const prevTree = instance.subTree;
        vnode.el = subTree.el;
        instance.subTree = subTree;
        patch(prevTree, subTree, container, parentComponent, anchor);
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
