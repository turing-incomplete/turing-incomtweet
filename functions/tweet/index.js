'use strict';

var https = require('https'),
  querystring = require('querystring')

require('./env')

let githubBase = "raw.githubusercontent.com"
let githubBasePath = "/turing-incomplete/turing-incomplete/master/"

function findKey(arr, key) {
  for(var i=0; i<arr.length; i++) {
    if(arr[i].includes(key)) {
      return i
    }
  }
}

function parseEpisode(data) {
  var splitData = data.split('\n')
  var episodeIndex = findKey(splitData, 'episode')
  var episodeNumber = splitData[episodeIndex].substring(9)

  var episodeTitleIndex = findKey(splitData, 'tweet_title')
  var episodeTitle = splitData[episodeTitleIndex].substring(13)

  var episodeTextIndex = findKey(splitData, 'tweet_text')
  var episodeText = splitData[episodeTextIndex].substring(12)

  return {
    episode: episodeNumber,
    episodeTitle: episodeTitle,
    episodeText: episodeText
  }
}

function tweetEpisode(text){
  var postData = querystring.stringify({
    text: text,
    profile_ids: [process.env.BUFFER_PROFILE_ID]
  })

  var req = https.request({
    hostname: 'api.bufferapp.com',
    path: `/1/updates/create.json?access_token=${process.env.BUFFER_TOKEN}`,
    port: 443,
    method: 'POST',
    headers: {'content-type' : 'application/x-www-form-urlencoded'}
  }, (res) => {
    var str = ''

    res.on('data', function (chunk) {
      str += chunk
    })

    res.on('end', function () {
      console.log(str)
    })
  })

  req.write(postData)
  req.end()
}

console.log('starting function')

exports.handle = function(event, ctx, cb) {
  console.log('processing event: %j', event)
  let e = JSON.parse(event.Records[0].Sns.Message)

  var branch = e.ref,
    headCommit = e.head_commit,
    addedEpisodes = headCommit.added.filter(e => e.includes('source/episodes'))

  if(branch == "refs/heads/master" && addedEpisodes.length > 0) {
    addedEpisodes.forEach(function iterator(el, i, arr) {
      var req = https.request({
        hostname: githubBase,
        path: `${githubBasePath}${el}`,
        port: 443,
        method: 'GET'
      }, (res) => {
        var str = '';

        res.on('data', function (chunk) {
          str += chunk;
        });

        res.on('end', function () {
          if(res.statusCode != 200) {
            cb(JSON.stringify({ error: res.statusCode}))
            return
          }

          let parsedData = parseEpisode(str),
            episode = parsedData.episode,
            episodeTitle = parsedData.episodeTitle,
            episodeText = parsedData.episodeText

          if(!episode || !episodeTitle || !episodeText) {
            cb(JSON.stringify({
              error: "missing data",
              episode: episode,
              episodeTitle: episodeTitle,
              episodeText
            }))
            return
          }

          let tweetText=`Turing-Incomplete #${episode} - ${episodeTitle}

${episodeText}

turing.cool/${episode}`
          tweetEpisode(tweetText)
          cb(null, "Success!")
        });
      })

      req.end()
    })
  }
}
