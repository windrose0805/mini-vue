const extend = Object.assign;
const isOn = (key) => /^on[A-Z]/.test(key);
const isObject = (val) => {
    return val !== null && typeof val === "object";
};
function hasChanged(value, oldValue) {
    return !Object.is(value, oldValue);
}
function hasOwn(val, key) {
    return Object.prototype.hasOwnProperty.call(val, key);
}
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : "";
    });
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? "on" + capitalize(str) : "";
};

// 使用位运算处理类型
var ShapeFlags;
(function (ShapeFlags) {
    ShapeFlags[ShapeFlags["ELEMENT"] = 1] = "ELEMENT";
    ShapeFlags[ShapeFlags["STATEFUL_COMPONENT"] = 4] = "STATEFUL_COMPONENT";
    ShapeFlags[ShapeFlags["TEXT_CHILDREN"] = 8] = "TEXT_CHILDREN";
    ShapeFlags[ShapeFlags["ARRAY_CHILDREN"] = 16] = "ARRAY_CHILDREN";
    ShapeFlags[ShapeFlags["SLOTS_CHILDREN"] = 32] = "SLOTS_CHILDREN"; // 0010 0000
})(ShapeFlags || (ShapeFlags = {}));

// 完整参数签名
const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        key: props && props.key,
        shapeFlag: getShapFlag(type),
        el: null,
    };
    if (typeof children === "string") {
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    }
    normalizeChildren(vnode, children);
    return vnode;
}
// children还要区分是不是slots
function normalizeChildren(vnode, children) {
    if (typeof children === "object") {
        if (vnode.shapeFlag & ShapeFlags.ELEMENT) ;
        else {
            // 这里就必然是 component 了
            vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
        }
    }
}
function getShapFlag(type) {
    return typeof type === "string"
        ? ShapeFlags.ELEMENT
        : ShapeFlags.STATEFUL_COMPONENT;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function createDep() {
    return new Set();
}

let activeEffect;
let shouldTrack;
const targetMap = new WeakMap();
class ReactiveEffect {
    constructor(fn, scheduler) {
        // deps是数组的原因：effect里面可能订阅了不同的响应式变量
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        // 控制依赖能不能被收集的开关
        shouldTrack = true;
        activeEffect = this;
        // 当run被执行时，就触发收集依赖
        const result = this._fn();
        shouldTrack = false;
        return result;
    }
    stop() {
        // 防止stop被重复调用
        if (this.active) {
            cleanEffects(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanEffects(effect) {
    // 将effect里所有响应式变量的dep删除该effect
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
}
function track(target, key) {
    if (!isTracking())
        return;
    // target -> key -> dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = createDep();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function isTracking() {
    return activeEffect !== undefined && shouldTrack;
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    // 反向收集dep
    activeEffect.deps.push(dep);
}
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
function stop(runner) {
    runner.effect.stop();
}

const get = createGetter();
const set = creatSetter();
const readonlyGet = createGetter(true);
function createGetter(isReadonly = false) {
    return function (target, key) {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        // 收集依赖
        if (!isReadonly)
            track(target, key);
        return res;
    };
}
function creatSetter() {
    return function (target, key, value) {
        const res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set: (target, key) => {
        // readonly 的响应式对象不可以修改值
        console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
        return true;
    },
};

function reactive(target) {
    return createReactiveObject(target, mutableHandlers);
}
function readonly(target) {
    return createReactiveObject(target, readonlyHandlers);
}
function createReactiveObject(target, baseHandlers) {
    const proxy = new Proxy(target, baseHandlers);
    return proxy;
}

function emit(instance, event, ...args) {
    // tpp开发，先写特定行为，再重构成一个特定的行为
    // add -> onAdd
    // add-foo -> addFoo
    console.log("emit", event);
    const { props } = instance;
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        if (key === "$el") {
            return instance.vnode.el;
        }
        if (key === "$slots") {
            return instance.slots;
        }
    },
};

function initSlots(instance, children) {
    if (children)
        normalizeObjectSlots(instance.slots = {}, children);
}
function normalizeObjectSlots(slots, children) {
    for (const key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupCompoent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.vnode.type;
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(readonly(instance.props), { emit: instance.emit });
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // todo function
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    // 方便跟踪被谁赋值，中间层都得经过，便于追踪
    return (currentInstance = instance);
}

// import { render } from "./renderer";
function createAppAPI(render) {
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

function createRnderer(options) {
    const { createElement, patchProp, insert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(n1, n2, container) {
        patch(n1, n2, container);
    }
    // 新旧节点对比
    function patch(n1, n2, container = null, parentComponent = null, anchor = null) {
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
                }
                else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
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
        }
        else {
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
        }
        else {
            if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                hostSetElementText(container, "");
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    // diff算法
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
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
            }
            else {
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
            }
            else {
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
        }
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
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
                    }
                    else {
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(c1[i], c2[newIndex], container, parentComponent, parentAnchor);
                    patched++;
                }
                else {
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
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // 创建节点
                        insert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
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
        }
        else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(children, el, parentComponent, anchor);
        }
        const { props } = n2;
        for (const key in props) {
            const val = props[key];
            if (isOn(key)) {
                const event = key.slice(2).toLocaleLowerCase();
                el.addEventListener(event, val);
            }
            else {
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
    function setupRenderEffect(instance, vnode, container, parentComponent, anchor) {
        const { proxy } = instance;
        effect(() => {
            if (!instance.isMounted) {
                const subTree = (instance.subTree = instance.render.call(proxy));
                // vnode -> patch
                // vnode -> element -> mountElement
                patch(null, subTree, container, parentComponent, anchor);
                vnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
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
function getSequence(arr) {
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
                }
                else {
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

// 源码里面这些接口是由 runtime-dom 来实现
// 后面也修改成和源码一样的实现
function createElement(type) {
    console.log("CreateElement", type);
    const element = document.createElement(type);
    return element;
}
function setElementText(el, text) {
    console.log("SetElementText", el, text);
    el.textContent = text;
}
function patchProp(el, key, preValue, nextValue) {
    // preValue 之前的值
    // 为了之后 update 做准备的值
    // nextValue 当前的值
    console.log(el, `PatchProp 设置属性:${key} 值:${nextValue}`);
    console.log(`key: ${key} 之前的值是:${preValue}`);
    if (isOn(key)) {
        // 添加事件处理函数的时候需要注意一下
        // 1. 添加的和删除的必须是一个函数，不然的话 删除不掉
        //    那么就需要把之前 add 的函数给存起来，后面删除的时候需要用到
        // 2. nextValue 有可能是匿名函数，当对比发现不一样的时候也可以通过缓存的机制来避免注册多次
        // 存储所有的事件函数
        const invokers = el._vei || (el._vei = {});
        const existingInvoker = invokers[key];
        if (nextValue && existingInvoker) {
            // patch
            // 直接修改函数的值即可
            existingInvoker.value = nextValue;
        }
        else {
            const eventName = key.slice(2).toLowerCase();
            if (nextValue) {
                const invoker = (invokers[key] = nextValue);
                el.addEventListener(eventName, invoker);
            }
            else {
                el.removeEventListener(eventName, existingInvoker);
                invokers[key] = undefined;
            }
        }
    }
    else {
        if (nextValue === null || nextValue === "") {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextValue);
        }
    }
}
function insert(child, parent, anchor = null) {
    // parent.append(child)
    // 如果给定的子节点是对文档中现有节点的引用，insertBefore()会将其从当前位置移动到新位置。
    parent.insertBefore(child, anchor);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
const renderer = createRnderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this.dep = createDep();
        this._rawValue = value;
        this._value = convert(value);
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(newValue, this._rawValue)) {
            this._value = convert(newValue);
            this._rawValue = newValue;
            triggerEffects(this.dep);
        }
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function ref(value) {
    return new RefImpl(value);
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
// 处理template里的ref变量与setup里的，有没有.value的区别
const shallowUnwrapHandlers = {
    get(target, key, receiver) {
        return unRef(Reflect.get(target, key, receiver));
    },
    set(target, key, value, receiver) {
        const oldValue = target[key];
        if (isRef(oldValue) && !isRef(value)) {
            return (target[key].value = value);
        }
        else {
            return Reflect.set(target, key, value, receiver);
        }
    },
};
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
// 拿到ref .value的值
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function isRef(value) {
    return !!value.__v_isRef;
}

// computed实际是一个只读的响应式变量
// 机制：懒执行+可缓存
class ComputedRefImpl {
    constructor(getter) {
        // 是否执行的标志
        this._dirty = true;
        this._getter = getter;
        // 被依赖的变量通过执行scheduler，触发_dirty为true
        this._effect = new ReactiveEffect(getter, () => {
            this._dirty = true;
        });
    }
    get value() {
        if (this._dirty) {
            this._dirty = false;
            // 在computed变量被get的时候，计算属性值
            this._value = this._effect.run();
        }
        return this._value;
    }
}
function computed(getter) {
    return new ComputedRefImpl(getter);
}

export { Fragment, ReactiveEffect, Text, computed, createApp, createRnderer, effect, getCurrentInstance, h, patchProp, proxyRefs, reactive, readonly, ref, renderSlots, stop, unRef };
