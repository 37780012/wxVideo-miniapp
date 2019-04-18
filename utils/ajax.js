var serverPath = 'https://100boot.cn/douyin/';
// serverPath = 'http://localhost:9001/douyin/'
const key = '0f0e9efe83574aa4be01dd1782d1509e';
// common.js
function request(opt) {
  // set token
  var token = wx.getStorageSync("token");
  wx.showNavigationBarLoading();
  wx.request({
    method: opt.method || 'GET',
    header: {
      token: token || '',
      key: key
    },
    url: serverPath + opt.url,
    data: opt.data,
    success: function (res) {
      if (res.statusCode == 200) {
        if (res.data.code == 100) {
          if (opt.success) {
            opt.success(res.data.result, res.data);
          }
        } else if (res.data.code == 5004) {
          console.log("remove invalid token")
          wx.removeStorageSync("token")
          login();
        } else {
          console.warn(res.data);
          wx.showModal({
            content: res.data.message,
            showCancel: false
          })
        }
      } else {
        console.error(res);
        wx.showModal({
          title: '微信异常',
          content: res.statusCode,
          showCancel: false
        })
      }
    },
    fail: function () {
      wx.showModal({
        content: '远程连接失败',
        showCancel: false
      })
    },
    complete: function () {
      wx.hideNavigationBarLoading();
      wx.hideLoading()
    }
  })
}

function login() {
  wx.reLaunch({
    url: '/pages/douyin/subject',
  })
}

module.exports = {
  serverPath: serverPath,
  request: request,
  key: key
}