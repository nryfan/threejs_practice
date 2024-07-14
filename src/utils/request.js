import axios from 'axios' // 引入axios

const t = import.meta.env.DEV

let baseURL = "http://"+import.meta.env.VITE_BASE_PATH
if(t ){
  baseURL = '/'
}



const service = axios.create({
  baseURL,
  timeout: 99999
})

// 添加请求拦截器
service.interceptors.request.use(
  function (config) {
    // 在发送请求之前做些什么
    config.headers['Authorization']='Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIzNzg0MDdkM2Y4NGE0YzdhOWFkNzc2OGYzNWU2Njg2ZCIsImlhdCI6MTcwMjM5MjE5OSwiZXhwIjoyMDE3NzUyMTk5fQ.m3r_Dk99Wc_93Qq1nGovWKneI9CWL1mJfVod1z5W0Ho'
    return config;
  },
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 添加响应拦截器
service.interceptors.response.use(
  function (response) {
    const dataAxios = response.data;
    return dataAxios;
  },
  function (error) {
    console.log(123123,error);
    return Promise.reject(error);
  }
);

export default service
