import { test } from 'uvu'
import * as assert from 'uvu/assert'

import ClosingParser from '../src/closing-parser.mjs'

test.before.each(ctx => {
  ctx.data = []
  ctx.parser = new ClosingParser(x => ctx.data.push(x))
})

test('basic tag & text is passed through', ({ parser, data }) => {
  parser.write('<foo bar="baz">')
  parser.write('quux boofar')
  parser.write('</foo>')

  const exp = [
    { type: 'foo', attrs: { bar: 'baz' }, depth: 0 },
    { text: 'quux boofar', depth: 1 },
    { type: 'foo', close: true, depth: 0 }
  ]

  assert.equal(data, exp)
})

test('implied close is sent', ({ parser, data }) => {
  parser.write('<foo bar="baz">')
  parser.write('<bar>')
  parser.write('boofar')
  parser.write('</foo>')

  const exp = [
    { type: 'foo', attrs: { bar: 'baz' }, depth: 0 },
    { type: 'bar', attrs: {}, depth: 1 },
    { text: 'boofar', depth: 2 },
    { type: 'bar', close: true, depth: 1 },
    { type: 'foo', close: true, depth: 0 }
  ]

  assert.equal(data, exp)
})

test('self close is sent', ({ parser, data }) => {
  parser.write('<foo bar="baz">')
  parser.write('<bar />')
  parser.write('boofar')
  parser.write('</foo>')

  const exp = [
    { type: 'foo', attrs: { bar: 'baz' }, depth: 0 },
    { type: 'bar', attrs: {}, depth: 1 },
    { type: 'bar', close: true, depth: 1 },
    { text: 'boofar', depth: 1 },
    { type: 'foo', close: true, depth: 0 }
  ]

  assert.equal(data, exp)
})

test('unopened close is handled', ({ parser, data }) => {
  parser.write('<foo bar="baz">')
  parser.write('</bar>')
  parser.write('boofar')
  parser.write('</foo>')

  const exp = [
    { type: 'foo', attrs: { bar: 'baz' }, depth: 0 },
    { type: 'foo', close: true, depth: 0 },
    { type: 'bar', close: true, depth: 0 },
    { text: 'boofar', depth: 0 },
    { type: 'foo', close: true, depth: 0 }
  ]

  assert.equal(data, exp)
})

test.run()
