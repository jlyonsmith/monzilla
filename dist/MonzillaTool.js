"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MonzillaTool = void 0;

var _glob = require("glob");

var _minimist = _interopRequireDefault(require("minimist"));

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _child_process = require("child_process");

var _timers = require("timers");

var _autobindDecorator = _interopRequireDefault(require("autobind-decorator"));

var _readline = _interopRequireDefault(require("readline"));

var _psTree = _interopRequireDefault(require("ps-tree"));

var _util = require("util");

var version = _interopRequireWildcard(require("./version"));

var _class;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let MonzillaTool = (0, _autobindDecorator.default)(_class = class MonzillaTool {
  constructor(toolName, log) {
    this.toolName = toolName;
    this.log = log;
  }

  runCommand() {
    this.log.info2(`Running command '${this.args.command}'`);
    this.log.info2("Control+C to exit/Control+R to restart");
    const childProcess = (0, _child_process.exec)(this.args.command, {
      env: { ...process.env,
        FORCE_COLOR: 1
      },
      shell: "/bin/bash"
    });
    childProcess.on("exit", (code, signal) => {
      if (code) {
        if (code === 0) {
          this.log.info2(`Command exited cleanly`);
        } else {
          this.log.warning2(`Command exited with error code ${code}`);
        }
      }

      if (signal) {
        this.log.warning2(`Command exited due to signal ${signal}`);
      }

      if (this.childProcess.restart) {
        this.runCommand(this.args.command);
      } else {
        this.childProcess = null;
        this.log.info2("Waiting for file changes before running again");
      }
    });
    childProcess.on("error", error => {
      this.log.error(error.message);
      process.exit(-1);
    });
    childProcess.stdout.on("data", data => {
      process.stdout.write(data);
    });
    childProcess.stderr.on("data", data => {
      process.stderr.write(data);
    });
    this.childProcess = childProcess;
  }

  restartCommand() {
    if (this.childProcess) {
      this.childProcess.restart = true;
      this.killProcess(this.childProcess.pid); // Process will restart when it exits
    } else {
      this.runCommand();
    }
  }

  async killProcess(pid) {
    const children = await (0, _util.promisify)(_psTree.default)(pid);

    try {
      await (0, _util.promisify)(_child_process.exec)(["kill", "-9", ...children.map(p => p.PID), pid].join(" "));
    } catch (error) {
      this.log.error(`Could not kill PID ${pid}`);
    }
  }

  async run(argv) {
    const options = {
      boolean: ["help", "version"],
      "--": true
    };
    this.args = (0, _minimist.default)(argv, options);

    if (this.args.version) {
      this.log.info(version.fullVersion);
      return 0;
    }

    if (this.args.help) {
      this.log.info(`
usage: ${this.toolName} [options] <glob>[:<glob>...] -- <command>...

options:
  --help                        Shows this help.
  --version                     Shows the tool version.
`);
      return 0;
    }

    const globs = this.args._[0];

    if (!globs) {
      this.log.error("Must supply at least one glob");
      return -1;
    }

    const globList = globs.split(":");
    this.args.command = this.args["--"].join(" ");

    if (this.args.command.length === 0) {
      this.log.error("Must supply a command to run");
      return -1;
    }

    let filenames = [];
    globList.forEach(glob => {
      filenames = filenames.concat((0, _glob.sync)(glob));
    });
    let dirnames = new Set();
    filenames.forEach(filename => {
      const dirname = _path.default.dirname(filename);

      if (!dirnames.has(dirname) && _fs.default.statSync(dirname).isDirectory()) {
        dirnames.add(dirname);
      }
    });

    _readline.default.emitKeypressEvents(process.stdin);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    process.stdin.on("keypress", (str, key) => {
      if (key.ctrl) {
        switch (key.name) {
          case "c":
            if (this.childProcess) {
              this.killProcess(this.childProcess.pid).then(() => {
                process.exit(0);
              });
            } else {
              process.exit(0);
            }

            break;

          case "r":
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
      const watcher = _fs.default.watch(dirname);

      watcher.on("change", (eventType, filename) => {
        // Debounce changes to files
        if (this.timeout) {
          clearTimeout(this.timeout);
        }

        this.timeout = (0, _timers.setTimeout)(() => {
          this.restartCommand();
        }, 500);
      });
      watchers.push(watcher);
    });
    return 0;
  }

}) || _class;

exports.MonzillaTool = MonzillaTool;
//# sourceMappingURL=MonzillaTool.js.map