import { effect } from "../index";
import { isOn } from "../shared/index";
import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupCompoent } from "./component";
import { shouldUpdateComponent } from "./componentUtils";
import { createAppAPI } from "./createApp";
import { queueJobs } from "./scheduler";
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
          processComponent(n1, n2, container, anchor);
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

  function mountText(vnode, container) {
    const el = (vnode.el = document.createTextNode(vnode.children));
    container.append(el);
  }

  function processComponent(n1, n2, container, anchor) {
    if (!n1) {
      mountComponent(n2, container, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }

  function mountComponent(initialVNode, container, anchor) {
    const instance = (initialVNode.component =
      createComponentInstance(initialVNode));
    setupCompoent(instance);
    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }

  function processElement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
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

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      hostRemove(el);
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
      // 中间对比

      let s1 = i;
      let s2 = i;

      // 记录处理过的节点
      const tobePatched = e2 - s2 + 1;
      let patched = 0;

      // 记录新节点的下标
      const keyToNewIndexMap = new Map();

      // 记录新节点在老节点列表里的下标
      // 0代表该节点未在老节点列表里出现过
      const newIndexToOldIndexMap = new Array(tobePatched).fill(0);

      // 记录移动的最大下标
      let moved = false;
      let maxNewIndexSoFar = 0;

      for (let i = s2; i <= e2; i++) {
        keyToNewIndexMap.set(c2[i].key, i);
      }

      // 新节点的下标
      let newIndex;

      for (let i = s1; i <= e1; i++) {
        if (patched >= tobePatched) {
          hostRemove(e1[i].el);
          continue;
        }
        newIndex = keyToNewIndexMap.get(c1[i].key);

        if (newIndex === undefined) {
          for (let j = s2; j <= e2; j++) {
            if (c2[j].key === c1[i].key) {
              newIndex = j;
              break;
            }
          }
        }

        if (newIndex !== undefined) {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(c1[i], c2[newIndex], container, parentComponent, parentAnchor);
          patched++;
        } else {
          hostRemove(c1[i].el);
        }
      }

      // 计算最长递增子序列的下标
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];

      // 最长递增子序列的下标
      console.log(newIndexToOldIndexMap, increasingNewIndexSequence);

      let j = increasingNewIndexSequence.length - 1;

      for (let i = tobePatched - 1; i >= 0; i--) {
        // 移动位置
        const nextIndex = s2 + i;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 > l2 ? null : c2[nextIndex + 1].el;

        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            // 创建节点

            insert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
      }
    }
  }

  function setupRenderEffect(instance: any, vnode, container, anchor) {
    const { proxy } = instance;
    instance.update = effect(
      () => {
        if (!instance.isMounted) {
          const subTree = (instance.subTree = instance.render.call(proxy));
          // vnode -> element -> mountElement
          patch(null, subTree, container, instance, anchor);
          vnode.el = subTree.el;
          
          instance.isMounted = true;
        } else {
          // 更新
          const { next, vnode } = instance;
          if (next) {
            next.el = vnode.el;
            updateComponentPreRender(instance, next);
          }
          
          const subTree = instance.render.call(proxy);
          const prevTree = instance.subTree;
          vnode.el = subTree.el;
          instance.subTree = subTree;
          // vnode -> patch
          patch(prevTree, subTree, container, instance, anchor);
        }
      },
      {
        scheduler() {
          console.log("update-scheduler");
          queueJobs(instance.update);
        },
      }
    );
  }

  return {
    createApp: createAppAPI(render),
  };
}

function updateComponentPreRender(instance, nextVNode) {
  instance.vnode = nextVNode;
  instance.next = null;
  instance.props = nextVNode.props;
}

function getSequence(arr: number[]): number[] {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
