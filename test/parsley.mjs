import { test } from 'uvu'
import * as assert from 'uvu/assert'

import Parsley from '../src/parsley.mjs'

test('basic cosntruction', () => {
  const xml = '<foo><bar>quux</bar>baz</foo>'
  const p = new Parsley(xml)

  const exp = [
    { type: 'foo', attrs: {}, depth: 0 },
    { type: 'bar', attrs: {}, depth: 1 },
    { text: 'quux', depth: 2 },
    { type: 'bar', close: true, depth: 1 },
    { text: 'baz', depth: 1 },
    { type: 'foo', close: true, depth: 0 }
  ]
  assert.equal(p.elems, exp, 'parsed ok')
})

test('basic extract', () => {
  const xml = ['<foo>', '<bar id=1>', 'quux', '</bar>', '</foo>'].join('')

  let p = new Parsley(xml)

  p = p.find('bar')

  assert.is(p.tag.attrs.id, '1')
  assert.is(p.elems.length, 3)

  assert.equal(p.content.elems, [{ text: 'quux', depth: 2 }])

  assert.equal(p.text, 'quux')
  assert.equal(p.text, p.content.text)
})

test('multiple extract', () => {
  const xml = [
    '<foo>',
    '<bar id=1>',
    'quux1',
    '</bar>',
    '<bar id=2>',
    'quux2',
    '</bar>',
    '</foo>'
  ].join('')

  const p = new Parsley(xml)

  const p1 = p.find('bar')
  const p2 = p.findAll('bar')

  assert.equal(p1.text, 'quux1')

  assert.ok(Array.isArray(p2))
  assert.ok(p2.every(x => x instanceof Parsley))

  assert.equal(
    p2.map(p => p.text),
    ['quux1', 'quux2']
  )

  assert.equal(p.textAll, ['quux1', 'quux2'])
})

test('functional condition', () => {
  const xml = [
    '<foo>',
    '<bar id=1>',
    'quux1',
    '</bar>',
    '<bar id=2>',
    'quux2',
    '</bar>',
    '</foo>'
  ].join('')

  const p = new Parsley(xml)

  const p1 = p.find(({ attrs }) => attrs.id === '2')
  assert.is(p1.text, 'quux2')
})

test('empty results', () => {
  const xml = '<foo><bar></bar></foo>'

  const p = new Parsley(xml)
  assert.is(p.find('baz'), null)

  assert.is(p.find('bar').content, null)
})

test.run()
