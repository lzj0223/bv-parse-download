<template>
    <el-table :data="tableData" max-height="800" style="width: 100%">
        <el-table-column property="page" label="序号" width="100" show-overflow-tooltip />
        <el-table-column label="封面" width="150">
            <template #default="scope">
                <el-image style="width: 50px; height: 50px" :src="scope.row.pic" :zoom-rate="1.2" :max-scale="7"
                    :min-scale="0.2" fit="cover" lazy>
                    <template #error>
                        <div class="image-slot">
                            <el-icon><icon-picture /></el-icon>
                        </div>
                    </template>
                </el-image>
            </template>
        </el-table-column>
        <el-table-column property="title" label="标题" width="200" show-overflow-tooltip />
        <el-table-column property="fileName" label="文件名" width="200" show-overflow-tooltip />
        <el-table-column label="下载进度">
            <template #default="scope">
                <el-progress :text-inside="true" :stroke-width="24" :percentage="scope.row.progress" status="success" />
            </template>
        </el-table-column>
    </el-table>
    <div style="margin-top: 20px">
        <el-button @click="handleCancelDownload">全部取消</el-button>
    </div>
</template>
  
<script lang="ts" setup>
import { ElTable } from 'element-plus'
import { ref } from 'vue';
import { Picture as IconPicture } from '@element-plus/icons-vue'
import { getFileExtension, parseDirectLink } from '../../utils/bilibili'
const emit = defineEmits(['cancelDownload'])

const ipcRenderer = window.ipcRenderer

//const bdRender = window.bdRender

//const emit = defineEmits(['startDownload'])

const props = defineProps<{
    multiSelectList?: BilibliVideoItem[],
}>()


let index = 0;
const tableData = ref<BilibliVideoItem[]>([])

props.multiSelectList!.forEach(element => {
    element.progress = 0;
    tableData.value.push(element)
})

ipcRenderer.on('bilibili-download-complete', (event, file, url) => {
    console.log('文件下载完成：', file, url); // 完整的文件路径
    tableData.value.forEach((element) => {
        if (url === element.downloadUrl) {
            element.state = 2
            element.progress = 100
        }
    })
})


ipcRenderer.on('bilibili-download-progress', (event, progress, url) => {
    console.log('文件下载进度：', progress, url); // 完整的文件路径
    tableData.value.forEach((element) => {
        if (url === element.downloadUrl) {
            element.progress = progress
        }
    })
})



const inter = setInterval(async () => {
    const element = tableData.value[index]
    if (element.state === 0 || element.state === undefined) {
        element.state = 1

        element.downloadUrl = await parseDirectLink(element.bvid, element.aid, element.cid)

        element.fileName = element.fileName + '.' + getFileExtension(element.downloadUrl)

        ipcRenderer.send('bilibili-download', {
            url: element.downloadUrl,
            properties: { directory: '/Users/linzhijun/Downloads', filename: element.fileName }
        })
        return
    }
    if (element.progress && element.progress >= 100) {
        index++
    }

    if (index >= tableData.value.length) {
        clearInterval(inter)
    }
}, 1)

const handleCancelDownload = () => {
    clearInterval(inter)
    emit('cancelDownload')
}


</script>