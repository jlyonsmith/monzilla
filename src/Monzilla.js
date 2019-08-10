#!/usr/bin/env node
import { MonzillaTool } from "./MonzillaTool"
import chalk from "chalk"
import path from "path"

const log = {
  info: console.info,
  error: function() {
    console.error(chalk.red("error:", [...arguments].join(" ")))
  },
  warning: function() {
    console.error(chalk.yellow("warning:", [...arguments].join(" ")))
  },
  info2: function() {
    console.info(chalk.green("[monzilla]", [...arguments].join(" ")))
  },
  error2: function() {
    console.error(chalk.red("[monzilla] error:", [...arguments].join(" ")))
  },
  warning2: function() {
    console.error(chalk.yellow("[monzilla] warning:", [...arguments].join(" ")))
  },
}

const tool = new MonzillaTool({
  toolName: path.basename(process.argv[1], ".js"),
  log,
})

tool
  .run(process.argv.slice(2))
  .then((exitCode) => {
    if (exitCode !== 0) {
      process.exit(exitCode)
    }
  })
  .catch((err) => {
    console.error(err)
  })
