const app = getApp()
const api = require('../../utils/api.js')
const pageRows = 25;

var dataList = [];// 为了方便操作数据

function getRandomColor() {
  let rgb = []
  for (let i = 0; i < 3; ++i) {
    let color = Math.floor(Math.random() * 256).toString(16)
    color = color.length == 1 ? '0' + color : color
    rgb.push(color)
  }
  return '#' + rgb.join('')
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    page: 1,
    hasNextPage: true,
    subject: null,
    current: 0,
    subjectList: [],
    duration: 500,
    userInfo: {},
    hasUserInfo: false,
    inputTalk: '',
    talks: [],
    talksPage: 1,
    talksPages: -1,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    talksAnimationData: {},
    isHiddenVideo: true,
    isHiddenControls: true,
    videoSrc: '' || app.videoUrl,
  },
  resetDataList: function () {
    dataList = [];
    this.setData({
      page: 1,
      hasNextPage: true,
      current: 0,
      subjectList: [],
      talks: [],
      talksPage: 1,
      talksPages: -1,
      isHiddenVideo: true,
      isHiddenControls: true,
      videoSrc: '' || app.videoUrl,
    })
  },
  loadPageData: function (success) {
    var that = this;
    console.log("load subject page " + that.data.page);

    if (this.data.hasNextPage == false) {
      if (success) success()
      return;
    }

    var pageNum = this.data.page;

    // 获取推荐抖音列表
    api.getRecommendList({
      data: {
        page: pageNum,
        rows: pageRows
      },
      success: function (res) {
        var list = res.content;

        for (var i = 0; i < list.length; i++) {
          dataList.push(list[i])
        }

        // 如果当前页有数据就假定还有下一页数据
        var hasNextPage = list.length > 0;
        if (hasNextPage) {
          pageNum = pageNum + 1;
        }

        that.setData({
          page: pageNum,
          hasNextPage: hasNextPage,
          subjectList: dataList
        })
        if (success) {
          success();
        }
      }
    })
  },
  bindSwiperChange: function (e) {
    var current = e.detail.current;
    this.changeSubject(current);
  },
  changeSubject: function (index) {
    // 当前位置
    var subject = this.data.subjectList[index];
    // 切换内容
    this.setData({
      subject: subject
    })

    // 自动加载
    var diff = this.data.subjectList.length - index;
    if (diff < pageRows) {
      this.loadPageData();
    }
  },
  like: function (e) {
    var subject = this.data.subject;
    subject.like = true;
    subject.likes++;
    this.setData({
      subject: subject
    })
    api.like({
      subjectId: subject.subjectId
    })
  },
  apply: function (e) {
    wx.navigateTo({
      url: 'apply',
    })
  },
  talk: function (e) {
    this.showTalks();
  },
  share: function (e) {
    wx.showToast({
      title: '请点击右上角点点点转发',
    })
    var subject = this.data.subject;
    subject.shares++;
    this.setData({
      subject: subject
    })
    api.share({
      subjectId: subject.subjectId
    })
  },
  // 重新加载主要用作测试
  reload: function (e) {
    var that = this;
    this.resetDataList()
    this.loadPageData(function () {
      that.changeSubject(0);
      wx.stopPullDownRefresh();
    });
  },
  // 显示大头像
  showAvatar: function () {
    var url = this.data.subject.avatarUrl;
    wx.previewImage({
      urls: [url],
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log("onload options ", options)

    var that = this;

    // 转发的抖音信息
    // 注意：小程序的转发主要是转发小程序本身而不是里面的某个内容
    // 所以用户第一次打开才会看到转发的信息
    if (options && options.subjectId) {
      api.getSubjectInfo(options.subjectId, function (shareSubject) {
        that.setData({
          subject: shareSubject
        })

        that.loadPageData()
      })
    } else {
      that.loadPageData(function () {
        that.changeSubject(0)
      })
    }

    // 获取用户信息
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.onUserInfo = userInfo => {
        that.setData({
          userInfo: userInfo,
          hasUserInfo: true
        })
      }
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    var that = this;

    wx.setNavigationBarTitle({
      title: "微抖音",
    })

    // 评论弹出层动画创建
    this.animation = wx.createAnimation({
      duration: 400,
      timingFunction: "ease",
      delay: 0
    })

    // 视频组件初始化
    this.videoContext = wx.createVideoContext('myVideo')
  },

  danmuTimer: null,// 弹幕定时器
  previewSubject: function () {
    var subject = this.data.subject;
    if (subject.type == 'video') {
      // 设置视频地址
      this.setData({
        videoSrc: subject.src || app.videoUrl,
        // isHiddenVideo: false
      })
      // 开始播放
      this.videoContext.play();

      // 自动发送弹幕
      var that = this;
      api.loadTalks({
        data: {
          subjectId: that.data.subject.subjectId,
          page: 1,
          rows: 60
        },
        success: function (page) {
          var danMus = page.content;
          // 先播放最新的弹幕, 评论多的话，需要后台数据排序
          danMus.reverse();
          console.log("获取到 " + danMus.length + " 条评论", danMus)
          that.danmuTimer = setInterval(function () {
            var talk = danMus.pop();
            if (talk) {
              console.log("发送弹幕: " + talk.content)
              that.videoContext.sendDanmu({
                text: talk.content, // 评论内容
                color: getRandomColor() // 随机颜色
              })
            } else {
              clearInterval(that.danmuTimer);
            }
          }, 1000)
        }
      });

    } else {
      wx.previewImage({
        urls: [subject.coverUrl],
      })
    }
  },

  hidePreview: function () {
    var subject = this.data.subject;
    if (subject.type == 'video') {
      // 停止发送弹幕
      clearInterval(this.danmuTimer);
      // 暂停播放
      this.videoContext.pause();
      // 隐藏视频层
      this.setData({
        isHiddenVideo: true
      })
    }
  },

  time: null,
  bindSwitchControls: function () {
    if (this.time) {
      clearTimeout(this.time)
    }
    var isHidden = !this.data.isHiddenControls;
    this.setData({
      isHiddenControls: isHidden
    })

    // 自动隐藏按钮
    var that = this;
    if (!isHidden) {
      this.time = setTimeout(function () {
        var isHidden = that.data.isHiddenControls;
        if (!isHidden) {
          that.setData({
            isHiddenControls: true
          })
        }
      }, 3000)
    }
  },

  videoErrorCallback: function (e) {
    console.log('视频错误信息:' + this.data.subject.src)
    console.log(e.detail.errMsg)
  },

  talkConfirm: function (event) {
    var that = this;
    var content = event.detail.value;
    if (content) {
      // 评论数增加
      var subject = this.data.subject;
      subject.talks++;
      this.setData({
        subject: subject
      })
      api.applyTalk({
        data: {
          subjectId: this.data.subject.subjectId,
          content: content,
        },
        success: function () {
          // that.hideTalks();
          that.loadTalks();
          // 清空输入内容
          that.setData({
            inputTalk: ''
          })
        }
      })
    } else {
      wx.showToast({
        title: '无字天书？',
      })
    }
  },

  showTalks: function () {
    // 先清空数据
    this.setData({
      talks: []
    })
    this.loadTalks();
    this.animation.bottom("0rpx").height("100%").step()
    this.setData({
      talksPage: 1,
      talksAnimationData: this.animation.export()
    })
  },

  hideTalks: function () {
    this.animation.bottom("-100%").height("0rpx").step()
    this.setData({
      talksPage: 1,
      talksAnimationData: this.animation.export()
    })
  },

  loadTalks: function () {
    var that = this;
    api.loadTalks({
      data: {
        subjectId: this.data.subject.subjectId,
        page: that.data.talksPage
      },
      success: function (page) {
        that.setData({
          talks: page.content,
          talksPages: page.pages,
          talksAnimationData: that.animation.export()
        })
      }
    });
  },

  onScrollLoad: function () {
    var page = this.data.talkPage;
    if (this.data.talkPage < this.data.talksPages) {
      page--;
    } else {
      page = this.data.talksPages;
    }
    this.setData({
      talkPage: page
    })
    this.loadTalks();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    var subject = this.data.subject;
    return {
      title: subject.title,
      imageUrl: subject.coverUrl,
      path: '/pages/douyin/subject?subjectId=' + subject.subjectId
    }
  }
})