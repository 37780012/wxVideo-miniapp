const ajax = require('ajax.js');

// 登录
function login(success) {
  wx.login({
    success: function (res) {
      console.log("login by code > " + res.code)
      // 发送 res.code 到后台换取 openId, sessionKey, unionId
      ajax.request({
        method: 'GET',
        url: 'user/login?code=' + res.code,
        success: loginRes => {
          wx.setStorageSync('token', loginRes.token);
          if (success) {
            success(loginRes);
          }
        }
      })
    }
  })
}

// 获取用户信息
function getUserInfo(success) {
  console.log("getUserInfo...")
  ajax.request({
    method: 'GET',
    url: 'user/getUserInfo',
    success: success
  })
}

// 更新用户信息
function updateUserInfo(userInfo, success) {
  console.log("updateUserInfo...")
  ajax.request({
    method: 'POST',
    url: 'user/updateUserInfo',
    data: userInfo,
    success: success
  })
}

// 获取推荐的抖音列表
function getRecommendList(opt) {
  console.log("getRecommendList...")

  ajax.request({
    url: 'subject/recommendList',
    data: opt.data || {
      page: 1,
      rows: 25
    },
    success: opt.success
  })
}

// 获取热门的抖音列表
function getHotList(opt) {
  console.log("getHotList...")

  ajax.request({
    url: 'subject/hotList',
    data: opt.data || {
      page: 1,
      rows: 25
    },
    success: opt.success
  })
}

// 获取指定抖音
function getSubjectInfo(subjectId, success) {
  ajax.request({
    url: 'subject/info/' + subjectId,
    success: success
  })
}

// 发表一个说说
function applySubject(opt) {
  console.log("applySubject...")
  wx.showNavigationBarLoading();
  var token = wx.getStorageSync("token");
  wx.uploadFile({
    url: ajax.serverPath + 'subject/apply?key=' + ajax.key + '&token=' + token,
    filePath: opt.filePath,
    name: 'file',
    formData: opt.formData || {},
    success: function (res) {
      wx.hideNavigationBarLoading();
      if (opt.success) {
        opt.success(res.data);
      }
    }
  })
}

function applyVideoSubject(opt) {
  console.log("applySubject...")
  wx.showNavigationBarLoading();
  var token = wx.getStorageSync("token");
  wx.uploadFile({
    url: ajax.serverPath + 'subject/applyVideo?key=' + ajax.key + '&token=' + token,
    filePath: opt.filePath,
    name: 'file',
    formData: opt.formData || {},
    success: function (res) {
      wx.hideNavigationBarLoading();
      if (opt.success) {
        opt.success(res.data);
      }
    }
  })
}

function like(data, success){
  ajax.request({
    url: 'subject/like',
    data: data,
    success: success
  })
}

function share(data, success) {
  ajax.request({
    url: 'subject/share',
    data: data,
    success: success
  })
}

function loadTalks(opt){
  ajax.request({
    url: 'subject/talks',
    data: opt.data,
    success: opt.success
  })
}

function applyTalk(opt){
  ajax.request({
    method: 'POST',
    url: 'subject/talk',
    data: opt.data,
    success: opt.success
  })
}

module.exports = {
  login: login,
  getUserInfo: getUserInfo,
  updateUserInfo: updateUserInfo,
  applySubject: applySubject,
  applyVideoSubject: applyVideoSubject,
  getRecommendList: getRecommendList,
  getHotList: getHotList,
  getSubjectInfo: getSubjectInfo,
  like: like,
  share: share,
  loadTalks: loadTalks,
  applyTalk: applyTalk
}