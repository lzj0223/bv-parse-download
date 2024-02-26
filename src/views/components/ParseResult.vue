<template>
    <div>
        <el-table :data="tableData" max-height="800" style="width: 100%" ref="multipleTableRef"
            @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column property="page" label="序号" width="60" show-overflow-tooltip />
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
            <el-table-column property="title" label="标题" width="400" show-overflow-tooltip />
            <el-table-column label="保存文件名">
                <template #default="scope">
                    <el-input v-model="scope.row.fileName" placeholder="请输入要保存的文件名" clearable></el-input>
                </template>
            </el-table-column>
        </el-table>
    </div>
    <div style="margin-top: 20px">
        <el-button @click="onDownload">下载</el-button>
        <el-button @click="handleOpenCookieDialog">设置cookie</el-button>
        <el-button @click="handleOpenDirectory">设置保存目录</el-button>
    </div>


    <div>
        <el-dialog v-model="dialogFormVisible" title="填写cookie" width="600">
            <div>
                <el-input v-model="bilibiliCookie" :rows="5" type="textarea" placeholder="Please input" />
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="dialogFormVisible = false">Cancel</el-button>
                    <el-button type="primary" @click="saveBiliCookie">
                        保存
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>
  
<script lang="ts" setup>
import { ElTable } from 'element-plus'
import { parseDownloadList } from '../../utils/bilibili'
import { ref, watch } from 'vue';
import { Picture as IconPicture } from '@element-plus/icons-vue'
const emit = defineEmits(['startDownload'])

const props = defineProps<{
    url?: string
}>()

const bilibiliCookie = ref('')
const dialogFormVisible = ref(false)
const multipleTableRef = ref<InstanceType<typeof ElTable>>()
const multipleSelection = ref<BilibliVideoItem[]>([])
const onDownload = () => {
    dialogFormVisible.value = false
    const rows = multipleTableRef.value!.getSelectionRows()
    if (rows!.length <= 0) {
        return;
    }
    emit('startDownload', rows)
}
const handleSelectionChange = (val: BilibliVideoItem[]) => {
    multipleSelection.value = val
}
const handleOpenDirectory = async () => {
    await window.electronAPI.openDir()
}
const handleOpenCookieDialog = async () => {
    bilibiliCookie.value = await window.electronAPI.store.get('bilibili-cookie')
    dialogFormVisible.value = true
}
const saveBiliCookie = async () => {
    await window.electronAPI.store.set('bilibili-cookie', bilibiliCookie.value)
    onDownload()
}

const tableData = ref<BilibliVideoItem[]>([])

watch(() => props.url, (url, oldUrl) => {
    if (url && oldUrl != url) {
        parseDownloadList(url).then((resp) => {
            tableData.value = resp.list
        })
    } else {
        tableData.value = []
    }
})


</script>