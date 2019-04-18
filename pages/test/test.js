const app = getApp();

var videopage = 0;

var up;

var down;

Page({

  /**
  
  * 页面的初始数据
  
  */

  data: {
    videoUrl: app.videoUrl,

    videoList: [],

    curvideo: '',

    issold: true,

    canIUse: wx.canIUse('button.open-type.getUserInfo'),

    isnew: true,

    typeList: [],

    colorList: [],

    catList: [],

    typeChooseIndex: 0,

    colorChooseIndex: 0,

    curCat: {},

    videoindex: 0,

    videoH: 700,

    maskStatus: 'hide',

    videoBtnStatus: 'hide'

  },

  curColorType: '', //选择的颜色

  curTypeCode: '', //选择的类型

  page: 1, //第几页

  pageSize: 20, //每页显示数量

  openId: app.openId,

  isEnd: false,

  isAjax: false,

  noDataTip: '暂无数据,切换一个标签吧',

  /**
  
  * 生命周期函数--监听页面加载
  
  */

  onLoad: function (options) {

    var that = this;

    wx.getSystemInfo({//适配

      success: function (res) {

        console.info("版本号", +res.SDKVersion.replace(/\./g, ""));

        if (+res.SDKVersion.replace(/\./g, "") <= 210) {

          wx.showToast({

            title: '您当前微信版本太低，部分功能不支持，请升级到最新微信版本',

            icon: 'none',

            duration: 10000

          })

        }



        var isPlus = res.model.search("Plus");

        var isX = res.model.search("iPhone X");

        var ipad = res.model.search("iPad");

        if (isX != -1) {

          that.setData({

            videoH: 1000

          })

        }

        if (isPlus != -1) {

          that.setData({

            videoH: 800

          })

        }

        if (ipad != -1) {

          that.setData({

            videoH: 400

          })

        }

      }

    })

    var that = this;

    if (!that.openId) {

      that.openId = app.openId

    }

    app.getDate('api/wechat/queryLabel', {}, function (data) {

      var d = data.data;

      that.setData({

        typeList: data.data,

        colorList: d[0].listColor

      });



    });

    that.queryCatList();

    //用户第一次显示操作提示

    try {

      const isfirst = wx.getStorageSync('first');

      if (isfirst == 1) {

        that.setData({

          maskStatus: 'hide'

        })

      } else {

        wx.setStorageSync('first', 1);

        that.setData({

          maskStatus: 'show'

        })

      }

    } catch (e) {

      console.info(e);

    }

  },



  /**
  
  * 用户点击右上角分享
  
  */

  onShareAppMessage: function () {

    this.btnshare();

    return {

      title: app.data.shareTitle,

      path: app.data.sharePath,

    }

  },

  videowait: function () {

    wx.showLoading({

      title: "拼命加载中...",

    })

  },

  goreserve: function (e) {

    var id = e.target.dataset.catid;

    wx.navigateTo({

      url: '../reserve/reserve?id=' + id

    })

  },

  bindGetUserInfo(e) {

    var that = this;

    console.log(e.detail.userInfo);

    if (!!e.detail.userInfo) {

      const userInfo = e.detail.userInfo;

      try {

        wx.setStorageSync('userInfo', userInfo);

      } catch (e) {

        console.info(e);

      }

      that.setData({

        isnew: false

      })

      wx.navigateTo({

        url: '../center/center',

      })

    } else {

      that.setData({

        isnew: true

      })

      wx.showToast({

        title: '授权失败',

        icon: 'none',

        duration: 2000

      })

      console.info("授权失败")

    }



  },

  goCenter: function () {

    if (!wx.canIUse('button.open-type.getUserInfo')) {

      wx.showToast({

        title: '请升级微信版本',

        icon: 'none',

        duration: 2000

      })

    }

  },

  btnshare: function () {

    var that = this;

    //that.onShareAppMessage;

    that.data.curCat.shareNum = that.data.curCat.shareNum + 1;

    that.setData({

      curCat: that.data.curCat

    });

    app.getDate('api/wechat/share/' + that.data.curCat.id + '.do', {});



  },

  /**
  
  * 上面风格点击事件
  
  */

  styleClick: function (e) {



    var index = e.target.dataset.index;

    var that = this;

    var curTypeinfo = that.data.typeList[index];



    console.info(index, curTypeinfo, curTypeinfo.listColor);

    that.setData({

      colorList: curTypeinfo.listColor,

      typeChooseIndex: index,

      colorChooseIndex: 0

    });

    videopage = 0;

    that.curColorType = '';

    that.curTypeCode = !curTypeinfo.typeCode ? '' : curTypeinfo.typeCode;

    that.data.catList = [];

    that.page = 1;

    that.isEnd = false;

    that.queryCatList();

    that.videoPlay(1);

    //console.info(e.target.dataset);

  },

  colorClick: function (e) {

    var index = e.target.dataset.index;

    var that = this;



    var curTypeinfo = that.data.typeList[that.data.typeChooseIndex];

    var curColor = curTypeinfo.listColor[index];

    console.info(curTypeinfo, curColor);



    that.curColorType = curColor.colorCode;

    that.curTypeCode = curTypeinfo.typeCode;

    that.page = 1;

    that.setData({

      colorChooseIndex: index

    })

    videopage = 0;

    that.data.catList = [];

    that.page = 1;

    that.isEnd = false;

    that.queryCatList();

    // that.queryCatList();

    //console.info(e.target.dataset);

    that.videoPlay(1);

  },

  likeEnt: function (e) {

    var that = this;




    var curCat = that.data.curCat;

    if (curCat.likeStatus == 1) {

      curCat.likeStatus = 0;

      curCat.likeNum = curCat.likeNum > 0 ? curCat.likeNum - 1 : 0;

    } else {

      curCat.likeStatus = 1;

      curCat.likeNum = curCat.likeNum + 1;

    }

    that.setData({

      catList: that.data.catList,

      curCat: curCat

    })

    app.getDate('api/wechat/updateLike.do', {

      catId: curCat.id,

      openId: that.openId,

      status: curCat.likeStatus

    });

  },

  queryCatList: function () {

    var that = this;

    if (that.isEnd) {

      return;

    }

    app.getDate('api/wechat/queryVideoCat', {

      typeCode: that.curTypeCode,

      colorCode: that.curColorType,

      page: that.page,

      openId: that.openId,

      rows: that.pageSize

    }, function (data) {

      that.page++;

      var d = data.data;

      if (!d || d.length <= 0) {

        that.isEnd = true;

        if (that.data.catList.length > 0) {

          videopage = 0;

          var catList = that.data.catList;

          that.setData({

            curCat: catList[videopage],

            curvideo: catList[videopage].attaEntity[0].url



          });

          return;

        }

        wx.showToast({

          title: that.noDataTip,

          icon: 'none',

          duration: 2000

        })

        return;

      } else {

        if (d.length < that.pageSize) {

          that.isEnd = true;

        }

        var tdata = that.data.catList.concat(d);

        that.setData({

          catList: tdata,

          curCat: tdata[videopage],

          curvideo: tdata[videopage].attaEntity[0].url

        })

      }

    });



  },



  //触摸开始事件

  touchstart: function (e) {

    var that = this;

    //console.log(e.touches[0].clientY)

    that.setData({

      touchstartY: e.touches[0].clientY

    })

    this.data.touchstartY = e.touches[0].clientY;

    up = false;

    down = false;



  },

  //触摸移动事件

  touchmove: function (e) {

    // console.log(e)

    let touchendY = e.touches[0].clientY;

    let touchstartY = this.data.touchstartY;

    //向上滑动

    if (touchendY - touchstartY <= -40) {

      console.log("向上滑动");

      up = true;

      down = false;

    }

    //向下滑动

    if (touchendY - touchstartY >= 40) {

      console.log("向下滑动");

      up = false;

      down = true;

    }

  },

  //触摸结束事件

  touchend: function (e) {

    var that = this;

    var videoList = that.data.catList;

    if (up === true) {

      if (videopage >= videoList.length - 1) {

        if (that.isEnd) { //如果已经结束了

          if (videoList.length <= 0) {

            wx.showToast({

              title: that.noDataTip,

              icon: 'none',

              duration: 2000

            });

            return;

          } else {

            videopage = 0;

          }

        } else { //如果还没有结束，加载下一个

          videopage++;

          that.queryCatList();

          return;

        }

      } else {

        videopage++;

      }

    }

    if (down === true) {

      if (videopage == 0) {

        if (videoList.length > 0) {

          videopage = videoList.length - 1;

        } else {

          wx.showToast({

            title: that.noDataTip,

            icon: 'none',

            duration: 2000

          })

          return;

        }

      } else {

        videopage--;

      }

    }




    var curCat = videoList[videopage];

    that.setData({

      curvideo: curCat.attaEntity[0].url,

      curCat: curCat

    });

    up = false;

    down = false;

    that.videoPlay(1);

  },

  //关闭操作提示

  closeMask: function () {

    var that = this;

    that.setData({

      maskStatus: 'hide'

    })

  },

  //视频暂停与播放封装 status：1播放 2暂停

  videoPlay: function (status) {

    console.info(status);

    var that = this;

    var v = wx.createVideoContext("video0");

    if (status == 1) {//播放

      v.play();

      that.setData({

        videoBtnStatus: 'hide'

      })

    } else if (status == 2) {//暂停

      v.pause();

      that.setData({

        videoBtnStatus: 'show'

      })

    }

  },

  pauseVideo: function () {

    var that = this;

    that.videoPlay(2);

  },

  playVideo: function () {

    var that = this;

    that.videoPlay(1);

  },

  videoProgress: function (e) {

    var that = this;

    console.info(e.detail.duration, e.detail.currentTime);

    var duration = e.detail.duration;

    var currentTime = e.detail.currentTime;

    var progress = currentTime / duration * 100;

    that.setData({

      vProgress: progress

    })

  }

});
