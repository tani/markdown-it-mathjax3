import MarkdownIt from 'markdown-it'
import MarkdownItMathJaX3 from '../index.js'
import fs from 'fs'
console.log(MarkdownIt().use(MarkdownItMathJaX3).render(fs.readFileSync(`./example/example.md`, 'utf-8')))

