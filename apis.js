const { URL } = require('url')
const axios = require('axios')
const HttpsProxyAgent = require('https-proxy-agent')

/* {
  comment: 5,
  typeid: 21,
  play: 3126,
  pic: 'http://i2.hdslb.com/bfs/archive/5f817bd4576c97a6f7000670fba0f58463c675dc.jpg',
  subtitle: '',
  description: 'https://www.youtube.com/watch?v=32DIbhMlUxw\n' +
    '电影是艺术的重要组成部分，但通过文学、绘画等其他形式也可以提高电影人的艺术修养。本期视频贯穿着思辨性的对话，借鉴了多名学者的思想成果，剖析了艺术作品的价值以及与鉴赏之间的关系。',
  copyright: '2',
  title: '【如何通过艺术提升自己 / How To Elevate Yourself Through Art】',
  review: 0,
  author: '电影传送门主页妹',
  mid: 57598190,
  created: 1623510703,
  length: '14:47',
  video_review: 3, 弹幕数
  aid: 888530887,
  bvid: 'BV1EK4y137fQ',
  hide_click: false,
  is_pay: 0,
  is_union_video: 0,
  is_steins_gate: 0,
  is_live_playback: 0
} */
async function listBilibiliVideos(page, size) {
  let videos = []
  try {
    const response = await axios.get(
      `https://api.bilibili.com/x/space/arc/search?mid=57598190&ps=${size}&tid=0&pn=${page}&keyword=&order=pubdate&jsonp=jsonp`
    )
    if (
      response &&
      response.data &&
      response.data.data &&
      response.data.data.list &&
      response.data.data.list.vlist
    ) {
      videos = response.data.data.list.vlist
    }
  } catch (error) {
    console.error(error)
  } finally {
    return videos
  }
}
/* {
  kind: 'youtube#video',
  etag: 'DU_v8ng8W-YZOc0osJCSEunecHI',
  id: 'moW17YHl6B8',
  snippet: {
    publishedAt: '2010-06-14T07:41:46Z',
    channelId: 'UCGqQRF9Vld7Ggof0F4zfwzg',
    title: 'The Matrix vs. Dark City.',
    description: ''
    thumbnails: {
      default: [Object],
      medium: [Object],
      high: [Object],
      standard: [Object]
    },
    channelTitle: 'Clara Darko',
    tags: [],
    categoryId: '1',
    liveBroadcastContent: 'none',
    localized: {
      title: 'The Matrix vs. Dark City.',
      description: ''
    }
  }
} */
async function getYoutubeVideo(id) {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
  const HTTPS_PROXY = process.env.HTTPS_PROXY

  try {
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${YOUTUBE_API_KEY}&part=snippet`,
      {
        proxy: false,
        httpsAgent: HTTPS_PROXY ? new HttpsProxyAgent(HTTPS_PROXY) : undefined,
      }
    )

    if (
      response &&
      response.data &&
      response.data.items &&
      response.data.items[0]
    ) {
      return response.data.items[0]
    }
  } catch (error) {
    console.error(error)
  }
}

/* {
	"uri": "/videos/103333753",
	"name": "Alphaville - A Crystal Maze",
	"description": "",
	"type": "video",
	"link": "https://vimeo.com/103333753",
	"duration": 248,
	"width": 586,
	"language": null,
	"height": 480,
	"embed": {},
	"created_time": "2014-08-13T13:56:54+00:00",
	"modified_time": "2021-06-13T02:25:57+00:00",
	"release_time": "2014-08-13T13:56:54+00:00",
	"content_rating": [],
	"license": null,
	"privacy": {},
	"pictures": {},
	"tags": [],
	"stats": {},
	"categories": [],
	"uploader": {},
	"metadata": {},
	"user": {
		"uri": "/users/31141540",
		"name": "Henrike Lindenberger",
		"link": "https://vimeo.com/user31141540",
		"capabilities": {
			"hasLiveSubscription": false,
			"hasEnterpriseLihp": false,
			"hasSvvTimecodedComments": false
		},
		"location": "Toronto, ON, Canada",
		"gender": "m",
		"bio": "",
		"short_bio": "Editor at Minnow.",
		"created_time": "2014-08-13T13:48:21+00:00",
		"pictures": {},
		"websites": [],
		"metadata": {},
		"location_details": {},
		"skills": [],
		"available_for_hire": false,
		"can_work_remotely": false,
		"resource_key": "89e45eed1a757c49ee2fa59f0383d9dad2aa8a96",
		"account": "basic"
	},
	"app": null,
	"status": "available",
	"resource_key": "eb7a978f0a66ffed732c40ce3d815777747a9a95",
	"upload": null,
	"transcode": null,
	"is_playable": true
} */
async function getVimeoVideo(id) {
  const VIMEO_TOKEN = process.env.VIMEO_TOKEN
  const HTTPS_PROXY = process.env.HTTPS_PROXY

  try {
    const response = await axios.get(`https://api.vimeo.com/videos/${id}`, {
      headers: { Authorization: `Bearer ${VIMEO_TOKEN}` },
      proxy: false,
      httpsAgent: HTTPS_PROXY ? new HttpsProxyAgent(HTTPS_PROXY) : undefined,
    })
    if (response && response.data) {
      return response.data
    }
  } catch (error) {
    if (error && error.response && error.response.data) {
      console.error(
        `Error with Vimeo ${id}`,
        error.response.data.error || error.response.data
      )
    } else {
      console.error(`Error with Vimeo ${id}`)
    }
  }
}

module.exports = {
  listBilibiliVideos,
  getYoutubeVideo,
  getVimeoVideo,
}
