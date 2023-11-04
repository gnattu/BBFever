interface FeverItem {
  id: number
  feed_id: number
  title: string
  author: string
  html: string
  url: string
  is_saved: number // boolean number
  is_read: number // boolean number
  created_on_time: number
}

interface FeverGroup {
  id: number
  title: string
}

interface FeverFeedGroup {
  group_id: number
  feed_ids: string
}

interface FeverResponse {
  api_version: number
  auth: number // boolean number
  last_refreshed_on_time: number
}

interface FeverUnreadIdResponse extends FeverResponse {
  unread_item_ids: string
}

interface FeverItemResponse extends FeverResponse {
  total_items: number
  items: FeverItem[]
}

interface FeverGroupResponse extends FeverResponse {
  groups: FeverGroup[]
  feeds_groups: FeverFeedGroup[]
}

interface DownloadTask {
  Aid: string
  Url: string
  TaskCreateTime: number
  Title: string
  Pic: string
  VideoPubTime: number
  TaskFinishTime: number
  Progress: number
  DownloadSpeed: number
  TotalDownloadedBytes: number
  IsSuccessful: boolean
}

interface DownloadTaskCollection {
  Running: Array<DownloadTask>
  Finished: Array<DownloadTask>
}

interface BBDownMyOption {
  Url: string
  UseTvApi?: boolean | null
  UseAppApi?: boolean | null
  UseIntlApi?: boolean | null
  UseMP4box?: boolean | null
  EncodingPriority?: string | null
  DfnPriority?: string | null
  OnlyShowInfo?: boolean | null
  ShowAll?: boolean | null
  UseAria2c?: boolean | null
  Interactive?: boolean | null
  HideStreams?: boolean | null
  MultiThread?: boolean | null
  SimplyMux?: boolean | null
  VideoOnly?: boolean | null
  AudioOnly?: boolean | null
  DanmakuOnly?: boolean | null
  CoverOnly?: boolean | null
  SubOnly?: boolean | null
  Debug?: boolean | null
  SkipMux?: boolean | null
  SkipSubtitle?: boolean | null
  SkipCover?: boolean | null
  ForceHttp?: boolean | null
  DownloadDanmaku?: boolean | null
  SkipAi?: boolean | null
  VideoAscending?: boolean | null
  AudioAscending?: boolean | null
  AllowPcdn?: boolean | null
  ForceReplaceHost?: boolean | null
  FilePattern?: string | null
  MultiFilePattern?: string | null
  SelectPage?: string | null
  Language?: string | null
  UserAgent?: string | null
  Cookie?: string | null
  AccessToken?: string | null
  Aria2cArgs?: string | null
  WorkDir?: string | null
  FFmpegPath?: string | null
  Mp4boxPath?: string | null
  Aria2cPath?: string | null
  UposHost?: string | null
  DelayPerPage?: string | null
  Host?: string | null
  EpHost?: string | null
  Area?: string | null
  ConfigFile?: string | null
  Aria2cProxy?: string | null
  OnlyHevc?: boolean | null
  OnlyAvc?: boolean | null
  OnlyAv1?: boolean | null
  AddDfnSubfix?: boolean | null
  NoPaddingPageNum?: boolean | null
  BandwithAscending?: boolean | null
}

interface DownloadTaskRequest {
  feverId: number
  taskOption: BBDownMyOption
}

export type {
  FeverItem,
  FeverItemResponse,
  FeverUnreadIdResponse,
  FeverGroupResponse,
  FeverResponse,
  DownloadTask,
  DownloadTaskCollection,
  DownloadTaskRequest,
  BBDownMyOption,
}
