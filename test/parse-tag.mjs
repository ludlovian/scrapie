import { test } from 'uvu'
import * as assert from 'uvu/assert'

import parseTag from '../src/parse-tag.mjs'

test('basic tag', () => {
  const res = parseTag('foo bar="baz" quux="foo bar"')
  assert.equal(res, {
    type: 'foo',
    attrs: {
      bar: 'baz',
      quux: 'foo bar'
    }
  })
})

test('meta tags', () => {
  let res
  res = parseTag('!DOCTYPE html foo bar')
  assert.equal(res, { text: '!DOCTYPE html foo bar' })

  res = parseTag('?meta foo bar')
  assert.equal(res, { text: '?meta foo bar' })
})

test('single quote strings', () => {
  const res = parseTag("foo bar='baz' quux='foo bar'")
  assert.equal(res, {
    type: 'foo',
    attrs: {
      bar: 'baz',
      quux: 'foo bar'
    }
  })
})

test('no quote strings', () => {
  const res = parseTag('foo bar=baz quux=foo')
  assert.equal(res, {
    type: 'foo',
    attrs: {
      bar: 'baz',
      quux: 'foo'
    }
  })
})

test('closing tags', () => {
  const res = parseTag('/foo')
  assert.equal(res, { type: 'foo', close: true })
})

test('self closing tags', () => {
  const res = parseTag('foo bar="baz" /')
  assert.equal(res, { type: 'foo', attrs: { bar: 'baz' }, selfClose: true })
})

test('lucy goosie spaces', () => {
  const res = parseTag('foo bar = "baz" / ')
  assert.equal(res, { type: 'foo', attrs: { bar: 'baz' }, selfClose: true })
})
test.run()
