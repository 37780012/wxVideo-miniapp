const api = require('utils/api.js');
//app.js
App({

  videoUrl: 'https://aweme.snssdk.com/aweme/v1/playwm/?video_id=b97ddc21e4cd435ea41473ea47b2d38f&line=0',
  globalData: {
    userInfo: null
  },

  onLaunch: function (options) {
    console.log('app onLaunch scene > ' + options.scene)

    var that = this;
    // 登录
    api.login(function () {

      // 获取用户信息
      wx.getSetting({
        success: res => {
          if (res.authSetting['scope.userInfo']) {
            // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
            wx.getUserInfo({
              lang: "zh_CN",
              success: res => {
                // 可以将 res 发送给后台解码出 unionId
                that.globalData.userInfo = res.userInfo

                // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
                // 所以此处加入 callback 以防止这种情况
                if (that.userInfoReadyCallback) {
                  that.userInfoReadyCallback(res)
                }

                api.updateUserInfo(res.userInfo)
              }
            })
          }
        }
      })
    });
  }

})