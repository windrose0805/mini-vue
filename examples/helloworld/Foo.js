import { h, renderSlots } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
  render() {
    // return h('div', {
    //     id: 'root', class: 'red, blue'
    // }, 'hi ' + this.count)

    return h(
      "div",
      {
        id: "root",
        class: "red, blue",
        name: this.count,
      },

      // 转为VNode处理
      [renderSlots(this.$slots, "bar", this.props)]

      // 等价于这个
      // [
      //   {
      //     type: "div",
      //     props: {},
      //     children: [
      //       {
      //         type: "span",
      //         props: {},
      //         children: "one",
      //         shapeFlag: 9,
      //         el: null,
      //       },
      //     ],
      //     shapeFlag: 17,
      //     el: null,
      //   },
      // ]
    );
  },
  setup(props) {
    return {
      msg: "mini-vue",
    };
  },
};
