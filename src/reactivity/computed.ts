import { ReactiveEffect } from "./effect";

//computed实际是一个只读的响应式变量
//机制：懒执行+可缓存
export class ComputedRefImpl {
  _getter: any;
  //是否执行的标志
  private _dirty = true;
  private _value;
  _effect: any;
  constructor(getter) {
    this._getter = getter;

    //被依赖的变量通过执行scheduler，触发_dirty为true
    this._effect = new ReactiveEffect(getter, () => {
      this._dirty = true;
    });
  }
  get value() {
    if (this._dirty) {
      this._dirty = false;
      //在computed变量被get的时候，计算属性值
      this._value = this._effect.run();
    }
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
