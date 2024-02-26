<template>
  <div class="common-layout">
    <el-container>
      <el-header class="">
        <el-input v-model="inputUrl" placeholder="请输入视频地址，如：https://www.bilibili.com/video/BV1Dx411X7VJ" class="input-url"
          clearable :disabled="downloading">
          <template #append>
            <el-button :disabled="downloading" type="primary" @click="onParse">解析</el-button>
          </template>
        </el-input>
      </el-header>
      <el-main>
        <div v-if="downloading">
          <Download :multi-select-list="multiSelectList" @cancel-download="onCancelDownload"></Download>
        </div>
        <div v-if="!downloading">
          <ParseResult :url="url" @start-download="onStartDownload"></ParseResult>
        </div>
      </el-main>
    </el-container>
  </div>
</template>



<script lang="ts" setup>
import ParseResult from './components/ParseResult.vue'
import Download from './components/Download.vue'
import { ref } from 'vue'


let downloading = ref(false)
let url = ref('')
let inputUrl = ref('')

const multiSelectList = ref<BilibliVideoItem[]>([])

const onParse = () => {
  url.value = inputUrl.value
}

const onStartDownload = (rows: BilibliVideoItem[]) => {
  downloading.value = rows.length > 0
  multiSelectList.value = rows
}
const onCancelDownload = () => {
  downloading.value = false
  multiSelectList.value = []
  url.value = ''
}



</script>

<style>
.input-url {
  height: 50px;
}

.el-header {
  min-width: 600px;
  max-width: 80%;
  margin: 0 auto;
}
</style>
