import { hasChanged, isObject } from "../shared";
import { trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";
import { createDep } from "./dep";

export class RefImpl {
  private _value;
  private _rawValue;
  private _dep;
  constructor(value) {
    this._dep = createDep();
    this._rawValue = value;
    this._value = convert(value);
  }
  get value() {
    trackEffects(this._dep);
    return this._value;
  }
  set value(newValue) {
    if (hasChanged(newValue, this._rawValue)) {
      this._value = convert(newValue);
      this._rawValue = newValue;
      triggerEffects(this._dep);
    }
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

export function ref(value) {
  return new RefImpl(value);
}
