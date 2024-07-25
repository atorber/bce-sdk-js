
const baidubce = require('../index.js')

const config = {
    endpoint: 'https://aihc.bj.baidubce.com',         //传入所在区域域名
    credentials: {
        ak: '',         //您的AccessKey
        sk: ''       //您的SecretAccessKey
    }
};

let client = new baidubce.AihcClient(config);

client.listInstances()
    .then(function (response) {
        console.log(response)
    })
    .catch(function () {
        // 查询失败，添加您自己的代码，处理异常
    });
