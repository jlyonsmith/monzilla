'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Monzilla = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _glob = require('glob');

var _minimist = require('minimist');

var _minimist2 = _interopRequireDefault(_minimist);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _timers = require('timers');

var _autoBind = require('auto-bind2');

var _autoBind2 = _interopRequireDefault(_autoBind);

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _psTree = require('ps-tree');

var _psTree2 = _interopRequireDefault(_psTree);

var _util = require('util');

var _version = require('./version');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Monzilla {
  constructor(log) {
    (0, _autoBind2.default)(this);
    this.log = log;
  }

  runCommand() {
    this.log.info2(`Running command '${this.args.command}'`);
    this.log.info2('Control+C to exit/Control+R to restart');
    const childProcess = (0, _child_process.exec)(this.args.command, {
      env: _extends({}, process.env, { FORCE_COLOR: 1 }),
      shell: '/bin/bash'
    });

    childProcess.on('exit', (code, signal) => {
      if (this.childProcess.restart) {
        this.runCommand(this.args.command);
      } else {
        if (code === 0) {
          this.log.info2(`Command exited cleanly`);
        } else {
          this.log.warning2(`Command exited with error code ${code}`);
        }
        this.childProcess = null;
        this.log.info2('Waiting for file changes before running again');
      }
    });

    childProcess.on('error', error => {
      this.log.error(error.message);
      process.exit(-1);
    });

    childProcess.stdout.on('data', data => {
      process.stdout.write(data);
    });

    childProcess.stderr.on('data', data => {
      process.stderr.write(data);
    });

    this.childProcess = childProcess;
  }

  restartCommand() {
    if (this.childProcess) {
      this.childProcess.restart = true;
      this.killProcess(this.childProcess.pid);
      // Process will restart when it exits
    } else {
      this.runCommand();
    }
  }

  async killProcess(pid) {
    const children = await (0, _util.promisify)(_psTree2.default)(pid);

    try {
      await (0, _util.promisify)(_child_process.exec)(['kill', '-9', ...children.map(p => p.PID), pid].join(' '));
    } catch (error) {
      this.log.error(`Could not kill PID ${pid}`);
    }
  }

  async run(argv) {
    const options = {
      boolean: ['help', 'version'],
      '--': true
    };
    this.args = (0, _minimist2.default)(argv, options);

    if (this.args.version) {
      this.log.info(`${_version.fullVersion}`);
      return 0;
    }

    if (this.args.help) {
      this.log.info(`
usage: monzilla [options] <glob>[:<glob>...] -- <command>...

options:
  --help                        Shows this help.
  --version                     Shows the tool version.
`);
      return 0;
    }

    const globs = this.args._[0];

    if (!globs) {
      this.log.error('Must supply at least one glob');
      return -1;
    }

    const globList = globs.split(':');

    this.args.command = this.args['--'].join(' ');

    if (this.args.command.length === 0) {
      this.log.error('Must supply a command to run');
      return -1;
    }

    let filenames = [];

    globList.forEach(glob => {
      filenames = filenames.concat((0, _glob.sync)(glob));
    });

    let dirnames = new Set();

    filenames.forEach(filename => {
      const dirname = _path2.default.dirname(filename);

      if (!dirnames.has(dirname) && _fs2.default.statSync(dirname).isDirectory()) {
        dirnames.add(dirname);
      }
    });

    _readline2.default.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    process.stdin.on('keypress', (str, key) => {
      if (key.ctrl) {
        switch (key.name) {
          case 'c':
            if (this.childProcess) {
              this.killProcess(this.childProcess.pid).then(() => {
                process.exit(0);
              });
            } else {
              process.exit(0);
            }
            break;
          case 'r':
            this.restartCommand();
            break;
          default:
            break;
        }
      }
    });

    this.runCommand();

    let watchers = [];

    dirnames.forEach(dirname => {
      const watcher = _fs2.default.watch(dirname);

      watcher.on('change', (eventType, filename) => {
        if (this.timeout) {
          clearTimeout(this.timeout);
        }

        // Debounce changes to files
        this.timeout = (0, _timers.setTimeout)(() => {
          this.restartCommand();
        }, 500);
      });

      watchers.push(watcher);
    });

    return 0;
  }
}
exports.Monzilla = Monzilla;
//# sourceMappingURL=Monzilla.js.map