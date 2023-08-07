import { isReactive, reactive } from "../reactive";
import { effect } from "../effect";

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

  test("nested reactives", () => {
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    };
    const observed = reactive(original);
    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
  });
});
