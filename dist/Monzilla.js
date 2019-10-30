#!/usr/bin/env node
"use strict";

var _MonzillaTool = require("./MonzillaTool");

var _chalk = _interopRequireDefault(require("chalk"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = {
  info: console.info,
  error: function () {
    console.error(_chalk.default.red("error:", [...arguments].join(" ")));
  },
  warning: function () {
    console.error(_chalk.default.yellow("warning:", [...arguments].join(" ")));
  },
  info2: function () {
    console.info(_chalk.default.green("[monzilla]", [...arguments].join(" ")));
  },
  error2: function () {
    console.error(_chalk.default.red("[monzilla] error:", [...arguments].join(" ")));
  },
  warning2: function () {
    console.error(_chalk.default.yellow("[monzilla] warning:", [...arguments].join(" ")));
  }
};
const tool = new _MonzillaTool.MonzillaTool({
  toolName: _path.default.basename(process.argv[1], ".js"),
  log
});
tool.run(process.argv.slice(2)).then(exitCode => {
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}).catch(err => {
  console.error(err);
});
//# sourceMappingURL=monzilla.js.map