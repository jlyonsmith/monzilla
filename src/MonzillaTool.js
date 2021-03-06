import { sync as globSync } from "glob"
import parseArgs from "minimist"
import path from "path"
import fs from "fs"
import { exec } from "child_process"
import { setTimeout } from "timers"
import autobind from "autobind-decorator"
import readline from "readline"
import psTree from "ps-tree"
import { promisify } from "util"
import * as version from "./version"

@autobind
export class MonzillaTool {
  constructor(container) {
    this.toolName = container.toolName
    this.log = container.log
    this.debug = !!container.debug
  }

  runCommandInLoop(globs, command) {
    const globList = globs.split(":")
    let filenames = []

    globList.forEach((glob) => {
      filenames = filenames.concat(globSync(glob))
    })

    let dirnames = new Set()

    filenames.forEach((filename) => {
      const dirname = path.dirname(filename)

      if (!dirnames.has(dirname) && fs.statSync(dirname).isDirectory()) {
        dirnames.add(dirname)
      }
    })

    readline.emitKeypressEvents(process.stdin)

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true)
    }

    process.stdin.on("keypress", (str, key) => {
      if (key.ctrl) {
        switch (key.name) {
          case "c":
            if (this.childProcess) {
              this.killProcess(this.childProcess.pid).then(() => {
                process.exit(0)
              })
            } else {
              process.exit(0)
            }
            break
          case "r":
            this.restartCommand(command)
            break
          default:
            break
        }
      }
    })

    this.runCommand(command)

    let watchers = []

    dirnames.forEach((dirname) => {
      const watcher = fs.watch(dirname)

      watcher.on("change", (eventType, filename) => {
        // Debounce changes to files
        if (this.timeout) {
          clearTimeout(this.timeout)
        }
        this.timeout = setTimeout(() => {
          this.restartCommand(command)
        }, 500)
      })

      watchers.push(watcher)
    })
  }

  runCommand(command) {
    this.log.info2(`Running command '${command}'`)
    this.log.info2("Control+C to exit/Control+R to restart")
    const childProcess = exec(command, {
      env: { ...process.env, FORCE_COLOR: 1 },
      shell: "/bin/bash",
    })

    childProcess.on("exit", (code, signal) => {
      if (code) {
        if (code === 0) {
          this.log.info2(`Command exited cleanly`)
        } else {
          this.log.warning2(`Command exited with error code ${code}`)
        }
      }

      if (signal) {
        this.log.warning2(`Command exited due to signal ${signal}`)
      }

      if (this.childProcess.restart) {
        this.runCommand(command)
      } else {
        this.childProcess = null
        this.log.info2("Waiting for file changes before running again")
      }
    })

    childProcess.on("error", (error) => {
      this.log.error(error.message)
      process.exit(-1)
    })

    childProcess.stdout.on("data", (data) => {
      process.stdout.write(data)
    })

    childProcess.stderr.on("data", (data) => {
      process.stderr.write(data)
    })

    this.childProcess = childProcess
  }

  restartCommand(command) {
    if (this.childProcess) {
      this.childProcess.restart = true
      this.killProcess(this.childProcess.pid)
      // Process will restart when it exits
    } else {
      this.runCommand(command)
    }
  }

  async killProcess(pid) {
    const children = await promisify(psTree)(pid)

    try {
      await promisify(exec)(
        ["kill", "-9", ...children.map((p) => p.PID), pid].join(" ")
      )
    } catch (error) {
      this.log.error(`Could not kill PID ${pid}`)
    }
  }

  async run(argv) {
    const options = {
      boolean: ["help", "version"],
      "--": true,
    }
    const args = parseArgs(argv, options)

    if (args.version) {
      this.log.info(version.fullVersion)
      return 0
    }

    if (args.help) {
      this.log.info(`
usage: ${this.toolName} [options] <glob>[:<glob>...] -- <command>...

options:
  --help                        Shows this help.
  --version                     Shows the tool version.
`)
      return 0
    }

    const globs = args._[0]

    if (!globs) {
      this.log.error("Must supply at least one glob")
      return -1
    }

    const command = args["--"].join(" ")

    if (command.length === 0) {
      this.log.error("Must supply a command to run")
      return -1
    }

    this.runCommandInLoop(globs, command)

    return 0
  }
}
