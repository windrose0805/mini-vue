import { h, ref, Text } from "../../lib/guide-mini-vue.esm.js";

export const App = {
  name: "App",
  render() {
    return h("div", {}, [
      h(Text, {}, this.count),
      h("button", { onClick: this.click }, "修改count的值"),
    ]);
  },
  setup() {
    const count = ref(0);
    return {
      count,
      click: () => {
        count.value++;
      },
    };
  },
};
