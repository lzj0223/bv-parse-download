declare interface BilibliVideoList {
    aid: string
    title: string
    bvid: string
    desc: string
    list: BilibliVideoItem[]
}

declare interface BilibliVideoItem {
    page: number
    aid: string
    bvid: string
    cid: string
    pic: string
    title: string
    fileName?: string
    downloadUrl?: string
    state?: number
    progress?: number
}
