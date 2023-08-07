import { reactive } from "../reactive";
import { effect, stop } from "../effect";

describe("effect", () => {
  it("happy path", () => {
    const origin = { age: 10 };
    const user = reactive(origin);
    expect(origin).not.toBe(user);

    let b;
    effect(() => {
      b = user.age + 1;
    });
    expect(b).toBe(11);
    user.age++;
    expect(b).toBe(12);
  });

  it("", () => {
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });

    expect(foo).toBe(11);
    const r = runner();
    expect(r).toBe("foo");
  });

  it("scheduler", () => {
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // // should not run yet
    expect(dummy).toBe(1);
    // // manually run
    run();
    // // should have run
    expect(dummy).toBe(2);
  });

  it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });

    const obj1 = reactive({
      count: 10,
    });

    const runner = effect(() => {
      dummy = obj.prop;
    });

    //两个响应式变量，含有各自的dep
    const runner1 = effect(() => {
      dummy = obj.prop + obj1.count;
    });

    obj.prop = 2;
    expect(dummy).toBe(12);
    stop(runner);
    stop(runner1);
    // obj.prop = 3;
    obj.prop++;
    expect(dummy).toBe(12);

    // stopped effect should still be manually callable
    runner();
    expect(dummy).toBe(3);
  });

  it("onStop", () => {
    const obj = reactive({
      foo: 1,
    });

    let dummy;
    const onStop = jest.fn();

    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        onStop,
      }
    );

    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
});
