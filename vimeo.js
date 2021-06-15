#!/usr/bin/env node

const commander = require('commander')
const { Client } = require('@notionhq/client')
const { myParseInt } = require('./utils')
const { getVimeoVideo } = require('./apis')

const program = new commander.Command()

const NOTION_TOKEN = process.env.NOTION_TOKEN
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID

const notion = new Client({ auth: NOTION_TOKEN })

program
  .version('1.0.0')
  .description('Get data from Notion database and add Vimeo info')
  .option(
    '-c, --start-cursor <string>',
    'A cursor returned from a previous response, used to request the next page of results.'
  )
  .option('-s, --size <number>', 'Page size, maximum is 100', myParseInt, 100)
  .option('-o, --overwrite', 'Overview the data already exist')

program.parse()

const options = program.opts()
const cursor = options.startCursor || ''
const size = options.size >= 0 && options.size <= 100 ? options.size : 100
const overwrite = !!options.overwrite

main(cursor, size, overwrite)

async function main(cursor, size, overwrite) {
  console.log(`Start fetch data from cursor ${cursor} size ${size}`)

  try {
    const { results, has_more, next_cursor } = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: { property: 'source_type', select: { equals: 'vimeo' } },
      sorts: [{ property: 'b_created', direction: 'ascending' }],
      start_cursor: cursor || undefined,
      page_size: size,
    })

    if (results && results.length > 0) {
      results.forEach(async (result) => {
        const id = result.properties.v_id.rich_text[0].text.content || ''
        const locked = result.properties.locked.checkbox || false

        if (locked) {
          console.log(`Vimeo ${id} is locked in page ${result.id}`)
        } else {
          if (overwrite || !result.properties.v_resource_key.rich_text[0]) {
            if (overwrite) {
              // overwrite then update
              console.log(
                `Overwrite Vimeo info ${id}, update page ${result.id}`
              )
            } else {
              console.log(`Add Vimeo info ${id}, update page ${result.id}`)
            }
            console.log(`Get Vimeo video ${id}`)
            const video = await getVimeoVideo(id)
            if (video) {
              const {
                name,
                description,
                duration,
                release_time,
                resource_key,
                user: {
                  name: userName,
                  link,
                  location,
                  gender,
                  bio,
                  short_bio,
                },
              } = video
              await notion.pages.update({
                page_id: result.id,
                properties: {
                  v_resource_key: {
                    rich_text: [{ text: { content: resource_key } }],
                  },
                  v_release_time: { date: { start: release_time } },
                  v_name: { rich_text: [{ text: { content: name } }] },
                  v_duration: { number: duration },
                  v_description: {
                    rich_text: [
                      {
                        text: {
                          content: (description || '').substring(0, 2000),
                        },
                      },
                    ],
                  },
                  v_user_link: { url: link },
                  v_user_name: { rich_text: [{ text: { content: userName } }] },
                  v_user_bio: {
                    rich_text: [
                      { text: { content: (bio || '').substring(0, 2000) } },
                    ],
                  },
                  v_user_short_bio: {
                    rich_text: [{ text: { content: short_bio || '' } }],
                  },
                  v_user_location: {
                    rich_text: [{ text: { content: location } }],
                  },
                  v_user_gender: { rich_text: [{ text: { content: gender } }] },
                },
              })
            }
          } else {
            console.log(
              `Skipped Vimeo info ${id}, already in page ${result.id}`
            )
          }
        }
      })
    }

    if (has_more && next_cursor) {
      console.log(`Next cursor: ${next_cursor}`)
    }
  } catch (error) {}
}
