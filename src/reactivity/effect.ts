import { extend } from "../shared";

class ReactiveEffect {
  private _fn: Function;
  //deps是数组的原因：effect里面可能订阅了不同的响应式变量
  deps = [];
  //调度器
  public scheduler: any;
  onStop?: () => void;
  active = true;
  constructor(fn, scheduler?: any) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    //控制依赖能不能被收集的开关
    shouldTrack = true;

    activeEffect = this;

    //当run被执行时，就触发收集依赖
    const result = this._fn();

    shouldTrack = false;
    return result;
  }
  stop() {
    //防止stop被重复调用
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
  //将effect里所有响应式变量的dep删除该effect
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
}

const targetMap = new Map();

export function track(target, key) {
  if (activeEffect === undefined || !shouldTrack) return;
  //target -> key -> dep
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  dep.add(activeEffect);

  //反向收集dep
  activeEffect.deps.push(dep);
}

export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

let activeEffect;
let shouldTrack;

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  extend(_effect, options);
  _effect.run();
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}
