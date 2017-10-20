# Monzilla

King of the file monitoring tools.

## Why Build This?

There are quite a few file monitoring tools out there. [nodemon](https://www.npmjs.com/package/nodemon) is a good one, for example. However, many of them, including `nodemon` have weird rules about what files they monitor that have grown up over time.  I wanted a file monitoring tool that would restart an command when a `glob` list of files changes, with no surprises.  That's what this tool is.

## How Does It Work?

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

If the command exits, you can run it again with `Control+R`, or by changing one of the watched glob files.

## About the Code

The tool is written in ES6 Javascript and transpiled to NodeJS 8.0 with Babel.  

All claims of superiority to other file monitoring tools are the sole opinion of the author.
