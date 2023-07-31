import {  readonly } from "../reactive";

describe("readonly", () => {
  it("should make nested values readonly", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);

    console.warn = jest.fn()

    wrapped.foo = 2

    // get
    expect(wrapped.foo).toBe(1);

    expect(console.warn).toBeCalled()
  });
});
