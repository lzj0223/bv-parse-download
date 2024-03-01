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



interface BQRLoginWebGenResponseData {
    url: string
    qrcode_key: string
}
interface BQRLoginWebPoolResponseData {
    url: string;
    refresh_token: string;
    timestamp: number;
    code: number;
    message: string;
}
interface BQRLoginErrorData {
    code: number,
    message: string,
}