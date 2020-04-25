const MarkdownIt = require('markdown-it')
const MarkdownItMathJaX3 = require('..')
const fs = require('fs')
console.log(MarkdownIt().use(MarkdownItMathJaX3).render(fs.readFileSync(`${__dirname}/example.md`, 'utf-8')))

