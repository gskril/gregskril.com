const { DateTime } = require('luxon')
const markdownIt = require('markdown-it')
const mila = require('markdown-it-link-attributes')
const readingTime = require('eleventy-plugin-reading-time')
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('img')
  eleventyConfig.addPassthroughCopy('css')

  // Plugin for reading time on blog posts
  eleventyConfig.addPlugin(readingTime)

  // Plugin for syntax highlighting code elements in blog posts
  eleventyConfig.addPlugin(syntaxHighlight)

  // Date formatting for blog posts
  eleventyConfig.addFilter('postDate', (dateObj) => {
    // Add one day to the date to correct for time zones
    return DateTime.fromJSDate(dateObj, { zone: 'America/New_York' })
      .plus({ days: 1 })
      .toLocaleString(DateTime.DATE_MED)
  })

  // Optimize generated HTML links
  const markdownItOptions = {
    html: true,
  }
  const milaOptions = {
    pattern: /^https:/,
    attrs: {
      target: '_blank',
      rel: 'noopener',
    },
  }
  const markdownLib = markdownIt(markdownItOptions).use(mila, milaOptions)
  eleventyConfig.setLibrary('md', markdownLib)

  // Add filter to limit number of posts shown on collection pages
  eleventyConfig.addFilter('limit', function (arr, limit) {
    return arr.slice(0, limit)
  })

  return {
    dir: {
      input: 'src',
    },
  }
}
