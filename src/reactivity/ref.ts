import { hasChanged, isObject } from "../shared";
import { trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

export class RefImpl {
  private _value;
  private _rawValue;
  private _dep = new Set();
  constructor(value) {
    this._rawValue = value;
    this._value = convert(value);
  }
  get value() {
    this._rawValue = this._value;
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
