# Monzilla

An uncomplicated file monitoring tool. Use it for simple, non-Webpack or Browserify based Node.js projects that that you want to restart when files change, such as servers or games.

## Background

There are quite a few file monitoring tools out there. [nodemon](https://www.npmjs.com/package/nodemon) and [Watchman](https://facebook.github.io/watchman/) for example. However, many of them, including `nodemon` have weird rules about what files they monitor that have grown up over time, or in the case of `watchman` just too many whistles and bells.  I wanted a monitoring tool that would watch an explicit globbed list of files and restart a command when any of them changed, with no surprises, with the ability to force a restart at any time.  That's what this tool does.

## Installation

Install the tool with:

```Shell
npm install monzilla
```

or run it with:

```Shell
npx monzilla
```

Run a command as follows:

```Shell
> monzilla 'scratch/*.js' -- node scratch/test.js
[monzilla] Running command 'node scratch/test.js'
I think that I shall never see
a billboard lovely as a tree
[monzilla] Command exited cleanly
[monzilla] Waiting for file changes to restart. Control+C to exit; Control+R to restart now
```

Monzilla takes two sets of arguments.

1. A list of [globs](https://www.npmjs.com/package/glob) separated by colons. It's a good idea to quote this argument.
2. A command to run, separated from the glob argument by `--` for clarity, and because that's how [minimist](https://www.npmjs.com/package/minimist) prefers it.

If the command exits, you can run it again with `Control+R`, or by changing one of the watched glob files.  `Control+C` kills any long running process and exits.

The tool will watch files in symlinked directories, such as when a file in `npm link`ed under `node_modules`.

## About the Code

The tool is written in ES6 Javascript and transpiled with Babel.

All claims of superiority to other file monitoring tools are the sole opinion of the author.  Also, it's really hard to find a good `npm` package name that hasn't already been taken... ;)
