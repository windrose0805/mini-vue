import { h, ref, Text, getCurrentInstance } from "../../lib/guide-mini-vue.esm.js";

export const App = {
  name: "App",
  render() {

    return h("div", { ...this.props }, [
      h('span', {}, 'count: ' + this.count),
      h("button", { onClick: this.click }, "修改count的值"),
    ]);
  },
  setup() {
    const instance = getCurrentInstance()
    const count = ref(0);
    const props = ref({
      foo: 'foo'
    })
    return {
      count,
      props,
      click: () => {
        count.value++;
        // props.value.foo = 'new-foo'
        // props.value.foo = null
        // props.value.foo = 'app'
      },
    };
  },
};
