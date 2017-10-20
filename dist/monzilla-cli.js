#!/usr/bin/env node
'use strict';

var _Monzilla = require('./Monzilla');

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = {
  info: console.info,
  error: function () {
    console.error(_chalk2.default.red('error:', [...arguments].join(' ')));
  },
  warning: function () {
    console.error(_chalk2.default.yellow('warning:', [...arguments].join(' ')));
  },
  info2: function () {
    console.info(_chalk2.default.green('[monzilla]', [...arguments].join(' ')));
  },
  error2: function () {
    console.error(_chalk2.default.red('[monzilla] error:', [...arguments].join(' ')));
  },
  warning2: function () {
    console.error(_chalk2.default.yellow('[monzilla] warning:', [...arguments].join(' ')));
  }
};

const tool = new _Monzilla.Monzilla(log);
tool.run(process.argv.slice(2)).then(exitCode => {
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}).catch(err => {
  console.error(err);
});
//# sourceMappingURL=monzilla-cli.js.map