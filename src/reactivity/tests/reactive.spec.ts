import { reactive } from "../reactive";
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
});
