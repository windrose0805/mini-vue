import { h, ref, reactive, getCurrentInstance, nextTick } from "../../lib/guide-mini-vue.esm.js";

export default {
  name: "App",
  setup() {
    const count = ref(0)
    const instance = getCurrentInstance()
    const changeCount = () => {
      for (let i = 0; i < 100; i++) {
        count.value = i
      }
      console.log('之前的', instance)
      nextTick(() => {
        console.log('nextTick里的', instance)
      })
    }

    return {
      count,
      changeCount
    }
  },

  render() {
    return h("div", { tId: 1 }, [h("button", {
      onClick: this.changeCount,
    }, "按钮"), h("p", {}, "主页"), h('p', {}, 'count：' + this.count)]);
  },
};
