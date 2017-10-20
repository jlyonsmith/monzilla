'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Monzilla = undefined;

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

var _version = require('./version');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Monzilla {
  constructor(log) {
    (0, _autoBind2.default)(this);
    this.log = log;
  }

  runCommand() {
    this.log.info2(`Running command '${this.args.command}'`);
    const childProcess = (0, _child_process.exec)(this.args.command);

    childProcess.on('exit', (code, signal) => {
      const oldChildProcess = this.childProcess;

      if (oldChildProcess && oldChildProcess.restart) {
        this.runCommand(this.args.command);
      } else {
        if (code === 0) {
          this.log.info2(`Command exited cleanly`);
        } else {
          this.log.warning2(`Command exited with error code ${code}`);
        }
      }

      this.log.info2('Waiting for file changes to restart. Control+C to exit; Control+R to restart now');
      this.childProcess = null;
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
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = (0, _timers.setTimeout)(() => {
      let childProcess = this.childProcess;

      if (childProcess) {
        childProcess.restart = true;
        childProcess.kill();
      } else {
        this.runCommand();
      }
    }, 200);
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
  --patch | --minor | --major   Release a patch, minor or major version. For 'release' command only.
  --clean                       Do a clean build.  For 'build' command only.
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
        if (key.name === 'c') {
          process.exit();
        } else {
          this.restartCommand();
        }
      }
    });

    this.runCommand();

    let watchers = [];

    dirnames.forEach(dirname => {
      const watcher = _fs2.default.watch(dirname);

      watcher.on('change', (eventType, filename) => {
        this.restartCommand();
      });

      watchers.push(watcher);
    });

    return 0;
  }
}
exports.Monzilla = Monzilla;
//# sourceMappingURL=Monzilla.js.map