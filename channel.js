#!/usr/bin/env node

const commander = require('commander')
const { Client } = require('@notionhq/client')
const { myParseInt, getSourceVideoInfoFromDescription } = require('./utils')

const program = new commander.Command()

const NOTION_TOKEN = process.env.NOTION_TOKEN
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID

const notion = new Client({ auth: NOTION_TOKEN })

program
  .version('1.0.0')
  .description("Get check channels' count in Notion database")

const channels = {} // name: countNum

console.log(`Start fetch data`)
checkInDatabase()

async function checkInDatabase(cursor) {
  try {
    const { results, has_more, next_cursor } = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: {
        or: [
          { property: 'source_type', select: { equals: 'youtube' } },
          { property: 'source_type', select: { equals: 'vimeo' } },
        ],
      },
      sorts: [{ property: 'b_created', direction: 'descending' }],
      start_cursor: cursor || undefined,
      page_size: 100,
    })

    if (results && results.length > 0) {
      results.forEach(async (result) => {
        const souceType = result.properties.source_type.select.name
        const youtubeChannelTitle = result.properties.y_channel_title
          .rich_text[0]
          ? result.properties.y_channel_title.rich_text[0].text.content
          : ''
        const vimeoUserName = result.properties.v_user_name.rich_text[0]
          ? result.properties.v_user_name.rich_text[0].text.content
          : ''

        switch (souceType) {
          case 'youtube':
            if (youtubeChannelTitle) {
              const youtubeKey = `${youtubeChannelTitle}__youtube`
              if (channels[youtubeKey]) {
                channels[youtubeKey] = channels[youtubeKey] + 1
              } else {
                channels[youtubeKey] = 1
              }
            }
            break
          case 'vimeo':
            if (vimeoUserName) {
              const vimeoKey = `${vimeoUserName}__vimeo`
              if (channels[vimeoKey]) {
                channels[vimeoKey] = channels[vimeoKey] + 1
              } else {
                channels[vimeoKey] = 1
              }
            }
            break
          default:
            break
        }
      })
    }

    if (has_more && next_cursor) {
      console.log(`Fetching data from cursor: ${next_cursor}`)
      checkInDatabase(next_cursor)
    } else {
      console.log(channels)
    }
  } catch (error) {}
}
