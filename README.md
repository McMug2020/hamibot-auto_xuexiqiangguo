# 脚本安装运行及题库更新
**Hamibot自用学习主脚本参考**

适配定时任务，新增pushplus重复推送校验、低电量微信推送和完成后结束APP（针对备用机定时任务，可在间隔时间段设置2个定时任务以确保当天学习圆满）

**脚本安装地址 
https://hamibot.com/marketplace/gtf52?invite=ADfZFZnW31U9Xrnu7xy8Ns3U**

bug修正：因device.keepScreenDim();本来就有点亮屏幕的功能，为了兼容性问题，所以取消开屏解锁选项，设备直接设置成无锁屏就可以开屏点亮

**新增：Hamibot脱敏版（隐藏无障碍） https://www.123pan.com/s/D1WuVv-hd8Kh.html 提取码:1999**

顺畅运行脚本需 [學習强国v2.22.0(改版本号)]（系统版本太高安装不了QG旧版本，可用VMOS+64位版安卓7.1+Hamibot1.4.3+qg2.22改版本号，可多开；具体方法可搜索GitHub页面上的相关议题）

系统版本太高了v2.22.0旧版可能会无法安装或显示空白，隐藏无障碍后，其实用v2.33.0也行。

**v2.22.0下载（请忽略压缩包文件名） https://www.123pan.com/s/D1WuVv-5trKh.html 提取码:7777**

如登录时提示 “当前使用功能人数过多”，需要切换账号可以用LSPosed非残 隐藏对无障碍的使用；单账号只需要初次登录前完全关闭Hamibot（取消其无障碍授权）就行了；——推荐直接用Hamibot脱敏版

**自建题库，每周六自动检测更新（如有）**
https://github.com/McMug2020/XXQG_TiKu

**自动跑跑，见 备用机（LG V35洋垃圾）学习心得分享**
https://github.com/dundunnp/auto_xuexiqiangguo/issues/673

# Hamibot-Auto学习强国
<p>Hamibot-Auto学习强国 是一款自动化学习工具 forked from <a href="https://github.com/dundunnp/auto_xuexiqiangguo/">dundunnp</a>大神</p>
<p>本项目旨在解放双手 让大家在未来十年有更多时间做更有意义的事</p>
<p><img src="https://www.rmzxb.com.cn/upload/resources/image/2022/01/27/2648926_500x500.jpg"/></p>

快扫码解锁，上车了！

<p>
<a href="https://github.com/dundunnp/auto_xuexiqiangguo/blob/version-15.71/LICENSE.txt"><img src="https://img.shields.io/github/license/dundunnp/auto_xuexiqiangguo"/></a>
<a href="https://github.com/dundunnp/auto_xuexiqiangguo/network"><img src="https://img.shields.io/github/forks/dundunnp/auto_xuexiqiangguo"/></a>
<a href="https://github.com/dundunnp/auto_xuexiqiangguo/stargazers/"><img src="https://img.shields.io/github/stars/dundunnp/auto_xuexiqiangguo"/></a>
<a href="https://github.com/dundunnp/auto_xuexiqiangguo/watchers"><img src="https://img.shields.io/github/watchers/dundunnp/auto_xuexiqiangguo"/></a>
<a href="https://github.com/dundunnp/auto_xuexiqiangguo/issues"><img src="https://img.shields.io/github/issues/dundunnp/auto_xuexiqiangguo"/></a>
</p>

#  目录
- [免责声明](#免责声明)
- [脚本声明](#脚本声明)
- [使用说明](#使用说明)
  - [Hamibot](#hamibot)
  - [满足条件](#满足条件)
  - [编辑配置说明](#编辑配置说明)
  - [百度API配置](#百度api配置)
- [衍生脚本](#衍生脚本)
- [常见问题](#常见问题)
- [⭐Give A Star](#give-a-star)

# 免责声明
**本脚本为免费使用，本脚本只供个人学习使用，不得盈利传播，不得用于违法用途，否则造成的一切后果自负！**

如果喜欢的话可以star一下噢，谢谢！

# 脚本声明
**本脚本适用于安卓、鸿蒙系统，不适用于IOS，用IOS设备可在PC上安装[浏览器扩展插件](https://github.com/McMug2020/LearningThePooh)扫二维码学习；请将强国软件换为v2.22.0 或v2.33.0（修改版本号），v2.33.0之后的版本脚本运行可能报错**
**如果因为bug或各种原因不得不终止脚本，请重新运行脚本，脚本会自动跳过已完成的部分**
**如果遇到bug问题，请先查看[常见问题](#常见问题)，如果没有找到类似问题或还是不行请反馈bug给我**

# 使用说明

配合强国软件2.33.0，脚本可以在Hamibot上完美运行；多账号请谨慎使用，**超出百度OCR免费次数所产生的费用概不负责**

推荐选择Hamibot使用，Hamibot是适用于安卓系统的自动化工具，近乎Auto.js，优点是脚本热更新，能操控任意 APP，实现自动化操作，提高工作效率，发布的脚本经由平台审核安全。具体操作如下：

## Hamibot
1. 先跟随着[Hamibot指导](https://hamibot.com/guide)安装Hamibot并配对好机器人：

2. 点击图标导入脚本
<div>
<a href="https://hamibot.com/dashboard/scripts/import?url=https%3A%2F%2Fgithub.com%2Fdundunnp%2Fauto_xuexiqiangguo%2Ftree%2Fversion-15.72%2FHamibot" title="导入脚本到 Hamibot">
<img src="https://hamibot.com/badge_import.png"/>
</a>
</div>

3. 点击导入
<div>
<img src="https://user-images.githubusercontent.com/68000706/189031125-cba73035-9d09-4089-88d4-6c9559f4d45a.png" alt="msedge_WRzp0mov3N" width="600px" style="zoom:33%;" />
</div>

4. 点击配置，将信息填入后保存
<div>
<img src="https://i.bmp.ovh/imgs/2022/07/28/b258833fb7a8229c.png" alt="msedge_WRzp0mov3N" width="600px" style="zoom:33%;" />
</div>

<div>
<img src="https://s3.bmp.ovh/imgs/2022/01/2ce43a5d3b4e052a.png" alt="msedge_WRzp0mov3N" width="600px" style="zoom:33%;" />
</div>

5. 就可以点运行了
<div>
<img src="https://s3.bmp.ovh/imgs/2022/01/54884dc3a8fa9d01.png" alt="msedge_WRzp0mov3N" width="600px" style="zoom:33%;" />
</div>

## 满足条件
请确保手机满足以下条件
1. 打开无障碍服务权限、程序保持后台运行
2. 手机尽量打开勿扰模式，防止突然的信息弹窗导致脚本的失败
3. 请不要使用花里胡哨的字体和输入法键盘，尽量使用系统默认，防止干扰ocr

## 编辑配置说明

**跳转页面加载的时间(以秒s为单位)**

填写跳转页面加载的时间(以秒s为单位)，默认为1s(支持小数点形式)，根据手机性能与网络情况自行而定，时间越长出bug的可能越小，但同时耗费的时间越长。
我的手机是华为mate20 pro用的是1s，大家可以参考一下，不建议小于1s，太快不符合正常人类点击频率，容易被系统侦测出（当然我也设置了随机时间性，你的任何等待时间都是你设定的基础值加一个随机时间）

**是否提高四人赛双人对战正确率**

脚本默认不为否，如果为否利用本地ocr识别题目，在识别速度、识别正确率上比第三方ocr差。此脚本选用百度API实现OCR功能，如果你想提高，需要按如下操作进行配置

**pushplus_token**

请根据[官网](http://www.pushplus.plus/)指导，获取token


## 百度API配置

首先编辑脚本，将配置选项选择“是”
<div><img src="https://user-images.githubusercontent.com/68000706/189031339-f52b77c8-97c7-42ef-a5a9-6fa4dd4da008.png"/></div>

*以下操作与百度[文字识别新手操作指引](https://cloud.baidu.com/doc/OCR/s/dk3iqnq51)一样*

第一步：注册百度账户

点击链接注册百度账户[https://passport.baidu.com/v2/?reg](https://passport.baidu.com/v2/?reg)，并完成个人认证，操作基本与华为云一致

第二步：开通文字识别服务

1. 领取免费测试资源

点击登录[文字识别控制台](https://console.bce.baidu.com/ai/?_=1634647029968&fromai=1#/ai/ocr/overview/index)，找到「领取免费资源」按钮。

<div><img src="https://bce.bdstatic.com/doc/ai-cloud-share/OCR/%E5%9B%BE%E7%89%874_d439db4.png" style="zoom:50%;" /></div>

选择通用场景OCR，选择完成后点击「0元领取」，领取免费测试资源

<div><img src="https://bce.bdstatic.com/doc/ai-cloud-share/OCR/%E5%9B%BE%E7%89%875_6babcb4.png" style="zoom:50%;" /></div>

领取成功的免费测试资源将会显示在[资源列表](https://console.bce.baidu.com/ai/?_=1625726102409#/ai/ocr/overview/resource/list)的「已领取资源」中。您可以选择「查看领取记录」去往「资源列表」查看。刚领取的资源大约30分钟生效，若领取接口长时间未在「资源列表」上生效显示，可[提交工单](https://ticket.bce.baidu.com/?_=1625726102409#/ticket/create~productId=96)咨询

<div><img src="https://bce.bdstatic.com/doc/ai-cloud-share/OCR/%E5%9B%BE%E7%89%878_92b62f6.png" style="zoom:50%;" /></div>

2. 创建应用
领取完免费测试资源后，您需要创建应用才可正式调用文字识别能力。

进入[文字识别控制台](https://passport.baidu.com/v2/?reg)，点击 「创建应用」。
<div><img src="https://bce.bdstatic.com/doc/ai-cloud-share/OCR/%E5%9B%BE%E7%89%876_7a1e4c7.png" style="zoom:50%;" /></div>

根据您的需要，填写完毕相应信息后，点击「立即创建」，即可完成应用的创建。应用创建完毕后，点击左侧导航中的「应用列表」，进行应用查看。

<div><img src="https://bce.bdstatic.com/doc/ai-cloud-share/OCR/%E5%9B%BE%E7%89%873_86de384.png" style="zoom:50%;" /></div>

然后就能看到创建完的应用 API KEY 以及 Secret KEY 了。将其填入配置信息中，就完成了

<div><img src="https://bce.bdstatic.com/doc/ai-cloud-share/OCR/%E5%9B%BE%E7%89%877_fa8935a.png" style="zoom:50%;" /></div>

恭喜你，到这里就算是完成了!

# 衍生脚本
1. 单独四人赛双人对战脚本，相关配置说明见README.md
2. 四人赛双人对战答错脚本，相关配置说明见README.md

# 常见问题

Q1: 点击运行脚本没有反应，甚至连学习强国都没有打开

A: 1. 请确保Hamibot已经打开**无障碍服务权限**
   2. 由于hamibot软件原因或某种原因，脚本无法运行（我也出现过这种情况）你可以重新下载hamibot软件

Q2: 在四人赛、双人对战正确率感人

A: 我用自己手机测试答题正确率能在90%以上，大家出现错误率高的主要原因在于：是否正确配置百度OCR
**另：错误是无法避免的，如果你有特殊的需求我一定要拿满分，非常抱歉这个脚本可能不能满足你**

Q3: 为什么我按照步骤配置好了第三方ocr服务，但正确率还是跟本地ocr差不多

A: 首先检查配置信息是否在提高正确率上选择了是、其次检查配置信息是否正确

Q4: 一直要求打开无障碍服务权限

A: 已经打开了，但还是不行，一般是因为服务被系统结束了，解决方法是重启手机或者重新下载hamibot

Q5: 除上面的问题

A: 请在[GitHub](https://github.com/dundunnp/hamibot-auto_xuexiqiangguo/issues)或议题上提出问题，问题尽量详细，包含图片（配置信息、学习强国主页等有助于了解问题的图片）或视频，这样对大家解决问题都快

# ⭐Give A Star
如果对你有帮助的话，希望您可以给一颗星星，推荐给更多的好友
