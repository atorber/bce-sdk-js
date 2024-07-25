
const baidubce = require('../index.js')

const config = {
    endpoint: 'https://bj.bcebos.com',         //传入Bucket所在区域域名
    credentials: {
       ak: '',         //您的AccessKey
       sk: ''       //您的SecretAccessKey
    }
 };
 
 let client = new baidubce.AihcClient(config);
 
 client.listInstances()
 .then(function(response) {
    console.info(response.body)
     })
 .catch(function() {
     // 查询失败，添加您自己的代码，处理异常
 });
 