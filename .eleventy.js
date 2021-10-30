module.exports = function (eleventyConfig) {
	eleventyConfig.addPassthroughCopy("img")
	eleventyConfig.addPassthroughCopy("css")
	
	// Add pluginf or reading time on blog posts
	const readingTime = require("eleventy-plugin-reading-time")
	eleventyConfig.addPlugin(readingTime)

	// Optimize generated HTML links
	const markdownIt = require("markdown-it")

	const markdownItOptions = {
		html: true,
	}
	const mila = require("markdown-it-link-attributes")
	const milaOptions = {
		pattern: /^https:/,
		attrs: {
			target: "_blank",
			rel: "noopener",
		},
	}
	
	const markdownLib = markdownIt(markdownItOptions).use(mila, milaOptions)
	eleventyConfig.setLibrary("md", markdownLib)

	// Add filter to limit number of posts shown on collection pages
	eleventyConfig.addFilter("limit", function (arr, limit) {
		return arr.slice(0, limit)
	})

	return {
		dir: {
			input: "src",
		},
	}
}
