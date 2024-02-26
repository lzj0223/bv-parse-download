import axios from "axios"

const parseBv = (url: string): string => {
    const urlObj = new URL(url)

    const pathname = urlObj.pathname;
    let bv: string;
    if (pathname.indexOf("/medialist/play/watchlater/") != -1) { // 在下载视频的时候针对稍后再看页面的链接找BV号
        bv = pathname.replace("/medialist/play/watchlater/", "").replace("/", "");
    } else {
        bv = pathname.replace("/video/", "").replace("/", "");
    }
    return bv
}


const parseDirectLink = async (bv: string, aid: string, cid: string | number): Promise<string> => {
    try {

        const videoUrl = `https://api.bilibili.com/x/player/playurl?bvid=${bv}&cid=${cid}&qn=80&type=&otype=json&platform=html5&high_quality=1`;
        console.log('videoUrl', videoUrl)
        const videoResponse = await axios.get(videoUrl);
        if (videoResponse.data.data && videoResponse.data.data.durl && videoResponse.data.data.durl[0] && videoResponse.data.data.durl[0].url) {
            const result = videoResponse.data.data.durl[0].url;
            //const replacedLink = result.replace(/https:\/\/.*\.bilivideo\.com\//, 'https://cn-gdfs-ct-01-18.bilivideo.com/'); //upos-sz-mirrorcos
            const replacedLink = result.replace(/https:\/\/.*\.bilivideo\.com\//, 'https://upos-sz-mirrorali.bilivideo.com/');
            return replacedLink;
        }
    } catch (error) {
        console.error('Error fetching direct video link:', error);
    }

    return '';
};

const parseDownloadList = async (url: string): Promise<BilibliVideoList> => {
    const bv = parseBv(url)
    const response = await axios.get(`https://api.bilibili.com/x/web-interface/view?bvid=${bv}`);
    const respData = response.data.data
    const list: BilibliVideoList = {
        aid: respData?.aid,
        bvid: respData?.bvid,
        title: respData?.title,
        desc: respData?.desc,
        list: [],
    }


    //这是下载集合
    if (respData.hasOwnProperty("ugc_season") && respData.ugc_season.hasOwnProperty("sections")) {
        let sections = respData.ugc_season.sections;
        let page = 1;
        for (const section of sections) {
            if (!section.hasOwnProperty("episodes")) {
                continue
            }
            for (const episode of section.episodes) {
                const item: BilibliVideoItem = {
                    page: page,
                    pic: episode?.arc?.pic,
                    title: episode.title,
                    aid: episode.aid,
                    bvid: episode.bvid,
                    cid: episode.cid,
                    fileName: episode.title
                }
                list.list.push(item)
                page++;
            }
        }
    } else { //这是多P下载
        for (const element of response.data.data.pages) {
            const item: BilibliVideoItem = {
                pic: element.first_frame,
                title: element.part,
                fileName: element.part,
                aid: respData?.aid,
                bvid: respData?.bvid,
                page: element.page,
                cid: element.cid,
            }
            list.list.push(item)
        }
    }
    return list
}


function getFileExtension(url: string) {

    let obj = new URL(url)

    // 从URL中提取文件名部分
    let filename = obj.pathname.substring(obj.pathname.lastIndexOf('/') + 1);

    // 使用正则表达式匹配文件后缀名
    let extension = filename.match(/\.[0-9a-z]+$/i);

    if (extension) {
        // 返回匹配到的文件后缀名（去除开头的点）
        return extension[0].substring(1);
    } else {
        // 如果没有匹配到文件后缀名，返回空字符串或者其他默认值
        return '';
    }
}

export { parseBv, parseDirectLink, parseDownloadList, getFileExtension }