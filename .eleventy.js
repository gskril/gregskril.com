const readingTime = require("eleventy-plugin-reading-time")

module.exports = function (eleventyConfig) {
	eleventyConfig.addPassthroughCopy("img")
	eleventyConfig.addPassthroughCopy("css")

	eleventyConfig.addPlugin(readingTime)

	eleventyConfig.addFilter("limit", function (arr, limit) {
		return arr.slice(0, limit)
	})

	return {
		dir: {
			input: "src",
		},
	}
}
