import { h } from '../../lib/guide-mini-vue.esm.js'


export const Foo = {
    render() {
        return h('div', {
            id: 'root', class: 'red, blue'
        }, 'hi ' + this.count)
    },
    setup(props) {
        console.log(props.count++)
        return {
            msg: 'mini-vue'
        }
    }
}