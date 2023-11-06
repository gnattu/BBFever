import { program } from 'commander'

import {
  BBDownMyOption,
  DownloadTask,
  DownloadTaskRequest,
  FeverItemResponse,
  FeverUnreadIdResponse,
  FeverGroupResponse,
  FeverResponse,
} from './datatype'

import { logTable } from './util'

program
  .name('bbfever')
  .addHelpCommand(false)
  .requiredOption('-u, --user <user>', 'Fever API用户名')
  .requiredOption('-p, --password <password>', 'Fever API密码')
  .requiredOption('-f, --fever-api-url <fever-api-url>', 'Fever API的基本URL')
  .option('-b, --bbdown-api-url <bbdown-api-url>', 'BBDown API的基本URL')
  .option(
    '-g, --feed-groups <feed-groups>',
    '指定要下载的订阅源组，使用逗号隔开多个组ID。默认下载所有组中的未读项目',
  )
  .option('-o, --bbdown-option <bbdown-option>', 'BBDown下载选项，JSON字符串格式')
  .option(
    '-r, --refreshing-interval <seconds>',
    '以特定间隔（以秒为单位）轮询订阅源的更新。BBFever将以此模式持续运行，以检查更新',
  )
  .helpOption('-h, --help', '显示帮助信息')
  // Empty hanlder to force default behavior to no-subcommand
  .action(async () => {})
  .command('show-groups')
  .description('显示所有RSS订阅源组')
  .action(async () => {
    const options = program.opts()
    const authData = new URLSearchParams()
    authData.append(
      'api_key',
      new Bun.CryptoHasher('md5').update(`${options.user}:${options.password}`).digest('hex'),
    )
    try {
      const unreadRes = await fetch(`${options.feverApiUrl}&groups`, {
        method: 'POST',
        body: authData,
      })
      if (!unreadRes.ok) {
        throw new Error('Network response was not ok')
      }
      const resJson: FeverGroupResponse = await unreadRes.json()
      if (resJson.groups === null || resJson.groups === undefined) {
        throw new Error('Fever API没有返回组信息')
      }
      logTable(resJson.groups)
      process.exit(0)
    } catch (e) {
      console.error(e)
      process.exit(1)
    }
  })
await program.parseAsync(Bun.argv)
const { user, password, feverApiUrl, bbdownApiUrl, feedGroups, bbdownOption, refreshingInterval } =
  program.opts()

if (!bbdownApiUrl) {
  console.error('BBDown API URL不能为空')
  process.exit(1)
}

const API_KEY: string = new Bun.CryptoHasher('md5').update(`${user}:${password}`).digest('hex')
const API_BASE: string = feverApiUrl
const BBDOWN_API_URL: string = bbdownApiUrl
const DOWNLOAD_ALL_UNREAD_FEEDS = !feedGroups
const DOWNLOAD_FEED_GROUPS: number[] = DOWNLOAD_ALL_UNREAD_FEEDS
  ? []
  : feedGroups.split(',').map((x: string) => Number(x))
const AUTH_DATA = new URLSearchParams()
AUTH_DATA.append('api_key', API_KEY)

const DOWNLOAD_OPTION = bbdownOption ? JSON.parse(bbdownOption) : {}
const REFRESHING_INTERVAL: number = refreshingInterval ? Number(refreshingInterval) : 0

// Caller should handle the case where auth === 0 and api_version < 0
// In such cases, the response may not contain all properties of the response type.
const fetchFeverApi = async <T>(endpoint: string): Promise<T> => {
  try {
    const unreadRes = await fetch(`${API_BASE}&${endpoint}`, {
      method: 'POST',
      body: AUTH_DATA,
    })
    if (!unreadRes.ok) {
      throw new Error('Network response was not ok')
    }
    const resJson: T = await unreadRes.json()
    return resJson
  } catch (e) {
    console.error(e)
    return {
      api_version: -1,
      auth: 0, // boolean number
      last_refreshed_on_time: -1,
    } as T
  }
}

const getRunningDownloadTasks = async (): Promise<DownloadTask[]> => {
  const res = await fetch(`${BBDOWN_API_URL}/get-tasks/running`)
  if (!res.ok) {
    throw new Error('Network response was not ok')
  }
  return res.json()
}

const postDownloadTask = async (task: BBDownMyOption): Promise<boolean> => {
  try {
    await fetch(`${BBDOWN_API_URL}/add-task`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(task),
    })
    return true
  } catch (e) {
    console.error(`ERROR: Task with url ${task.Url} failed to add.`)
    console.error(e)
    return false
  }
}

const getDownloadFeedIds = async (): Promise<number[]> => {
  const downloadFeedIds: number[] = []
  const feverGroupRes: FeverGroupResponse = await fetchFeverApi('groups')
  if (feverGroupRes.auth === 0) return downloadFeedIds
  feverGroupRes.feeds_groups
    .filter((fg) => DOWNLOAD_ALL_UNREAD_FEEDS || DOWNLOAD_FEED_GROUPS.includes(fg.group_id))
    .forEach((fg) => {
      fg.feed_ids.split(',').forEach((id) => {
        downloadFeedIds.push(Number(id))
      })
    })
  return downloadFeedIds
}

const fetchAndGenerateDownloadTasks = async (): Promise<DownloadTaskRequest[]> => {
  const downloadTaskRequests: DownloadTaskRequest[] = []
  const downloadFeedIds = await getDownloadFeedIds()
  const unreadItemsRes: FeverUnreadIdResponse = await fetchFeverApi('unread_item_ids')
  if (unreadItemsRes.auth === 0) return downloadTaskRequests
  const unreadItems = unreadItemsRes.unread_item_ids
  const itemIdArray = unreadItems.split(',')
  // Because fever api only allows up to 50 items per query
  const itemIdGroups = groupItems(itemIdArray)
  for (const group of itemIdGroups) {
    const itemDetailRes: FeverItemResponse = await fetchFeverApi(
      `&items&with_ids=${group.join(',')}`,
    )
    if (itemDetailRes.auth === 0) continue
    itemDetailRes.items
      .filter((x) => downloadFeedIds.includes(x.feed_id))
      .forEach((x) => {
        downloadTaskRequests.push({
          feverId: x.id,
          taskOption: { Url: x.url, ...DOWNLOAD_OPTION },
        })
      })
  }
  return downloadTaskRequests
}

const markFeverItemRead = async (id: number) => {
  const res: FeverResponse = await fetchFeverApi(`mark=item&as=read&id=${id}`)
  if (res.auth === 0) {
    console.warn(`Fever item with ${id} does not mark as read successfully`)
  }
}

const submitDownloadTasks = async (tasks: DownloadTaskRequest[]) => {
  for (const task of tasks) {
    await waitForDownloadCapacity(5)
    // eslint-disable-next-line no-console
    console.log(`提交下载任务 ${task.taskOption.Url}`)
    const posted = await postDownloadTask(task.taskOption)
    if (posted) {
      await markFeverItemRead(task.feverId)
    }
  }
}

const groupItems = (array: string[]): string[][] => {
  const groups: string[][] = []
  for (let i = 0; i < array.length; i += 50) {
    groups.push(array.slice(i, i + 50))
  }
  return groups
}

const waitForDownloadCapacity = async (capacityLimit: number) => {
  let hasCapacity = false
  while (!hasCapacity) {
    let runningTasks: DownloadTask[]
    try {
      runningTasks = await getRunningDownloadTasks()
      hasCapacity = runningTasks.length <= capacityLimit
    } catch (_) {
      hasCapacity = false
    }
    await Bun.sleep(1000)
  }
  return
}

if (REFRESHING_INTERVAL > 0) {
  for (;;) {
    const tasks = await fetchAndGenerateDownloadTasks()
    await submitDownloadTasks(tasks)
    await Bun.sleep(REFRESHING_INTERVAL * 1000)
  }
} else {
  const tasks = await fetchAndGenerateDownloadTasks()
  await submitDownloadTasks(tasks)
}
