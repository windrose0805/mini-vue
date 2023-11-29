import { h, renderSlots, Fragment, Text } from "../../lib/guide-mini-vue.esm.js";

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
      [renderSlots(this.$slots, "bar", this.props), renderSlots(this.$slots, "foo", this.props)]

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

      // [h(Text, null, "文本节点")]
    );
  },
  setup(props) {
    return {
      msg: "mini-vue",
    };
  },
};
