"use strict";

var _Monzilla = require("./Monzilla");

var _fs = _interopRequireDefault(require("fs"));

var _util = _interopRequireDefault(require("util"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getMockLog() {
  return {
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn()
  };
}

function getOutput(fn) {
  const calls = fn.mock.calls;

  if (calls.length > 0 && calls[0].length > 0) {
    return calls[0][0];
  } else {
    return '';
  }
}

test('test help', done => {
  const mockLog = getMockLog();
  const tool = new _Monzilla.Monzilla(mockLog);
  return tool.run(['--help']).then(exitCode => {
    expect(exitCode).toBe(0);
    expect(getOutput(mockLog.info)).toEqual(expect.stringContaining('--help'));
    done();
  });
});
test('test version', done => {
  const mockLog = getMockLog();
  const tool = new _Monzilla.Monzilla(mockLog);
  return tool.run(['--version']).then(exitCode => {
    expect(exitCode).toBe(0);
    expect(getOutput(mockLog.info)).toEqual(expect.stringMatching(/\d\.\d\.\d/));
    done();
  });
});
test('test no args', done => {
  const mockLog = getMockLog();
  const tool = new _Monzilla.Monzilla(mockLog);
  return tool.run([]).then(exitCode => {
    expect(exitCode).toBe(-1);
    done();
  });
});
//# sourceMappingURL=MonzillaTool.test.js.map