const axios = require('axios')
const cheerio = require('cheerio')

const SEARCH_URI = 'https://myanimelist.net/search/prefix.json'

const getFromBorder = ($, t) => {
  return $(`span:contains("${t}")`).parent().text().trim().split(' ').slice(1).join(' ').trim()
}

const parseCharacterOrStaff = (tr, isStaff = false) => {
  return JSON.parse(JSON.stringify({
    link: tr.find('td:nth-child(1)').find('a').attr('href'),
    name: tr.find('td:nth-child(2)').text().trim().split('\n')[0],
    role: tr.find('td:nth-child(2)').text().trim().split('\n')[2].trim(),
    seiyuu: !isStaff ? {
      link: tr.find('td:nth-child(3)').find('a').attr('href'),
      name: tr.find('td:nth-child(3)').find('a').text().trim()
    } : undefined
  }))
}

const getCharactersAndStaff = ($) => {
  const results = {
    characters: [],
    staff: []
  }

  // Characters
  const leftC = $('div.detail-characters-list').first().find('div.left-column')
  const rightC = $('div.detail-characters-list').first().find('div.left-right')

  const nbLeftC = leftC.children('table').length
  const nbRightC = rightC.children('table').length

  // Staff
  const leftS = $('div.detail-characters-list').last().find('div.left-column')
  const rightS = $('div.detail-characters-list').last().find('div.left-right')

  const nbLeftS = leftS.children('table').length
  const nbRightS = rightS.children('table').length

  // Characters
  for (let i = 1; i <= nbLeftC; ++i) {
    results.characters.push(parseCharacterOrStaff(leftC.find(`table:nth-child(${i}) > tbody > tr`)))
  }

  for (let i = 1; i <= nbRightC; ++i) {
    results.characters.push(parseCharacterOrStaff(rightC.find(`table:nth-child(${i}) > tbody > tr`)))
  }

  // Staff
  for (let i = 1; i <= nbLeftS; ++i) {
    results.staff.push(parseCharacterOrStaff(leftS.find(`table:nth-child(${i}) > tbody > tr`), true))
  }

  for (let i = 1; i <= nbRightS; ++i) {
    results.staff.push(parseCharacterOrStaff(rightS.find(`table:nth-child(${i}) > tbody > tr`), true))
  }

  return results
}

const getInfoFromURL = (url) => {
  return new Promise((resolve, reject) => {
    const result = {}
    axios.get(url).then((res) => {
      const $ = cheerio.load(res.data)

      result.title = $('span[itemprop="name"]').first().text()
      result.synopsis = $('.js-scrollfix-bottom-rel span[itemprop="description"]').text()
      result.picture = $('img.ac').attr('src')

      const staffAndCharacters = getCharactersAndStaff($)
      result.characters = staffAndCharacters.characters
      result.staff = staffAndCharacters.staff

      result.trailer = $('a.iframe.js-fancybox-video.video-unit.promotion').attr('href')

      // Parsing left border.
      result.englishTitle = getFromBorder($, 'English:') || ''
      result.japaneseTitle = getFromBorder($, 'Japanese:') || ''
      result.synonyms = getFromBorder($, 'Synonyms:') || ''
      result.type = getFromBorder($, 'Type:') || ''
      result.episodes = getFromBorder($, 'Episodes:') || ''
      result.status = getFromBorder($, 'Status:') || ''
      result.aired = getFromBorder($, 'Aired:') || ''
      result.premiered = getFromBorder($, 'Premiered:') || ''
      result.broadcast = getFromBorder($, 'Broadcast:') || ''
      result.producers = getFromBorder($, 'Producers:').split(',       ') || ''
      result.source = getFromBorder($, 'Source:') || ''
      result.genres = getFromBorder($, 'Genres:').split(', ') || ''
      result.duration = getFromBorder($, 'Duration:') || ''
      result.rating = getFromBorder($, 'Rating:') || ''
      result.score = getFromBorder($, 'Score:').split('\n')[0].split(' ')[0].slice(0, -1) || ''
      result.scoreStats = getFromBorder($, 'Score:').split('\n')[0].split(' ').slice(1).join(' ').slice(1, -1) || ''
      result.ranked = getFromBorder($, 'Ranked:').split('\n')[0].slice(0, -1) || ''
      result.popularity = getFromBorder($, 'Popularity:') || ''
      result.members = getFromBorder($, 'Members:') || ''
      result.favorites = getFromBorder($, 'Favorites:') || ''

      resolve(result)
    }).catch((err) => {
      reject(err)
    })
  })
}

const getResultsFromSearch = (keyword) => {
  let items = []

  return new Promise((resolve, reject) => {
    axios.get(SEARCH_URI, {
      params: {
        type: 'anime',
        keyword
      }
    }).then(({data}) => {
      data.categories.forEach((elem) => {
        if (elem.type === 'anime') {
          elem.items.forEach((item) => {
            items.push(item)
          })
        }
      })

      resolve(items)
    }).catch((err) => {
      reject(err)
    })
  })
}

const getBestMatch = (name, items) => {
  let index = 0

  const toSearch = name.replace(' ', '').toLowerCase()

  items.forEach((item, i) => {
    const looking = item.name.replace(' ', '').toLowerCase()
    if (looking === toSearch) index = i
  })

  return items[index]
}

module.exports = {
  getInfoFromURL,
  getResultsFromSearch,
  getBestMatch
}
