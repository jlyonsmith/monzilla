import { sync as globSync } from 'glob'
import parseArgs from 'minimist'
import path from 'path'
import fs from 'fs'
import { exec } from 'child_process'
import { setTimeout } from 'timers'
import autoBind from 'auto-bind2'
import readline from 'readline'
import chalk from 'chalk'
import { fullVersion } from './version'

export class Monzilla {
  constructor(log) {
    autoBind(this)
    this.log = log
  }

  runCommand() {
    this.log.info2(`Running command '${this.args.command}'`)
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

      this.log.info2('Waiting for file changes to restart. Control+C to exit; Control+R to restart now')
      this.childProcess = null
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
    if (this.timeout) {
      clearTimeout(this.timeout)
    }

    this.timeout = setTimeout(() => {
      let childProcess = this.childProcess

      if (childProcess) {
        childProcess.restart = true
        childProcess.kill()
      } else {
        this.runCommand()
      }
    }, 200)
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
  --patch | --minor | --major   Release a patch, minor or major version. For 'release' command only.
  --clean                       Do a clean build.  For 'build' command only.
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
        if (key.name === 'c') {
          process.exit()
        } else {
          this.restartCommand()
        }
      }
    })

    this.runCommand()

    let watchers = []

    dirnames.forEach(dirname => {
      const watcher = fs.watch(dirname)

      watcher.on('change', (eventType, filename) => {
        this.restartCommand()
      })

      watchers.push(watcher)
    })

    return 0
  }
}
