import { test } from 'uvu'
import * as assert from 'uvu/assert'

import Parsley from '../src/parsley.mjs'

test('basic cosntruction', () => {
  const xml = '<foo><bar>quux</bar>baz<boz /></foo>'
  const p = new Parsley(xml)

  assert.instance(p, Parsley, 'Created ok')
  assert.is(p.xml, xml, 'captured all the input')
})

test('basic extract', () => {
  const xml = '<a><b x="1">quux</b><b x="2">foobar</b></a>'
  let p = new Parsley(xml)

  p = p.find('b')

  assert.instance(p, Parsley, 'find is a Parsley')
  assert.is(p.attrs.x, '1')
  assert.is(p.type, 'b')
  assert.is(p.text, 'quux')
  assert.equal(p.child, 'quux')
  assert.equal(p.children, ['quux'])
})

test('multiple extract', () => {
  const xml = '<a><b x="1">quux</b><b x="2">foobar</b></a>'
  const p = new Parsley(xml)

  const p1 = p.find('b')
  const p2 = p.findAll('b')

  assert.instance(p1, Parsley, 'find is a Parsley')
  assert.equal(p1.text, 'quux')

  assert.ok(Array.isArray(p2), 'findAll produces an array')
  assert.ok(p2.every(x => x instanceof Parsley))

  assert.equal(
    p2.map(p => p.text),
    ['quux', 'foobar']
  )

  assert.equal(p.textAll, ['quux', 'foobar'])
})

test('functional condition', () => {
  const xml = '<a><b x="1">quux</b><b x="2">foobar</b></a>'
  const p = new Parsley(xml)

  const p1 = p.find(p => p.attrs.x === '2')
  assert.is(p1.text, 'foobar')
})

test('empty results', () => {
  const xml = '<foo><bar></bar></foo>'

  const p = new Parsley(xml)
  assert.is(p.find('baz'), null)
  assert.equal(p.findAll('baz'), [])
})

test.run()
