import typescript from "@rollup/plugin-typescript";

export default {
    input: './src/index.ts',
    // cjs -> common.js
    // esm
    output: [
        { format: 'cjs', file: 'lib/guide-mini-vue.cjs.js' },
        { format: 'es', file: 'lib/guide-mini-vue.esm.js' }
    ],
    plugins: [typescript()]
}