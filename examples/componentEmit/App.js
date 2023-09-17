import { h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from './Foo.js'

export const App = {
  name: "App",
  setup() {
    return {
      onAdd(val) {
        console.log('触发', val)
      },
      onAddFoo() {
        console.log('触发了', '驼峰命名add-foo')
      }
    };
  },
  render() {
    return h('div', {}, [h('div', {}, "App"), h(Foo, { onAddFoo: this.onAddFoo })]);
  },
};
