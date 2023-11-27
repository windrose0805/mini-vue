import { toHandlerKey, camelize } from "../shared/index";

export function emit(instance, event, ...args) {
  // tpp开发，先写特定行为，再重构成一个特定的行为
  // add -> onAdd
  // add-foo -> addFoo
  console.log("emit", event);

  const { props } = instance;

  const handlerName = toHandlerKey(camelize(event));

  const handler = props[handlerName];
  handler && handler(...args);
}
