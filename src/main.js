import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify';
import VueTextareaAutosize from 'vue-textarea-autosize';
import firebase from 'firebase/app';
import 'firebase/firestore';
// import axios from 'axios';
// import cheerio from 'cheerio';

Vue.use(VueTextareaAutosize);

Vue.config.productionTip = false

firebase.initializeApp({
  apiKey: "AIzaSyDpQN5Frt8yb7yl9C-pMRY_Gk_3qB90rwk",
  authDomain: "vue-calendar-1785f.firebaseapp.com",
  projectId: "vue-calendar-1785f",
  storageBucket: "vue-calendar-1785f.appspot.com",
  messagingSenderId: "1012487929714",
  appId: "1:1012487929714:web:4c10fadbdd226b1a8be7eb"
});

export const db = firebase.firestore();
// export axios;
// export cheerio;

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')
