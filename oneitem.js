#!/usr/bin/env node

const commander = require('commander')
const { Client } = require('@notionhq/client')
const { getYoutubeVideo, getVimeoVideo } = require('./apis')

const program = new commander.Command()

const NOTION_TOKEN = process.env.NOTION_TOKEN
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID

const notion = new Client({ auth: NOTION_TOKEN })

program
  .version('1.0.0')
  .description('Get video data for one Notion database item')
  .requiredOption('-b, --bvid <string>', 'database item bvid')
  .option('-o, --overwrite', 'Overview the data already exist')

program.parse()

const options = program.opts()
const bvid = options.bvid || ''
const overwrite = !!options.overwrite

main(bvid, overwrite)

async function main(bvid, overwrite) {
  console.log(`Start fetch data for bvid ${bvid}`)

  try {
    const { results } = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: { property: 'bvid', title: { equals: bvid } },
    })
    if (results && results.length > 0) {
      const result = results[0]
      const sourceType = result.properties.source_type.select.name
      if (sourceType === 'youtube') {
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
                    {
                      text: {
                        content: (description || '').substring(0, 2000),
                      },
                    },
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
      } else if (sourceType === 'vimeo') {
        const id = result.properties.v_id.rich_text[0].text.content || ''
        if (overwrite || !result.properties.v_resource_key.rich_text[0]) {
          if (overwrite) {
            // overwrite then update
            console.log(`Overwrite Vimeo info ${id}, update page ${result.id}`)
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
              user: { name: userName, link, location, gender, bio, short_bio },
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
          console.log(`Skipped Vimeo info ${id}, already in page ${result.id}`)
        }
      }
    }

    if (has_more && next_cursor) {
      console.log(`Next cursor: ${next_cursor}`)
    }
  } catch (error) {}
}
