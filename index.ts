const { reactive, effect } = require("@vue/reactivity");

let a = reactive({
  value: 10,
});
let b;

effect(() => {
  b = a.value + 10;
  console.log(b);
});
a.value = 20;
a.value = 30;
a.value = 40;
// output : 20 30 40 50