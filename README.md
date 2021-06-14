# movie-portal-data-fetcher

用于获取电影传送门的视频信息、原视频的信息并存入 Notion 中的命令行工具。

## 使用

**环境变量**

```bash
export NOTION_TOKEN=xxxxxxxxxx
export NOTION_DATABASE_ID=xxxxxxxxx
export YOUTUBE_API_KEY=xxxxxxxxxx
```

```bash
$ node bilibili.js -s 10 -p 1

$ node youtube.js -s 50 -c xxxxxx
```

## Roadmap

- [x] 获取 B 站上的视频列表
- [x] 根据 B 站视频的来源信息，获取相应的 YouTube 视频信息
- [ ] 根据 B 站视频的来源信息，获取相应的 Vimeo 视频信息
- [x] 把视频信息存入 Notion 数据库

## 参考资料

- [Commander.js](https://github.com/tj/commander.js)
- [Notion API](https://developers.notion.com/)
