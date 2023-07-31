class ReactiveEffect {
  private _fn: Function;
  deps = [];
  public scheduler: any;
  constructor(fn, scheduler?: any) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    shouldTrack = true;
    activeEffect = this;
    const result = this._fn()
    shouldTrack = false;
    return result;
  }
  stop() {
    this.deps.forEach((dep: any) => {
      dep.delete(this);
    });
  }
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
  const scheduler = options.scheduler;
  const _effect = new ReactiveEffect(fn, scheduler);
  _effect.run();
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}
