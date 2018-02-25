const axios = require('axios')
const cheerio = require('cheerio')
const {getResultsFromSearch} = require('./info.js')

const BASE_URI = 'https://myanimelist.net/anime/'

const parsePage = ($) => {
  const allItems = $('tr.episode-list-data')
  const result = []

  // Because MAL shows twice the number of elements for the order
  const items = allItems.slice(0, allItems.length / 2)

  items.each(function (elem) {
    result.push({
      epNumber: +$(this).find('td.episode-number').text().trim(),
      aired: $(this).find('td.episode-aired').text().trim(),
      discussionLink: $(this).find('td.episode-forum').text().trim(),
      title: $(this).find('td.episode-title > a').text().trim(),
      japaneseTitle: $(this).find('td.episode-title > span').text().trim()
    })
  })

  return result
}

const getEpisodesFromName = (name) => {
  return new Promise((resolve, reject) => {
    getResultsFromSearch(name)
      .then((items) => {
        const {url} = items[0]

        axios.get(`${encodeURI(url)}/episode`)
          .then(({data}) => {
            const $ = cheerio.load(data)

            resolve(parsePage($))
          })
          .catch((err) => reject(err))
      })
      .catch((err) => reject(err))
  })
}

const getEpisodesFromNameAndId = (id, name) => {
  return new Promise((resolve, reject) => {
    axios.get(`${BASE_URI}${id}/${encodeURI(name)}/episode`)
      .then(({data}) => {
        const $ = cheerio.load(data)

        resolve(parsePage($))
      })
      .catch((err) => reject(err))
  })
}

const getEpisodesList = (obj) => {
  return new Promise((resolve, reject) => {
    if (!obj) {
      reject(new Error('[Mal-Scraper]: No id nor name given.'))
      return
    }

    if (typeof obj === 'object' && !obj[0]) {
      const {id, name} = obj

      if (!id || !name) {
        reject(new Error('[Mal-Scraper]: Malformed input. ID or name is missing.'))
        return
      }

      getEpisodesFromNameAndId(id, name)
        .then((data) => resolve(data))
        .catch((err) => reject(err))
    } else {
      getEpisodesFromName(obj)
        .then((data) => resolve(data))
        .catch((err) => reject(err))
    }
  })
}

module.exports = {
  getEpisodesList
}
