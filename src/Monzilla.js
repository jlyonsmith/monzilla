import { sync as globSync } from 'glob'
import parseArgs from 'minimist'
import path from 'path'
import fs from 'fs'
import { exec } from 'child_process'
import { setTimeout } from 'timers'
import autoBind from 'auto-bind2'
import readline from 'readline'
import chalk from 'chalk'
import psTree from 'ps-tree'
import { promisify } from 'util'
import { fullVersion } from './version'

export class Monzilla {
  constructor(log) {
    autoBind(this)
    this.log = log
  }

  runCommand() {
    this.log.info2(`Running command '${this.args.command}'`)
    this.log.info2('Control+C to exit/Control+R to restart')
    const childProcess = exec(this.args.command)

    childProcess.on('exit', (code, signal) => {
      const oldChildProcess = this.childProcess

      if (oldChildProcess && oldChildProcess.restart) {
        this.runCommand(this.args.command)
      } else {
        if (code === 0) {
          this.log.info2(`Command exited cleanly`)
        } else {
          this.log.warning2(`Command exited with error code ${code}`)
        }
      }

      this.log.info2('Waiting for file changes before running again')
    })

    childProcess.on('error', (error) => {
      this.log.error(error.message)
      process.exit(-1)
    })

    childProcess.stdout.on('data', (data) => {
      process.stdout.write(data)
    })

    childProcess.stderr.on('data', (data) => {
      process.stderr.write(data)
    })

    this.childProcess = childProcess
  }

  restartCommand() {
    if (this.childProcess) {
      this.childProcess.restart = true
      this.killProcess(this.childProcess.pid)
      // Process will restart when it exits
    } else {
      this.runCommand()
    }
  }

  killProcess(pid) {
    return promisify(psTree)(pid).then((children) => {
      const cmd = ['kill', '-9', ...children.map(p => p.PID), pid].join(' ')
      return promisify(exec)(cmd)
    })
  }

  async run(argv) {
    const options = {
      boolean: [ 'help', 'version' ],
      '--': true
    }
    this.args = parseArgs(argv, options)

    if (this.args.version) {
      this.log.info(`${fullVersion}`)
      return 0
    }

    if (this.args.help) {
      this.log.info(`
usage: monzilla [options] <glob>[:<glob>...] -- <command>...

options:
  --help                        Shows this help.
  --version                     Shows the tool version.
`)
      return 0
    }

    const globs = this.args._[0]

    if (!globs) {
      this.log.error('Must supply at least one glob')
      return -1
    }

    const globList = globs.split(':')

    this.args.command = this.args['--'].join(' ')

    if (this.args.command.length === 0) {
      this.log.error('Must supply a command to run')
      return -1
    }

    let filenames = []

    globList.forEach(glob => {
      filenames = filenames.concat(globSync(glob))
    })

    let dirnames = new Set()

    filenames.forEach(filename => {
      const dirname = path.dirname(filename)

      if (!dirnames.has(dirname) && fs.statSync(dirname).isDirectory()) {
        dirnames.add(dirname)
      }
    })

    readline.emitKeypressEvents(process.stdin)
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true)
    }

    process.stdin.on('keypress', (str, key) => {
      if (key.ctrl) {
        switch (key.name) {
          case 'c':
            if (this.childProcess) {
              this.killProcess(this.childProcess.pid).then(() => {
                process.exit(0)
              })
            } else {
              process.exit(0)
            }
            break
          case 'r':
            this.restartCommand()
            break
          default:
            break
        }
      }
    })

    this.runCommand()

    let watchers = []

    dirnames.forEach(dirname => {
      const watcher = fs.watch(dirname)

      watcher.on('change', (eventType, filename) => {
        if (this.timeout) {
          clearTimeout(this.timeout)
        }

        // Debounce changes to files
        this.timeout = setTimeout(() => {
          this.restartCommand()
        }, 500)
      })

      watchers.push(watcher)
    })

    return 0
  }
}
