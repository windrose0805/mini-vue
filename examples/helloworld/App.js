import { h } from "../../lib/guide-mini-vue.esm.js";
import { Foo } from "./Foo.js";

window.self = null;
export const App = {
  name: "App",
  render() {
    window.self = this;
    // return h('div', {
    //     id: 'root',
    //     class: 'red, blue',
    //     onClick: () => {
    //         console.log('被点击')
    //     }
    // }, [h('div', {}, this.msg), h(Foo, { count: this.count })])

    // return h('div', { id: 'root' }, [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'mini-vue')])

    return h(
      Foo,
      { count: this.count },
      {
        // default: () => "default slot",
        foo: () => h("div", {}, "foo"),
        bar: () => h("span", {}, "one"),
      }
    );
  },
  setup() {
    return {
      msg: "mini-vue",
      count: 0,
    };
  },
};
