const commander = require('commander')
const { getYoutubeVideo } = require('./apis')

function myParseInt(value, dummyPrevious) {
  // parseInt takes a string and a radix
  const parsedValue = parseInt(value, 10)
  if (isNaN(parsedValue)) {
    throw new commander.InvalidOptionArgumentError('Not a number.')
  }
  return parsedValue
}

function getSourceVideoUrlFromDescription(description) {
  const url = ((description || '').split('\n')[0] || '').trim()
  return url
}

function getSourceVideoInfoFromDescription(description) {
  // https://www.youtube.com/watch?v=iI4pqMbrQn0
  // https://vimeo.com/543793330
  let type = ''
  let id = ''
  const url = getSourceVideoUrlFromDescription(description)
  const youtubeRegexp = /youtube.com\/watch\?v=([a-zA-z0-9-_]+)/g
  const youtubeFound = youtubeRegexp.exec(url)
  const vimeoRegexp = /vimeo.com\/([a-zA-z0-9-_]+)/g
  const vimeoFound = vimeoRegexp.exec(url)
  if (youtubeFound && youtubeFound[1]) {
    type = 'youtube'
    id = youtubeFound[1]
  } else if (vimeoFound && vimeoFound[1]) {
    type = 'vimeo'
    id = vimeoFound[1]
  }
  return {
    url,
    type,
    id,
  }
}

module.exports = {
  myParseInt,
  getSourceVideoInfoFromDescription,
}
