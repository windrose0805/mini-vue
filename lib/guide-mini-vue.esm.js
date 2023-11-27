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

// 源码里面这些接口是由 runtime-dom 来实现
function patchProp(el, key, preValue, nextValue) {
    // preValue 之前的值
    // 为了之后 update 做准备的值
    // nextValue 当前的值
    console.log(`PatchProp 设置属性:${key} 值:${nextValue}`);
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

function render(n1, n2, container) {
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
            }
            else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
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
    }
    else {
        patchElement(n1, n2);
    }
}
function patchElement(n1, n2, container) {
    const oldProps = n1.props || EMPTY_ONJ;
    const newProps = n2.props || EMPTY_ONJ;
    const el = (n2.el = n1.el);
    patchProps(el, oldProps, newProps);
}
const EMPTY_ONJ = {};
function patchProps(el, oldProps, newProps) {
    if (oldProps === newProps)
        return;
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
    }
    else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(children, el);
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
function setupRenderEffect(instance, vnode, container) {
    const { proxy } = instance;
    effect(() => {
        if (!instance.isMounted) {
            const subTree = (instance.subTree = instance.render.call(proxy));
            // vnode -> patch
            // vnode -> element -> mountElement
            patch(null, subTree, container);
            vnode.el = subTree.el;
            instance.isMounted = true;
        }
        else {
            const subTree = instance.render.call(proxy);
            const prevTree = instance.subTree;
            vnode.el = subTree.el;
            instance.subTree = subTree;
            patch(prevTree, subTree, container);
        }
    });
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // component -> vnode
            // 所有逻辑处理基于vnode
            const vnode = createVNode(rootComponent);
            render(null, vnode, rootContainer);
        },
    };
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

export { Fragment, ReactiveEffect, Text, computed, createApp, effect, getCurrentInstance, h, proxyRefs, reactive, readonly, ref, renderSlots, stop, unRef };
