import Vue from 'vue'
import App from './App.vue'
import router from '@/router';

import client from 'socket.io-client';

Vue.config.productionTip = false

// 连接，轮询
var socket = client.connect('http://localhost:3000/', {transports:[/*'websocket',*/ 'xhr-polling', 'jsonp-polling']});


new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
