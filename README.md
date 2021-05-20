# scrapie
Ultra-light html &amp; xml parser

## Why?

For myself.

But also, most scrapers & parsers do far more than I need. Why learn a
while new DSL in either XSLT paths or JQuery commands when a few
lines of JS will do it.

It is super simple, very tolerant and docile. Like a sheep.

## How does it work

HTML or XML data is split into `text` and `tag` elements as it is streamed in.

Tags are then parsed to see if we can understand them - i.e. with a type
and attributes.

CDATA, bare &lt;script&gt; tags and comments are all identified and ignored.

## API

### Scrapie

There are no options. Just create one.
```
import Scrapie from 'scrapie'

const s = new Scrapie()
```

### .write(text)
Push data in as you get it.

### .close
You don't need to call it, but you can if it gives a sense of closure.

### .path / .depth
The path is the array of tags that get you back to the top.

E.g. `['html', 'body', 'table', 'tr', 'td', 'a']`

And `.depth` is simply the path length.

### .hook(fn)
The guts of it.

The supplied function is called with `({ tag, text }, this)` on each
tag opening, or text element.

Hooks added during parsing (i.e. when `depth > 0` are automatically removed
when the depth goes back above the point where they were added.

This allows you to chain one hook conditional on another.

### .whenTag(condition, action)
A nicer wrapper around `.hook`.

The condition function is called with `(tag, this)`. If it returns truthy
then the action function is called.

### .onText(action)
A simple wrapper around `.hook` to be called only for text elements.
