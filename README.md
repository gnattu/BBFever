# BBFever

一个简单的[BBDown](https://github.com/nilaoda/BBDown)扩展工具，可以从支持[Fever API](https://github.com/DigitalDJ/tinytinyrss-fever-plugin/blob/master/fever-api.md)的RSS订阅聚合器中获取未读的RSS订阅并发送到BBDown进行下载。

Bilibili的RSS订阅使用[RSSHub](https://docs.rsshub.app)收集

支持Fever API的订阅聚合器可以选择[Tiny Tiny RSS](https://tt-rss.org)或者[Fresh RSS](https://freshrss.org/index.html)

使用此工具前您需要先准备好已经部署的RSSHub和您喜欢的订阅聚合器并设定好了Bilibili的订阅并开启Fever API。由于目标网站的反爬虫设定，强烈建议自建RSSHub部署并且自定义cookie和user-agent来回避验证码

BBDown需要支持[JSON API](https://github.com/nilaoda/BBDown/pull/750)的版本。截止到这篇文档书写的时候（2023-11-04），没有正式版本提供了JSON API，因此您需要使用[Actions](https://github.com/nilaoda/BBDown/actions)中的自动构建版本。

## 命令行参数

```
Usage: bbfever [options]

Options:
  -u, --user <user>                      Fever API用户名
  -p, --password <password>              Fever API密码
  -f, --fever-api-url <fever-api-url>    Fever API的基本URL
  -b, --bbdown-api-url <bbdown-api-url>  BBDown API的基本URL
  -g, --feed-groups <feed-groups>        指定要下载的订阅源组，使用逗号隔开多个组ID。默认下载所有组中的未读项目
  -o, --bbdown-option <bbdown-option>    BBDown下载选项，JSON字符串格式
  -r, --refreshing-interval <seconds>    以特定间隔（以秒为单位）轮询订阅源的更新。BBFever将以此模式持续运行，以检查更新
  -h, --help                             显示帮助信息

Commands:
  show-groups                            显示所有RSS订阅源组
```
### 注意事项：

- Fever API的基本URL是包含了最后到`?api`的部分的，比如Tiny Tiny RSS的Fever基本URL就会像是这样:`http://ttrss.example.net/plugins/fever/?api`, 而Fresh RSS的Fever基本URL则会像这样: `http://freshrss.example.net/api/fever.php?api`
- BBDown的JSON格式下载选项和BBDown的命令行参数使用上差异不大，可以参阅[datatype.ts](./datatype.ts)或者[BBDown的MyOption.cs](https://github.com/nilaoda/BBDown/blob/master/BBDown/MyOption.cs)看到所有可用的选项。
- 订阅源组是在您的订阅聚合器中设置的，可以指定多个组：`--feed-groups 1,2,3`,也可以只指定一个组：`--feed-groups 1`。订阅源组的数字ID可以通过`show-groups`命令查询
- 不指定`-r, --refreshing-interval`时BBFever会在拉取一次更新并发送下载任务后退出，方便您使用自己的计划任务工具


To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init`. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
