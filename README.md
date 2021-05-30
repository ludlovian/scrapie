# scrapie
Ultra-light html &amp; xml parser


## Why?

For myself.

But also, most scrapers & parsers do far more than I need. Why learn a
while new DSL in either XSLT paths or JQuery commands when a few
lines of JS will do it?

It is super simple, very tolerant and docile. Like a sheep.

### How does it work

HTML or XML data is split into different types of elements 
as it is streamed in.
Every data element is given a `depth` based on how deep it is in the document.

Self-closing tags are represented as both opening and closing tags.

Omitted closes, such as for `<br>`, are injected when the parent tag closes.

Comments & scripts are identified and ignored.

Elements produced:

- opening tags `{ type, attrs }`
- closing tags `{ type, close: true }`
- text `{ text }`
- cdata `{ cdata }`
- weirdies, like prologs & declarations `{ meta }`

(Note that well formed `<meta>` tags will appear as regular tags)


## Scrapie

There are no options. Just create one.
```
import Scrapie from 'scrapie'

const s = new Scrapie()
```

### .write(text)
Push data in as you get it.

### .on(event, callback)
Register a callback for an event. Returns the scrapie for chaining.

There are four events:

- `data` which gets all the data objects
- `text` which just gets the text of text objects
- `enter` which gets the open tag which matches a sub-scrapie
- `exit` which gets the matching closing tag

### .when(condition)
Creates and returns a sub-scrapie.

This will only become active
when it encounters an opening tag that meets this condition, and it will
then receive all the data objects inside that tag.

The condition is a function with signature `data => Boolean`

There are two shortcuts. A string of `'elementType'` will just select tags of
that type. And a string of `elementType.class` will select tags of that type
where the class includes the given class.

## Example

The following will wait for a `table` element. And then for each `tr` will
collect all the text appearing under `td` elements, calling `postRow` when
the row is left.

```
const s = new Scrapie()

let row
s.when('table')
  .when('tr')
  .on('enter', () => { row = [] })
  .on('exit', () => postRow(row))
  .when('td')
  .on('text', t => row.push(t))

for await (const chunk of source) {
  s.write(chunk)
}
```
