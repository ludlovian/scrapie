import { test } from 'uvu'
import * as assert from 'uvu/assert'

import ParseEngine from '../src/engine.mjs'

test.before.each(ctx => {
  ctx.data = []
  ctx.parser = new ParseEngine(x => ctx.data.push(x))
})

test('basic tag & text', ({ parser, data }) => {
  parser.write(['<foo bar="quux">', 'biz baz', '</foo>'].join(''))

  const exp = [
    { type: 'foo', attrs: { bar: 'quux' } },
    { text: 'biz baz' },
    { type: 'foo', close: true }
  ]

  assert.equal(data, exp)
})

test('basic written char by char', ({ parser, data }) => {
  const s = ['<foo bar="quux">', 'biz baz', '</foo>'].join('')
  for (const c of s) parser.write(c)

  const exp = [
    { type: 'foo', attrs: { bar: 'quux' } },
    { text: 'biz baz' },
    { type: 'foo', close: true }
  ]

  assert.equal(data, exp)
})

test('inital text', ({ parser, data }) => {
  const s = 'quux<baz>foo'
  parser.write(s)

  const exp = [{ text: 'quux' }, { type: 'baz', attrs: {} }]
  assert.equal(data, exp)
})

test('meta tag', ({ parser, data }) => {
  parser.write('<?meta foo bar>')
  parser.write('<foo>')
  parser.write('bar')
  parser.write('</foo>')

  const exp = [
    { meta: '?meta foo bar' },
    { type: 'foo', attrs: {} },
    { text: 'bar' },
    { type: 'foo', close: true }
  ]
  assert.equal(data, exp)
})

test('cdata', ({ parser, data }) => {
  const s = 'foo<![CDATA[bar]]><baz>'
  parser.write(s)

  const exp = [{ text: 'foo' }, { cdata: 'bar' }, { type: 'baz', attrs: {} }]
  assert.equal(data, exp)
})

test('cdata char by char', ({ parser, data }) => {
  const s = 'foo<![CDATA[bar]]><baz>'
  for (const c of s) parser.write(c)

  const exp = [{ text: 'foo' }, { cdata: 'bar' }, { type: 'baz', attrs: {} }]
  assert.equal(data, exp)
})

test('huge cdata', ({ parser, data }) => {
  const DATA = ']'.repeat(1024)
  const s = '<![CDATA[' + DATA + DATA + ']]>'
  for (const c of s) parser.write(c)

  assert.equal(data, [{ cdata: DATA }, { cdata: DATA }])
})

test('attribues with double quotes', ({ parser, data }) => {
  parser.write('<foo bar="baz" quux="boo far">')
  parser.write('</foo>')

  const exp = [
    { type: 'foo', attrs: { bar: 'baz', quux: 'boo far' } },
    { type: 'foo', close: true }
  ]
  assert.equal(data, exp)
})

test('attribues with single quotes', ({ parser, data }) => {
  parser.write("<foo bar='baz' quux='boo far'>")
  parser.write('</foo>')

  const exp = [
    { type: 'foo', attrs: { bar: 'baz', quux: 'boo far' } },
    { type: 'foo', close: true }
  ]
  assert.equal(data, exp)
})

test('attribues with no quotes', ({ parser, data }) => {
  parser.write('<foo bar=baz quux=boofar>')
  parser.write('</foo>')

  const exp = [
    { type: 'foo', attrs: { bar: 'baz', quux: 'boofar' } },
    { type: 'foo', close: true }
  ]
  assert.equal(data, exp)
})

test('self closing elements', ({ parser, data }) => {
  parser.write('<foo>')
  parser.write('<bar baz="quux"/>')
  parser.write('</foo>')

  const exp = [
    { type: 'foo', attrs: {} },
    { type: 'bar', attrs: { baz: 'quux' }, selfClose: true },
    { type: 'foo', close: true }
  ]
  assert.equal(data, exp)
})

test('ignore comments', ({ parser, data }) => {
  parser.write('<foo>')
  parser.write('<!--')
  parser.write('<bar>')
  parser.write('-->')
  parser.write('</foo>')

  const exp = [
    { type: 'foo', attrs: {} },
    { type: 'foo', close: true }
  ]
  assert.equal(data, exp)
})

test('ignore script', ({ parser, data }) => {
  parser.write('<foo>')
  parser.write('<script>')
  parser.write('<bar>')
  parser.write('</script>')
  parser.write('</foo>')

  const exp = [
    { type: 'foo', attrs: {} },
    { type: 'foo', close: true }
  ]
  assert.equal(data, exp)
})

test.run()
