#!/usr/bin/env node

const commander = require('commander')
const { Client } = require('@notionhq/client')
const { myParseInt, getSourceVideoInfoFromDescription } = require('./utils')
const { listBilibiliVideos } = require('./apis')

const program = new commander.Command()

const NOTION_TOKEN = process.env.NOTION_TOKEN
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID

const notion = new Client({ auth: NOTION_TOKEN })

program
  .version('1.0.0')
  .description('Get data from Bilibili and save in Notion database')
  .option('-p, --page <number>', 'Page number, start from 1', myParseInt, 1)
  .option('-s, --size <number>', 'Page size, maximum is 100', myParseInt, 100)
  .option('-o, --overwrite', 'Overview the data already exist')

program.parse()

const options = program.opts()
const page = options.page >= 1 ? options.page : 1
const size = options.size >= 0 && options.size <= 100 ? options.size : 100
const overwrite = !!options.overwrite

main(page, size, overwrite)

async function main(page, size, overwrite) {
  console.log(`Start fetch data from page ${page} size ${size}`)

  let sourceTypeSelectYoutube
  let sourceTypeSelectVimeo
  let sourceTypeSelectUnknown

  try {
    // Retrieve database get info like source_type select options
    const database = await notion.databases.retrieve({
      database_id: NOTION_DATABASE_ID,
    })
    if (database && database.properties && database.properties.source_type) {
      ;(database.properties.source_type.select.options || []).forEach(
        (select) => {
          switch (select.name) {
            case 'youtube':
              sourceTypeSelectYoutube = select
              break
            case 'vimeo':
              sourceTypeSelectVimeo = select
              break
            case 'unknown':
              sourceTypeSelectUnknown = select
              break
            default:
              break
          }
        }
      )
    }
  } catch (error) {}

  const videos = await listBilibiliVideos(page, size)
  videos.forEach(async (video) => {
    const {
      bvid,
      aid,
      mid,
      author,
      length,
      created,
      title,
      subtitle,
      description,
      pic,
    } = video
    const createdIso = new Date(created * 1000).toISOString()
    const {
      url,
      id: sourceId,
      type: sourceType,
    } = getSourceVideoInfoFromDescription(description)
    let sourceTypeSelect
    switch (sourceType) {
      case 'youtube':
        sourceTypeSelect = sourceTypeSelectYoutube
        break
      case 'vimeo':
        sourceTypeSelect = sourceTypeSelectVimeo
        break
      default:
        sourceTypeSelect = sourceTypeSelectUnknown
        break
    }

    const properties = {
      bvid: { title: [{ text: { content: bvid } }] },
      b_aid: { rich_text: [{ text: { content: String(aid) } }] },
      b_mid: { rich_text: [{ text: { content: String(mid) } }] },
      b_created: { date: { start: createdIso } },
      b_title: { rich_text: [{ text: { content: title } }] },
      b_subtitle: { rich_text: [{ text: { content: subtitle } }] },
      b_author: { rich_text: [{ text: { content: author } }] },
      b_description: { rich_text: [{ text: { content: description } }] },
      b_length: { rich_text: [{ text: { content: length } }] },
      b_cover: { url: pic },
      source_url: { url: url },
      source_type: { select: sourceTypeSelect },
    }

    if (sourceType === 'youtube') {
      properties.y_id = { rich_text: [{ text: { content: sourceId } }] }
    } else if (sourceType === 'vimeo') {
      properties.v_id = { rich_text: [{ text: { content: sourceId } }] }
    }

    let result
    try {
      const { results } = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        filter: { property: 'bvid', text: { equals: bvid } },
      })
      if (results && results[0]) {
        result = results[0]
      }
    } catch (error) {}

    if (result) {
      // Already exists
      if (overwrite) {
        // overwrite then update
        console.log(`Overwrite ${bvid}, update page ${result.id}`)
        await notion.pages.update({
          page_id: result.id,
          properties,
        })
      } else {
        console.log(`Skipped ${bvid}, already in page ${result.id}`)
      }
    } else {
      console.log(`Create ${bvid}`)
      try {
        await notion.pages.create({
          parent: { database_id: NOTION_DATABASE_ID },
          properties,
        })
      } catch (error) {}
    }
  })
}
