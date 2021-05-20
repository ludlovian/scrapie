import { test } from 'uvu'
import * as assert from 'uvu/assert'

import parseDoc from '../src/parse-doc.mjs'

test.before.each(ctx => {
  const events = (ctx.events = [])
  ctx.parser = parseDoc({
    onText: s => events.push(['text', s]),
    onTag: s => events.push(['tag', s]),
    onCData: s => events.push(['cdata', s])
  })
})

test('basic tag & text', ({ parser, events }) => {
  const s = '<foo bar="quux">biz baz</foo>'
  parser.write(s)
  parser.close()

  const exp = [
    ['tag', 'foo bar="quux"'],
    ['text', 'biz baz'],
    ['tag', '/foo']
  ]
  assert.equal(events, exp)
})

test('basic written char by char', ({ parser, events }) => {
  const s = '<foo bar="quux">biz baz</foo>'
  for (const c of s) parser.write(c)

  const exp = [
    ['tag', 'foo bar="quux"'],
    ['text', 'biz baz'],
    ['tag', '/foo']
  ]
  assert.equal(events, exp)
})

test('inital text', ({ parser, events }) => {
  const s = 'quux<baz>foo'
  parser.write(s)
  parser.close()

  const exp = [
    ['text', 'quux'],
    ['tag', 'baz']
  ]
  assert.equal(events, exp)
})

test('inital text char by char', ({ parser, events }) => {
  const s = 'quux<baz>foo'
  for (const c of s) parser.write(c)
  parser.close()

  const exp = [
    ['text', 'quux'],
    ['tag', 'baz']
  ]
  assert.equal(events, exp)
})

test('cdata', ({ parser, events }) => {
  const s = 'foo<![CDATA[bar]]><baz>'
  parser.write(s)
  parser.close()

  const exp = [
    ['text', 'foo'],
    ['cdata', 'bar'],
    ['tag', 'baz']
  ]
  assert.equal(events, exp)
})

test('cdata char by char', ({ parser, events }) => {
  const s = 'foo<![CDATA[bar]]><baz>'
  for (const c of s) parser.write(c)
  parser.close()

  const exp = [
    ['text', 'foo'],
    ['cdata', 'bar'],
    ['tag', 'baz']
  ]
  assert.equal(events, exp)
})

test('huge cdata', ({ parser, events }) => {
  const DATA = ']'.repeat(1024)
  const s = '<![CDATA[' + DATA + DATA + ']]>'
  for (const c of s) parser.write(c)
  parser.close()

  assert.equal(events, [
    ['cdata', DATA],
    ['cdata', DATA]
  ])
})

test('Comments ignored', ({ parser, events }) => {
  const s = '<foo>bar<!--<baz>--><quux>'
  for (const c of s) parser.write(c)
  parser.close()

  assert.equal(events, [
    ['tag', 'foo'],
    ['text', 'bar'],
    ['tag', 'quux']
  ])
})

test('Inline script ignored', ({ parser, events }) => {
  const s = '<foo>bar<script>a<b && b>c</script><quux>'
  for (const c of s) parser.write(c)
  parser.close()

  assert.equal(events, [
    ['tag', 'foo'],
    ['text', 'bar'],
    ['tag', 'quux']
  ])
})

test('Unclosed tag ignored', ({ parser, events }) => {
  parser.write('<foo')
  parser.close()
  assert.equal(events, [])
})

test('Unclosed cdata ignored', ({ parser, events }) => {
  parser.write('<![CDATA[foo')
  parser.close()
  assert.equal(events, [])
})

test('Close twice', ({ parser }) => {
  parser.close()
  assert.not.throws(() => parser.close())
})

test.run()
