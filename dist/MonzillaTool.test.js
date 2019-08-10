"use strict";

var _MonzillaTool = require("./MonzillaTool");

let container = null;
beforeEach(() => {
  container = {
    toolName: "monzilla",
    log: {
      info: jest.fn(),
      warning: jest.fn(),
      error: jest.fn(),
      info2: jest.fn(),
      error2: jest.fn(),
      warning2: jest.fn()
    }
  };
});

const getOutput = fn => {
  const calls = fn.mock.calls;
  return calls.length > 0 && calls[0].length > 0 ? calls[0][0] : "";
};

test("--help", async () => {
  const tool = new _MonzillaTool.MonzillaTool(container);
  const exitCode = await tool.run(["--help"]);
  expect(exitCode).toBe(0);
  expect(getOutput(container.log.info)).toEqual(expect.stringContaining("--help"));
});
test("--version", async () => {
  const tool = new _MonzillaTool.MonzillaTool(container);
  const exitCode = await tool.run(["--version"]);
  expect(exitCode).toBe(0);
  expect(getOutput(container.log.info)).toEqual(expect.stringMatching(/\d\.\d\.\d/));
});
test("no args", async () => {
  const tool = new _MonzillaTool.MonzillaTool(container);
  const exitCode = await tool.run([]);
  expect(exitCode).toBe(-1);
});
//# sourceMappingURL=MonzillaTool.test.js.map