#!/usr/bin/env node

const commander = require('commander')
const { Client } = require('@notionhq/client')
const { myParseInt } = require('./utils')
const { getYoutubeVideo } = require('./apis')

const program = new commander.Command()

const NOTION_TOKEN = process.env.NOTION_TOKEN
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

const notion = new Client({ auth: NOTION_TOKEN })

program
  .version('1.0.0')
  .description('Get data from Notion database and add YouTube info')
  .option(
    '-c, --start-cursor <string>',
    'A cursor returned from a previous response, used to request the next page of results.'
  )
  .option('-s, --size <number>', 'Page size, maximum is 100', myParseInt, 100)
  .option('-o, --overwrite', 'Overview the data already exist')

program.parse()

const options = program.opts()
console.log('🚀 ~ options', options)
const cursor = options.startCursor || ''
const size = options.size >= 0 && options.size <= 100 ? options.size : 100
const overwrite = !!options.overwrite

main(cursor, size, overwrite)

async function main(cursor, size, overwrite) {
  console.log(`Start fetch data from cursor ${cursor} size ${size}`)

  try {
    const { results, has_more, next_cursor } = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: { property: 'source_type', select: { equals: 'youtube' } },
      sorts: [{ property: 'b_created', direction: 'ascending' }],
      start_cursor: cursor || undefined,
      page_size: size,
    })

    if (results && results.length > 0) {
      results.forEach(async (result) => {
        const id = result.properties.y_id.rich_text[0].text.content || ''

        if (overwrite || !result.properties.y_etag.rich_text[0]) {
          if (overwrite) {
            // overwrite then update
            console.log(
              `Overwrite YouTube info ${id}, update page ${result.id}`
            )
          } else {
            console.log(`Add YouTube info ${id}, update page ${result.id}`)
          }
          console.log(`Get YouTube video ${id}`)
          const video = await getYoutubeVideo(id)
          if (video) {
            const {
              etag,
              snippet: {
                publishedAt,
                channelId,
                channelTitle,
                title,
                description,
              },
            } = video
            await notion.pages.update({
              page_id: result.id,
              properties: {
                y_etag: { rich_text: [{ text: { content: etag } }] },
                y_published_at: { date: { start: publishedAt } },
                y_channel_id: {
                  rich_text: [{ text: { content: channelId } }],
                },
                y_channel_title: {
                  rich_text: [{ text: { content: channelTitle } }],
                },
                y_title: { rich_text: [{ text: { content: title } }] },
                y_description: {
                  rich_text: [
                    { text: { content: description.substring(0, 2000) } },
                  ],
                },
              },
            })
          }
        } else {
          console.log(
            `Skipped YouTube info ${id}, already in page ${result.id}`
          )
        }
      })
    }

    if (has_more && next_cursor) {
      console.log(`Next cursor: ${next_cursor}`)
    }
  } catch (error) {}
}
