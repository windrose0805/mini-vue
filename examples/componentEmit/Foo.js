import { h, ref } from "../../lib/guide-mini-vue.esm.js";

export const Foo = {
    name: "Foo",
    setup(props, { emit }) {
        const emitAdd = () => {
            emit('add-foo', 12)
        }
        return {
            emitAdd
        };
    },
    render() {
        const btn = h('button', { onClick: this.emitAdd }, 'emitAddFoo')
        const foo = h('p', {}, "foo")
        return h("div", {}, [foo, btn]);
    },
};
