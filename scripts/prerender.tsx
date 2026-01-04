#!/usr/bin/bun
// @ts-nocheck

import { renderToString } from 'react-dom/server'

import { minify } from 'html-minifier'
import App from '../src/app'

const template = await Bun.file('dist/index.html')
	.text()
	.then(async (x) =>
		x.replace(
			/<link rel="stylesheet" \b[^>]*>/,
			'<style>' +
				(await Bun.$`bunx @tailwindcss/cli -i ./src/global.css --minify`
					.quiet()
					.then((x) => x.text())) +
				'</style>'
		)
	)

const [start, end] = minify(template, {
	collapseWhitespace: true
}).split('<div id="root"></div>')

const html = renderToString(<App />)

Bun.write(
	Bun.file('dist/index.html'),
	start + '<div id="root">' + html + '</div>' + end
)
