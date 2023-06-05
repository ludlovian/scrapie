import { test } from 'uvu'
import * as assert from 'uvu/assert'

import Scrapie from '../src/index.mjs'

test('basic conditional capture', () => {
  const scrapie = new Scrapie()
  const doc = '<foo><bar>quux</bar>baz</foo>'
  const res = []
  scrapie
    .when('foo')
    .when('bar')
    .onEnter(() => res.push('START'))
    .on('text', t => res.push(t))
    .on('exit', () => res.push('END'))

  scrapie.write(doc)

  const exp = ['START', 'quux', 'END']

  assert.equal(res, exp)
})

test('capture everything', () => {
  const scrapie = new Scrapie()
  const doc = '<foo><bar>quux</bar></foo>'
  const res = []

  scrapie
    .when('foo', () => res.push('START'))
    .on('exit', () => res.push('END'))
    .on('data', data => res.push(data))

  scrapie.write(doc)

  assert.equal(res, [
    'START',
    { type: 'bar', attrs: {}, depth: 1 },
    { text: 'quux', depth: 2 },
    { type: 'bar', close: true, depth: 1 },
    'END'
  ])
})

test('multiple entries', () => {
  const scrapie = new Scrapie()
  const doc = '<foo><bar>quux</bar><bar>boofar</bar></foo>'
  const res = []
  scrapie
    .when('foo')
    .when('bar')
    .on('enter', () => res.push('START'))
    .on('text', t => res.push(t))
    .on('exit', () => res.push('END'))

  scrapie.write(doc)

  assert.equal(res, ['START', 'quux', 'END', 'START', 'boofar', 'END'])
})

test('select with function', () => {
  const scrapie = new Scrapie()
  const doc = '<foo><bar baz="biz">quux</bar><bar>boofar</bar></foo>'
  const res = []

  scrapie
    .when(({ attrs }) => attrs && attrs.baz === 'biz')
    .on('data', d => res.push(d))
    .write(doc)

  const exp = [{ text: 'quux', depth: 2 }]

  assert.equal(res, exp)
})

test('select with class', () => {
  const scrapie = new Scrapie()
  const doc = '<foo><bar class="biz baz">quux</bar><bar>boofar</bar></foo>'
  const res = []

  scrapie
    .when('bar.baz')
    .on('data', d => res.push(d))
    .write(doc)

  const exp = [{ text: 'quux', depth: 2 }]

  assert.equal(res, exp)
})

test('multiple hooks', () => {
  const scrapie = new Scrapie()
  const doc = '<foo><bar>quux</bar>baz</foo>'
  const res = []
  scrapie
    .when('bar')
    .on('text', t => res.push('1: ' + t))
    .on('text', t => res.push('2: ' + t))
    .write(doc)

  const exp = ['1: quux', '2: quux']

  assert.equal(res, exp)
})

test.run()
