import { h } from '../../lib/guide-mini-vue.esm.js'


window.self = null
export const App = {
    render() {
        window.self = this
        return h('div', {
            id: 'root', class: 'red, blue', onClick: () => {
                console.log('被点击')
            }
        }, 'hi ' + this.msg)

        // return h('div', { id: 'root' }, [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'mini-vue')])

    },
    setup() {
        return {
            msg: 'mini-vue'
        }
    }
}