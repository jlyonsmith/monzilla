import { Monzilla } from './Monzilla'
import fs from 'fs'
import util from 'util'

function getMockLog() {
  return {
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn()
  }
}

function getOutput(fn) {
  const calls = fn.mock.calls
  if (calls.length > 0 && calls[0].length > 0) {
    return calls[0][0]
  } else {
    return ''
  }
}

test('test help', done => {
  const mockLog = getMockLog()
  const tool = new Monzilla(mockLog)

  return tool.run(['--help']).then(exitCode => {
    expect(exitCode).toBe(0)
    expect(getOutput(mockLog.info)).toEqual(expect.stringContaining('--help'))
    done()
  })
})

test('test version', done => {
  const mockLog = getMockLog()
  const tool = new Monzilla(mockLog)

  return tool.run(['--version']).then(exitCode => {
    expect(exitCode).toBe(0)
    expect(getOutput(mockLog.info)).toEqual(expect.stringMatching(/\d\.\d\.\d/))
    done()
  })
})

test('test no args', done => {
  const mockLog = getMockLog()
  const tool = new Monzilla(mockLog)

  return tool.run([]).then(exitCode => {
    expect(exitCode).toBe(-1)
    done()
  })
})
