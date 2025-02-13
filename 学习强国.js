/**
 * 检查和设置运行环境
 * @param whether_improve_accuracy {String} 是否提高ocr精度 "yes":开启; "no"(默认):不开启
 * @param AK {String} 百度API KEY
 * @param SK {String} 百度Secret KEY
 * @return {int} 静音前的音量
 */
function check_set_env(whether_improve_accuracy, AK, SK) {
    // 检查无障碍服务是否已经启用
    auto.waitFor();

    // 检查在选择提高精确度的情况下，AK和SK是否填写
    if (whether_improve_accuracy == "yes" && (!AK || !SK)) {
        toastLog("如果你选择了增强版，请配置信息，具体看脚本说明");
        exit();
    }

    // 检查Hamibot版本是否支持ocr
    if (app.versionName < "1.3.1") {
        toastLog("请将Hamibot更新至v1.3.1版本或更高版本");
        exit();
    }

    // 保持屏幕唤醒状态30分钟
    device.keepScreenDim(30 * 60 * 1000);

    //请求横屏截图权限
    threads.start(function () {
        try {
            var beginBtn;
            if (beginBtn = classNameContains("Button").textContains("开始").findOne(delay_time));
            else if (beginBtn = classNameContains("Button").textContains("允许").findOne(delay_time));
            else if (beginBtn = classNameContains("Button").textContains("ALLOW").findOne(delay_time));
            else (beginBtn = classNameContains("Button").textContains("Start").findOne(delay_time));
            beginBtn.click();
        } catch (error) {
        }
    });
    requestScreenCapture(false);

    // 获得原来的媒体音量并静音，后面调回去
    var vol = device.getMusicVolume();
    device.setMusicVolume(0);

    return vol;
}

/**
 * 获取配置参数及本地存储数据
 */
// 基础数据
var { new_hami } = hamibot.env;
var { delay_time } = hamibot.env;
var { whether_improve_accuracy } = hamibot.env;
var { whether_complete_subscription } = hamibot.env;
var { whether_complete_speech } = hamibot.env;
var { pushplus_token } = hamibot.env;
var { all_completed_Vibrate } = hamibot.env;
delay_time = Number(delay_time) * 1000;

// 调用百度api所需参数
var { AK, SK } = hamibot.env;

// 本地存储数据
var storage = storages.create("data");

// 更新题库为answer_question_map
storage.remove("answer_question_map1");

var vol = check_set_env(whether_improve_accuracy, AK, SK);

/**
 * 定义HashTable类(貌似hamibot有问题，无法定义class， 因此写为函数)，用于存储本地题库，查找效率更高
 * 由于hamibot不支持存储自定义对象和new Map()，因此这里用列表存储自己实现
 * 在存储时，不需要存储整个question，可以仅根据选项来对应question，这样可以省去ocr题目的花费
 * 但如果遇到选项为special_problem数组中的模糊词，无法对应question，则需要存储整个问题
 */

var answer_question_map = [];

// 当题目为这些词时，题目较多会造成hash表上的一个index过多，此时存储其选项
var special_problem = "选择正确的读音 选择词语的正确词形 下列词形正确的是 选择正确的字形 下列词语字形正确的是";
// 当题目为这些词时，在线搜索书名号和逗号后的内容
var special_problem2 = "根据《中国共 根据《中华人 《中华人民共 根据《化妆品";
var special_problem3 = "下列选项中，";

/**
 * hash函数，7853质数，重新算出的最优值，具体可以看评估代码
 * @param string {String} 需要计算hash值的String
 * @return {int} string的hash值
 */
function get_hash(string) {
    var hash = 0;
    for (var i = 0; i < string.length; i++) {
        hash += string.charCodeAt(i);
    }
    return hash % 7853;
}

/**
 * 将题目和答案存入answer_question_map
 * @param key {String} 键：表示题目的问题
 * @param value {String} 值：表示题目的答案
 * @return void
 */
function map_set(key, value) {
    var index = get_hash(key);
    if (answer_question_map[index] === undefined) {
        answer_question_map[index] = [
            [key, value]
        ];
    } else {
        // 去重
        for (var i = 0; i < answer_question_map[index].length; i++) {
            if (answer_question_map[index][i][0] == key) {
                return null;
            }
        }
        answer_question_map[index].push([key, value]);
    }
};

/**
 * 根据题目在answer_question_map中搜索答案
 * @param key {String} 键：表示题目的问题
 * @return {String} 题目的答案，如果没有搜索到则返回null
 */
function map_get(key) {
    var index = get_hash(key);
    if (answer_question_map[index] != undefined) {
        for (var i = 0; i < answer_question_map[index].length; i++) {
            if (answer_question_map[index][i][0] == key) {
                return answer_question_map[index][i][1];
            }
        }
    }
    return null;
};

//pushplus推送校验
if (pushplus_token) {
    if (!storage.contains("token_check_storage")) {
        storage.put("token_check_storage", "0");
    }
    if (!storage.contains("account_check_storage")) {
        storage.put("account_check_storage", "学习强国");
    }
    if (!storage.contains("day_check_storage")) {
        storage.put("day_check_storage", 32);
    }
    if (!storage.contains("score_check_storage")) {
        storage.put("score_check_storage", 99);
    }
    var token_check0 = storage.get("token_check_storage");
    var account_check0 = storage.get("account_check_storage");
    var day_check0 = storage.get("day_check_storage");
    var score_check0 = storage.get("score_check_storage");
    /**
     * 低电量提醒微信推送
     //多账号可指定推送第一个的token
     */
    if (!device.isCharging() && Number(device.getBattery()) < 20) {
        let style_str = '<style>.item{height:1.5em;line-height:1.5em;}.item span{display:inline-block;padding-left:0.4em;}\
        .item .bar{width:100px;height:10px;background-color:#ddd;border-radius:5px;display:inline-block;}\
        .item .bar div{height:10px;background-color:#ed4e45;border-radius:5px;}</style>';
        var PP4 = device.getBattery() + '%';
        var message_str = '<h6>关联设备的电量为：' + PP4 + '</h6><div>';
        message_str += '<div class="item"><div class="bar"><div style="width: ' + PP4 + ';"></div></div></div></div>' + style_str;
        // 推送消息
        http.postJson(
            "http://www.pushplus.plus/send",
            {
                token: pushplus_token,
                title: "电量较低，请及时给设备充电",
                content: message_str,
                template: "markdown",
            }
        );
        toastLog("电量低消息已推送到微信");
    }
}

/**
 * 开始运行学习脚本
 */
sleep(random_time(delay_time));
if (new_hami) launch('com.dingdin.dingdio');
else launch('com.hamibot.hamibot');
textMatches(/Hamibot|蜜瓜软件|日志/).waitFor();
toastLog("主脚本（旧）正在运行");
sleep(random_time(delay_time));

/**
 * 定时更新题库，通过在线访问辅助文件判断题库是否有更新
 */
if (!storage.contains("answer_question_bank_update_storage")) {
    storage.put("answer_question_bank_update_storage", 0);
    storage.remove("answer_question_map");
}

var date = new Date();
// 每周六定时检测更新题库，周日为0
if (date.getDay() == 6) {
    var answer_question_bank_update = storage.get("answer_question_bank_update_storage");
    if (answer_question_bank_update) {
        var answer_question_bank_checked = http.get("https://ghproxy.com/https://raw.githubusercontent.com/McMug2020/XXQG_TiKu/main/0.json");
        if ((answer_question_bank_checked.statusCode >= 200 && answer_question_bank_checked.statusCode < 300)) storage.remove("answer_question_map");
    } else {
        var answer_question_bank_checked = http.get("https://ghproxy.com/https://raw.githubusercontent.com/McMug2020/XXQG_TiKu/main/1.json");
        if ((answer_question_bank_checked.statusCode >= 200 && answer_question_bank_checked.statusCode < 300)) storage.remove("answer_question_map");
    }
}

// 或设定每月某日定时检测更新
//if (date.getDate() == 28)｛
//｝

/**
 * 通过Http更新\下载题库到本地，并进行处理，如果本地已经存在则无需下载
 * @return {List} 题库
 */
function map_update() {
    toastLog("正在下载题库");
    // 使用 GitHub 上存放的题库
    var answer_question_bank = http.get("https://ghproxy.com/https://raw.githubusercontent.com/McMug2020/XXQG_TiKu/main/%E9%A2%98%E5%BA%93_McMug2020.json");
    sleep(2500);
    // 如果资源过期或无法访问则换成别的地址
    if (!(answer_question_bank.statusCode >= 200 && answer_question_bank.statusCode < 300)) {
        // 使用XXQG_TiKu挑战答题腾讯云题库地址
        var answer_question_bank = http.get("https://xxqg-tiku-1305531293.cos.ap-nanjing.myqcloud.com/%E9%A2%98%E5%BA%93_%E6%8E%92%E5%BA%8F%E7%89%88.json");
        toastLog("下载XXQG_TiKu题库");
        sleep(2500);
    }
    answer_question_bank = answer_question_bank.body.string();
    answer_question_bank = JSON.parse(answer_question_bank);
    toastLog("格式化题库");
    for (var question in answer_question_bank) {
        var answer = answer_question_bank[question];
        if (special_problem.indexOf(question.slice(0, 7)) != -1) question = question.slice(question.indexOf("|") + 1);
        else {
            question = question.slice(0, question.indexOf("|"));
            question = question.slice(0, question.indexOf(" "));
            question = question.slice(0, 25);
        }
        map_set(question, answer);
    }
    sleep(1500);
    // 将题库存储到本地
    storage.put("answer_question_map", answer_question_map);

    // 通过异或运算切换更新题库的开关，并记录
    var k = storage.get("answer_question_bank_update_storage") ^ 1;
    storage.put("answer_question_bank_update_storage", k);
}

if (!storage.contains("answer_question_map")) {
    map_update();
} else {
    answer_question_map = storage.get("answer_question_map");
}

/**
 * 模拟点击不可以点击元素
 * @param {UiObject / string} target 控件或者是控件文本
 */
function my_click_non_clickable(target) {
    if (typeof (target) == "string") {
        text(target).waitFor();
        var tmp = text(target).findOne().bounds();
    } else {
        var tmp = target.bounds();
    }
    var randomX = random(tmp.left, tmp.right);
    var randomY = random(tmp.top, tmp.bottom);
    click(randomX, randomY);
}

/**
 * 模拟点击可点击元素
 * @param {string} target 控件文本
 */
function my_click_clickable(target) {
    text(target).waitFor();
    // 防止点到页面中其他有包含“我的”的控件，比如搜索栏
    if (target == "我的") {
        id("comm_head_xuexi_mine").findOne().click();
    } else {
        click(target);
    }
}

/**
 * 模拟随机时间
 * @param {int} time 时间
 * @return {int} 随机后的时间值
 */
function random_time(time) {
    return time + random(100, 1000);
}

/**
 * 刷新页面
 * @param {boolean} orientation 方向标识 true表示从下至上 false表示从上至下
 */
function refresh(orientation) {
    if (orientation)
        swipe(device.width / 2, (device.height * 13) / 15,
            device.width / 2, (device.height * 2) / 15,
            random_time(delay_time / 2));
    else
        swipe(device.width / 2, (device.height * 6) / 15,
            device.width / 2, (device.height * 12) / 15,
            random_time(delay_time / 2));
    sleep(random_time(delay_time));
}

/**
 * 去省份模块
 */
function go_province() {
    sleep(random_time(delay_time));
    className("android.view.ViewGroup").depth(15).waitFor();
    sleep(random_time(delay_time));
    // 判断省份模块位置
    province_list = ["河北", "山西", "黑龙江", "吉林", "辽宁", "江苏", "浙江", "安徽", "福建", "江西", "山东", "河南", "湖北", "湖南", "广东", "海南", "四川", "贵州", "云南", "陕西", "甘肃", "青海", "台湾", "内蒙古", "广西", "西藏", "宁夏", "新疆", "北京", "天津", "上海", "重庆", "香港", "澳门"];
    index_province = -1;
    var list = className("android.view.ViewGroup").depth(15).findOnce(2);
    for (var i = 0; i < list.childCount(); i++) {
        if (province_list.indexOf(list.child(i).child(0).text().trim()) != -1) {
            index_province = i;
            break;
        }
    }
    if (index_province == -1) {
        toastLog('没找到你的省份模块，请在github上提出issue');
        exit();
    }
    className("android.view.ViewGroup").depth(15).findOnce(2).child(index_province).click();
}

/**
 * pushplus推送通知到微信
 */
function push_weixin_message(account) {
    http.postJson(
        "http://www.pushplus.plus/send",
        {
            token: pushplus_token,
            title: account,
            content: content_str,
            template: "markdown",
        }
    );
    toastLog("积分已推送到微信");
}

function send_pushplus() {
    var zongfen = text("成长总积分").findOne().parent().child(1).text();
    var model_list = className('ListView').depth(23).findOne();
    var list_count = model_list.childCount();
    var jifen_list = className("android.widget.ListView").rowCount(list_count).findOne();
    var jinri = jifen_list.parent().child(1).text().match(/\d+/g)[0];
    let style_str = '<style>.item{height:1.5em;line-height:1.5em;}.item span{display:inline-block;padding-left:0.4em;}\
    .item .bar{width:100px;height:10px;background-color:#ddd;border-radius:5px;display:inline-block;}\
    .item .bar div{height:10px;background-color:#ed4e45;border-radius:5px;}</style>';
    let content_str = '<h6>今日已累积：' + jinri + '积分' + '\xa0\xa0\xa0\xa0' + '成长总积分：' + zongfen + '\xa0\xa0\xa0\xa0' + '</h6><div>';
    for (let option of jifen_list.children()) {
        var title = option.child(0).text();
        var score = option.child(3).child(0).text();
        var total = option.child(3).child(2).text().match(/\d+/g)[0];
        let percent = (Number(score) / Number(total) * 100).toFixed() + '%';
        let detail = title + ": " + score + "/" + total;
        content_str += '<div class="item"><div class="bar"><div style="width: ' + percent + ';"></div></div><span>' + detail + '</span></div>';
    }
    content_str += '</div>' + style_str;
    return [jinri, content_str];
}

/**
 * 如果因为某种不知道的bug退出了界面，则使其回到正轨
 * 全局变量back_track_flag说明:
 * back_track_flag = 0时，表示阅读部分
 * back_track_flag = 1时，表示视听部分
 * back_track_flag = 2时，表示竞赛、答题部分和准备部分
 */
function back_track() {
    do {
        app.launchApp("学习强国");
        sleep(random_time(delay_time * back_track_wait_time));
        if (text("立即升级").exists()) {
            text("取消").findOne().click();
        }
        var while_count = 0;
        while (!id("comm_head_title").exists() && while_count < 5) {
            while_count++;
            back();
            sleep(random_time(delay_time));
            if (textContains("确定要退出").exists()) {
                my_click_clickable("退出");
                sleep(random_time(delay_time * 2));
            }
        }
        switch (back_track_flag) {
            case 0:
                // 去中心模块
                id("home_bottom_tab_icon_large").waitFor();
                sleep(random_time(delay_time));
                var home_bottom = id("home_bottom_tab_icon_large").findOne().bounds();
                click(home_bottom.centerX(), home_bottom.centerY());
                // 去省份模块
                go_province();
                break;
            case 1:
                break;
            case 2:
                // 当网络不稳定时容易碰见积分规则更新中的情况
                while (true) {
                    my_click_clickable("我的");
                    sleep(random_time(delay_time));
                    my_click_clickable("学习积分");
                    sleep(random_time(delay_time));
                    text("积分规则").waitFor();
                    sleep(random_time(delay_time));
                    if (text("登录").exists()) break;
                    back();
                    sleep(random_time(delay_time));
                    back();
                }
        }
    // 当由于未知原因退出学习强国，则重新执行
    } while (!className("FrameLayout").packageName("cn.xuexi.android").exists());
}

// 关闭音乐播放浮窗控件
function close_music_widget() {
    let imv = className("android.widget.ImageView").find();
    let swtch = imv[imv.length - 1];
    swtch.click();
    sleep(random(1000, 1200));
    swtch.click();
    return true;
}

/**
 * 获取各模块完成情况的字典，其中字典的key为模块的名字，value为[模块是否已完成，模块已得分，模块满分]
 */
function get_finish_dict() {
    // 定义一个字典
    var finish_dict = new Array();
    // 模块列表
    var model_list = className('ListView').depth(23).findOne();
    for (var i = 0; i < model_list.childCount(); i++) {
        var model = model_list.child(i);
        // 获取模块名
        var model_name = model.child(0).text().trim();
        try {
            // 获取模块已得分
            var model_score = parseInt(model.child(3).child(0).text());
            // 获取模块满分分数
            var model_full_score_str = model.child(3).child(2).text();
            var model_full_score = parseInt(model_full_score_str.slice(1, model_full_score_str.length));
        } catch (error) {
            // Android 12 虚拟机 特殊判断
            var model_score_str = model.child(3).text();
            // 获取模块已得分
            var model_score = parseInt(model_score_str.slice(0, model_score_str.indexOf('分')));
            // 获取模块满分分数
            var model_full_score = parseInt(model_score_str.slice(model_score_str.indexOf('/') + 1, model_score_str.length));
        }
        // 存储至字典中，当出现model_full_score未获取到时，比如专题模块，则特殊判断
        if (isNaN(model_full_score)) finish_dict[model_name] = [model_score > 0, model_score, model_full_score];
        else finish_dict[model_name] = [model_score == model_full_score, model_score, model_full_score];
    }
    return finish_dict;
}

/*
 *********************准备部分********************
 */

var back_track_flag = 2;
// 首次运行可能弹升级，等久一点
var back_track_wait_time = 5;
back_track();
// 等待时间可以少一点了
back_track_wait_time = 3;
var finish_dict = get_finish_dict();

// 获取Android系统版本号
var version_number = Number(device.release);
// 返回首页
// Android 13控件位置不同
var depth_num = version_number == 13 ? 23 : 22;
className("android.view.View").clickable(true).depth(depth_num).findOne().click();
id("my_back").waitFor();
sleep(random_time(delay_time / 2));
id("my_back").findOne().click();
sleep(random_time(delay_time));

if (!finish_dict['本地频道'][0] || !finish_dict['我要选读文章'][0]) {
    // 去省份模块
    go_province();
}

/*
 **********本地频道*********
 */
if (!finish_dict['本地频道'][0]) {
    // 去本地频道
    className("android.widget.LinearLayout").clickable(true).depth(26).waitFor();
    sleep(random_time(delay_time));
    className("android.widget.LinearLayout").clickable(true).depth(26).drawingOrder(1).findOne().click();
    sleep(random_time(delay_time));
    back();
}

/*
 *********************阅读部分********************
 */
var back_track_flag = 0;

/*
 **********我要选读文章与分享与广播学习*********
 */

// 打开电台广播
if (!finish_dict['我要视听学习'][0] && !finish_dict['我要选读文章'][0]) {
    sleep(random_time(delay_time));
    my_click_clickable("电台");
    sleep(random_time(delay_time));
    my_click_clickable("听广播");
    sleep(random_time(delay_time));
    id("lay_state_icon").waitFor();
    var lay_state_icon_pos = id("lay_state_icon").findOne().bounds();
    click(lay_state_icon_pos.centerX(), lay_state_icon_pos.centerY());
    sleep(random_time(delay_time));
    var home_bottom = id("home_bottom_tab_icon_large").findOne().bounds();
    click(home_bottom.centerX(), home_bottom.centerY());
}

// 阅读文章次数
var count = 0;

while (count < 6 - finish_dict['我要选读文章'][1] / 2) {

    if (!id("comm_head_title").exists() || !className("android.widget.TextView").depth(27).text("切换地区").exists()) back_track();
    sleep(random_time(delay_time));

    refresh(false);

    var article = id("general_card_image_id").find();

    if (article.length == 0) {
        refresh(false);
        continue;
    }

    for (var i = 0; i < article.length; i++) {

        sleep(random_time(500));

        try {
            click(article[i].bounds().centerX(),
                article[i].bounds().centerY());
        } catch (error) {
            continue;
        }

        sleep(random_time(delay_time));
        // 跳过专栏与音乐
        if (className("ImageView").depth(10).clickable(true).findOnce(1) == null ||
            textContains("专题").findOne(1000) != null) {
            back();
            continue;
        }

        // 观看时长
        sleep(random_time(65000));

        back();
        count++;
    }
    sleep(random_time(500));
}

/*
 *********************视听部分********************
 */

back_track_flag = 1;

// 关闭电台广播
if (!finish_dict['我要视听学习'][0] && !finish_dict['我要选读文章'][0]) {
    if (!id("comm_head_title").exists()) back_track();
    sleep(random_time(delay_time));
    my_click_clickable("电台");
    sleep(random_time(delay_time));
    my_click_clickable("听广播");
    sleep(random_time(delay_time));

    if (!textStartsWith("最近收听").exists() && !textStartsWith("推荐收听").exists()) {
        // 不应该直接通过id寻找控件，因为此页面过多控件，寻找耗时太大
        // 换成通过text寻找控件
        textStartsWith("正在收听").waitFor();
        textStartsWith("正在收听").findOne().parent().child(1).child(0).click();
    }
    sleep(random_time(delay_time));
    close_music_widget();
    sleep(random_time(delay_time));
}

// 重新获取视听学习剩下的分数
var back_track_flag = 2;
back_track();
var finish_dict = get_finish_dict();
back_track_flag = 1;
sleep(random_time(delay_time));

/*
 **********我要视听学习*********
 */
if (!finish_dict['我要视听学习'][0]) {
    if (!id("comm_head_title").exists()) back_track();
    my_click_clickable("百灵");
    sleep(random_time(delay_time / 2));
    my_click_clickable("竖");
    // 刷新视频列表
    sleep(random_time(delay_time / 2));
    my_click_clickable("竖")
    // 等待视频加载
    sleep(random_time(delay_time * 3));
    // 点击第一个视频
    className("android.widget.FrameLayout").clickable(true).depth(24).findOne().click();

    // 为了兼容强国版本为v2.33.0（改版本号）
    sleep(random_time(delay_time));
    if (!id("iv_back").exists()) {
        className("android.widget.FrameLayout").clickable(true).depth(24).findOnce(7).click();
    }
    sleep(random_time(delay_time));
    if (text("继续播放").exists()) click("继续播放");
    if (text("刷新重试").exists()) click("刷新重试");
    var completed_watch_count = finish_dict['我要视听学习'][1];
    while (completed_watch_count < 12) {
        sleep(random_time(delay_time / 2));
        className("android.widget.LinearLayout").clickable(true).depth(16).waitFor();
        // 当前视频的时间长度
        try {
            var current_video_time = className("android.widget.TextView").clickable(false).depth(16).findOne().text().match(/\/.*/).toString().slice(1);
            // 如果视频超过一分钟就跳过
            if (Number(current_video_time.slice(0, 3)) >= 1) {
                refresh(true);
                sleep(random_time(delay_time));
                continue;
            }
            sleep(Number(current_video_time.slice(4)) * 1000 + 500);
        } catch (error) {
            // 如果被"即将播放"将读取不到视频的时间长度，此时就sleep 3秒
            sleep(3000);
        }
        completed_watch_count++;
    }

    back();
}

/*
 *********************竞赛部分********************
 */
var back_track_flag = 2;

/**
 * 选出选项
 * @param {answer} answer 答案
 * @param {int} depth_click_option 点击选项控件的深度，用于点击选项
 * @param {list[string]} options_text 每个选项文本
 */
function select_option(answer, depth_click_option, options_text) {
    // 注意这里一定要用original_options_text
    var option_i = options_text.indexOf(answer);
    // 如果找到答案对应的选项
    if (option_i != -1) {
        try {
            className("android.widget.RadioButton").depth(depth_click_option).clickable(true).findOnce(option_i).click();
            return;
        } catch (error) {
        }
    }

    // 如果运行到这，说明很有可能是选项ocr错误，导致答案无法匹配，因此用最大相似度匹配
    if (answer != null) {
        var max_similarity = 0;
        var max_similarity_index = 0;
        for (var i = 0; i < options_text.length; ++i) {
            if (options_text[i]) {
                var similarity = getSimilarity(options_text[i], answer);
                if (similarity > max_similarity) {
                    max_similarity = similarity;
                    max_similarity_index = i;
                }
            }
        }
        try {
            className("android.widget.RadioButton").depth(depth_click_option).clickable(true).findOnce(max_similarity_index).click();
            return;
        } catch (error) {
        }
    } else {
        try {
            // 没找到答案，点击第一个
            className("android.widget.RadioButton").depth(depth_click_option).clickable(true).findOne(delay_time * 3).click();
        } catch (error) {
        }
    }
}

/**
 * 答题（挑战答题、四人赛与双人对战）
 * @param {int} depth_click_option 点击选项控件的深度，用于点击选项
 * @param {string} question 问题
 * @param {list[string]} options_text 每个选项文本
 */
function do_contest_answer(depth_click_option, question, options_text) {
    question = question.slice(0, 25);
    // 如果是特殊问题需要用选项搜索答案，而不是问题
    if (special_problem.indexOf(question.slice(0, 7)) != -1) {
        var original_options_text = options_text.concat();
        var sorted_options_text = original_options_text.sort();
        question = sorted_options_text.join("|");
    }
    // 从哈希表中取出答案
    var answer = map_get(question);

    // 如果本地题库没搜到，则搜网络题库
    if (answer == null) {
        var result;
        if (special_problem2.indexOf(question.slice(0, 6)) != -1 && question.slice(18, 25) != -1) question = question.slice(18, 25);
        if (special_problem3.indexOf(question.slice(0, 6)) != -1 && question.slice(6, 12) != -1) question = question.slice(6, 12);
        // 发送http请求获取答案 网站搜题速度 r1 > r2
        try {
            // 此网站只支持十个字符的搜索
            var r1 = http.get("http://www.syiban.com/search/index/init.html?modelid=1&q=" + encodeURI(question.slice(0, 10)));
            result = r1.body.string().match(/答案：.*</);
        } catch (error) {
        }
        // 如果第一个网站没获取到正确答案，则利用第二个网站
        if (!(result && result[0].charCodeAt(3) > 64 && result[0].charCodeAt(3) < 69)) {
            try {
                // 此网站只支持六个字符的搜索
                var r2 = http.get("http://www.syiban.com/search/index/init.html?modelid=1&q=" + encodeURI(question.slice(3, 9)));
                result = r2.body.string().match(/答案：.*</);
            } catch (error) {
            }
        }

        if (result) {
            // 答案文本
            var result = result[0].slice(5, result[0].indexOf("<"));
            log("答案: " + result);
            select_option(result, depth_click_option, options_text);
        } else {
            // 没找到答案，点击第一个
            try {
                className("android.widget.RadioButton").depth(depth_click_option).clickable(true).findOne(delay_time * 3).click();
            } catch (error) {
            }
        }
    } else {
        log("答案: " + answer);
        select_option(answer, depth_click_option, options_text);
    }
}

/*
 ********************答题部分********************
 */

back_track_flag = 2;

// 填空题
function fill_in_blank(answer) {
    // 获取每个空
    var blanks = className("android.view.View").depth(25).find();
    for (var i = 0; i < blanks.length; i++) {
        // 需要点击一下空才能paste
        blanks[i].click();
        setClip(answer[i]);
        blanks[i].paste();
        // 需要缓冲
        sleep(500);
    }
}

/**
 * 视频题
 * @param {string} video_question 视频题问题
 * @returns {string} video_answer 答案
 */
function video_answer_question(video_question) {
    // 找到中文标点符号
    var punctuation_index = video_question.search(/[\u3002|\uff1f|\uff01|\uff0c|\u3001|\uff1b|\uff1a|\u201c|\u201d|\u2018|\u2019|\uff08|\uff09|\u300a|\u300b|\u3008|\u3009|\u3010|\u3011|\u300e|\u300f|\u300c|\u300d|\ufe43|\ufe44|\u3014|\u3015|\u2026|\u2014|\uff5e|\ufe4f|\uffe5]/);
    video_question = video_question.slice(0, Math.max(5, punctuation_index));
    try {
        var video_result = http.get("https://www.365shenghuo.com/?s=" + encodeURI(video_question));
    } catch (error) {
    }
    var video_answer = video_result.body.string().match(/答案：.+</);
    if (video_answer) video_answer = video_answer[0].slice(3, video_answer[0].indexOf("<"));
    return video_answer;
}

/**
 * 用于下面选择题
 * 获取2个字符串的相似度
 * @param {string} str1 字符串1
 * @param {string} str2 字符串2
 * @returns {number} 相似度
 */
function getSimilarity(str1, str2) {
    var sameNum = 0;
    //寻找相同字符
    for (var i = 0; i < str1.length; i++) {
        for (var j = 0; j < str2.length; j++) {
            if (str1[i] === str2[j]) {
                sameNum++;
                break;
            }
        }
    }
    return sameNum / str2.length;
}

// 选择题
function multiple_choice(answer) {
    var whether_selected = false;
    // options数组：下标为i基数时对应着ABCD，下标为偶数时对应着选项i-1(ABCD)的数值
    var options = className("android.view.View").depth(26).find();
    for (var i = 1; i < options.length; i += 2) {
        if (answer.indexOf(options[i].text()) != -1) {
            // 答案正确
            my_click_non_clickable(options[i].text());
            // 设置标志位
            whether_selected = true;
        }
    }
    // 如果这里因为ocr错误没选到一个选项，那么则选择相似度最大的
    if (!whether_selected) {
        var max_similarity = 0;
        var max_similarity_index = 1;
        for (var i = 1; i < options.length; i += 2) {
            var similarity = getSimilarity(options[i].text(), answer);
            if (similarity > max_similarity) {
                max_similarity = similarity;
                max_similarity_index = i;
            }
        }
        my_click_non_clickable(options[max_similarity_index].text());
    }
}

// 多选题是否全选
function is_select_all_choice() {
    // options数组：下标为i基数时对应着ABCD，下标为偶数时对应着选项i-1(ABCD)的数值
    var options = className("android.view.View").depth(26).find();
    // question是题目(专项答题是第4个，其他是第2个)
    var question = className("android.view.View").depth(23).findOnce(1).text().length > 2 ? className("android.view.View").depth(23).findOnce(1).text() : className("android.view.View").depth(23).findOnce(3).text();
    return options.length / 2 <= (question.match(/\s+/g) || []).length;
}

/**
 * 点击对应的模块的 去答题或去看看
 * @param {string} name 模块的名字
 */
function entry_model(name) {
    // 模块列表
    var model_list = className('ListView').depth(23).findOne();
    for (var i = 0; i < model_list.childCount(); i++) {
        var model = model_list.child(i);
        // 获取模块名
        var model_name = model.child(0).text().trim();
        if (name == model_name) break;
    }
    while (!model.child(4).click());
}

/**
 * 如果错误则重新答题
 * 全局变量restart_flag说明:
 * restart_flag = 0时，表示每日答题
 * restart_flag = 1时，表示每周答题
 */
function restart() {
    // 点击退出
    sleep(random_time(delay_time));
    back();
    my_click_clickable("退出");
    switch (restart_flag) {
        case 0:
            text("登录").waitFor();
            sleep(random_time(delay_time / 2));
            entry_model('每日答题');
            break;
        case 1:
            // 设置标志位
            if_restart_flag = true;
            // 等待列表加载
            text("本月").waitFor();
            // 打开第一个出现未作答的题目
            while (!text("未作答").exists()) {
                refresh(true);
            }
            text("未作答").findOne().parent().click();
            break;
    }
}

/*
 ********************调用百度API实现ocr********************
 */

/**
 * 获取用户token
 */
function get_baidu_token() {
    var res = http.post(
        "https://aip.baidubce.com/oauth/2.0/token",
        {
            grant_type: "client_credentials",
            client_id: AK,
            client_secret: SK,
        }
    );
    return res.body.json()["access_token"];
}

if (whether_improve_accuracy == "yes") var token = get_baidu_token();

/**
 * 百度ocr接口，传入图片返回文字和选项文字
 * @param {image} img 传入图片
 * @returns {string} question 文字
 * @returns {list[string]} options_text 选项文字
 */
function baidu_ocr_api(img) {
    var options_text = [];
    var question = "";
    var res = http.post(
        "https://aip.baidubce.com/rest/2.0/ocr/v1/general",
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            access_token: token,
            image: images.toBase64(img),
        }
    );
    var res = res.body.json();
    try {
        var words_list = res.words_result;
    } catch (error) {
    }
    if (words_list) {
        // question是否读取完成的标志位
        var question_flag = false;
        for (var i in words_list) {
            if (!question_flag) {
                // 如果是选项则后面不需要加到question中
                if (words_list[i].words[0] == "A") question_flag = true;
                // 将题目读取到下划线处，如果读到下划线则不需要加到question中
                // 利用location之差判断是否之中有下划线
                /**
                 * location:
                 * 识别到的文字块的区域位置信息，列表形式，
                 * location["left"]表示定位位置的长方形左上顶点的水平坐标
                 * location["top"]表示定位位置的长方形左上顶点的垂直坐标
                 */
                if (words_list[0].words.indexOf(".") != -1 && i > 0 && Math.abs(words_list[i].location["left"] - words_list[i - 1].location["left"]) > 100) question_flag = true;
                if (!question_flag) question += words_list[i].words;
                // 如果question已经大于25了也不需要读取了
                if (question > 25) question_flag = true;
            }
            // 这里不能用else，会漏读一次
            if (question_flag) {
                // 其他的就是选项了
                if (words_list[i].words[1] == ".") options_text.push(words_list[i].words.slice(2));
            }
        }
    }
    // 处理question
    question = question.replace(/\s*/g, "");
    question = question.replace(/,/g, "，");
    question = question.replace(/\-/g, "－");
    question = question.replace(/\(/g, "（");
    question = question.replace(/\)/g, "）");
    question = question.slice(question.indexOf(".") + 1);
    question = question.slice(0, 25);
    return [question, options_text];
}

/**
 * 从ocr.recognize()中提取出题目和选项文字
 * @param {object} object ocr.recongnize()返回的json对象
 * @returns {string} question 文字
 * @returns {list[string]} options_text 选项文字
 * */
function extract_ocr_recognize(object) {
    var options_text = [];
    var question = "";
    var words_list = object.results;
    if (words_list) {
        // question是否读取完成的标志位
        var question_flag = false;
        for (var i in words_list) {
            if (!question_flag) {
                // 如果是选项则后面不需要加到question中
                if (words_list[i].text[0] == "A") question_flag = true;
                // 将题目读取到下划线处，如果读到下划线则不需要加到question中
                // 利用bounds之差判断是否之中有下划线
                /**
                 * bounds:
                 * 识别到的文字块的区域位置信息，列表形式，
                 * bounds.left表示定位位置的长方形左上顶点的水平坐标
                 */
                if (words_list[0].text.indexOf(".") != -1 && i > 0 && Math.abs(words_list[i].bounds.left - words_list[i - 1].bounds.left) > 100) question_flag = true;
                if (!question_flag) question += words_list[i].text;
                // 如果question已经大于25了也不需要读取了
                if (question > 25) question_flag = true;
            }
            // 这里不能用else，会漏读一次
            if (question_flag) {
                // 其他的就是选项了
                if (words_list[i].text[1] == ".") options_text.push(words_list[i].text.slice(2));
                // else则是选项没有读取完全，这是由于hamibot本地ocr比较鸡肋，无法直接ocr完的缘故
                else options_text[options_text.length - 1] = options_text[options_text.length - 1] + words_list[i].text;
            }
        }
    }
    question = ocr_processing(question, true);
    return [question, options_text];
}

/**
 * 本地ocr标点错词处理
 * @param {string} text 需要处理的文本
 * @param {boolean} if_question 是否处理的是问题（四人赛双人对战）
 */
function ocr_processing(text, if_question) {
    // 标点修改
    text = text.replace(/,/g, "，");
    text = text.replace(/\s*/g, "");
    text = text.replace(/_/g, "一");
    text = text.replace(/\-/g, "－");
    text = text.replace(/;/g, "；");
    text = text.replace(/`/g, "、");
    text = text.replace(/\?/g, "？");
    text = text.replace(/:/g, "：");
    text = text.replace(/!/g, "！");
    text = text.replace(/\(/g, "（");
    text = text.replace(/\)/g, "）");
    // 拼音修改
    text = text.replace(/ā/g, "a");
    text = text.replace(/á/g, "a");
    text = text.replace(/ǎ/g, "a");
    text = text.replace(/à/g, "a");
    text = text.replace(/ō/g, "o");
    text = text.replace(/ó/g, "o");
    text = text.replace(/ǒ/g, "o");
    text = text.replace(/ò/g, "o");
    text = text.replace(/ē/g, "e");
    text = text.replace(/é/g, "e");
    text = text.replace(/ě/g, "e");
    text = text.replace(/è/g, "e");
    text = text.replace(/ī/g, "i");
    text = text.replace(/í/g, "i");
    text = text.replace(/ǐ/g, "i");
    text = text.replace(/ì/g, "i");
    text = text.replace(/ū/g, "u");
    text = text.replace(/ú/g, "u");
    text = text.replace(/ǔ/g, "u");
    text = text.replace(/ù/g, "u");

    if (if_question) {
        text = text.slice(text.indexOf(".") + 1);
        text = text.slice(0, 25);
    }
    return text;
}

/**
 * 答题（每日、每周、专项）
 * @param {int} number 需要做题目的数量
 */
function do_periodic_answer(number) {
    // 保证拿满分，如果ocr识别有误而扣分重来
    // flag为true时全对
    var flag = false;
    while (!flag) {
        sleep(random_time(delay_time));
        // 局部变量用于保存答案
        var answer = "";
        var num = 0;
        for (num; num < number; num++) {
            // 下滑到底防止题目过长，选项没有读取到
            refresh(true);
            sleep(random_time(delay_time));

            // 判断是否是全选，这样就不用ocr
            if (textContains("多选题").exists() && is_select_all_choice()) {
                // options数组：下标为i基数时对应着ABCD，下标为偶数时对应着选项i-1(ABCD)的数值
                var options = className("android.view.View").depth(26).find();
                for (var i = 1; i < options.length; i += 2) {
                    my_click_non_clickable(options[i].text());
                }
            } else if (className("android.widget.Image").exists() && text("填空题").exists()) {
                // 如果存在视频题
                var video_question = className("android.view.View").depth(24).findOnce(2).text();
                answer = video_answer_question(video_question);
                if (answer) {
                    fill_in_blank(answer);
                } else {
                    // 如果没搜到答案
                    // 如果是每周答题那么重做也没用就直接跳过
                    if (restart_flag == 1) {
                        fill_in_blank("cao");
                        sleep(random_time(delay_time * 2));
                        if (text("下一题").exists()) click("下一题");
                        if (text("确定").exists()) click("确定");
                        sleep(random_time(delay_time));
                        if (text("完成").exists()) {
                            click("完成");
                            flag = true;
                            break;
                        }
                    } else {
                        restart();
                        break;
                    }
                }
            } else {
                my_click_clickable("查看提示");
                // 打开查看提示的时间
                sleep(2500);
                var img = images.inRange(captureScreen(), "#600000", "#FF6060");
                if (if_restart_flag && whether_improve_accuracy == "yes") {
                    answer = baidu_ocr_api(img)[0];
                } else {
                    try {
                        answer = ocr.recognizeText(img);
                    } catch (error) {
                    }
                }
                sleep(500);
                answer = ocr_processing(answer, false);
                sleep(random_time(delay_time / 2));
                img.recycle();
                text("提示").waitFor();
                back();
                sleep(random_time(delay_time));

                if (textContains("多选题").exists() || textContains("单选题").exists()) {
                    multiple_choice(answer);
                } else {
                    fill_in_blank(answer);
                }
            }
            sleep(random_time(delay_time * 2));

            if (text("下一题").exists()) {
                // 对于专项答题没有确定
                click("下一题");
            } else if (text("完成").exists()) {
                // 如果专项答题完成点击完成
                click("完成");
            } else {
                // 不是专项答题时
                click("确定");
                sleep(random_time(delay_time)); // 等待提交的时间
                // 如果错误（ocr识别有误）则重来
                if (text("下一题").exists() || (text("完成").exists() && !special_flag)) {
                    // 如果没有选择精确答题或视频题错误，则每周答题就不需要重新答
                    if (restart_flag == 1 && (whether_improve_accuracy == "no" || className("android.widget.Image").exists())) {
                        if (text("下一题").exists()) click("下一题");
                        else click("完成");
                    } else {
                        // 每日答题重答
                        restart();
                        break;
                    }
                }
            }
            sleep(random_time(delay_time * 2)); // 每题之间的过渡时间
        }
        if (num == number) flag = true;
    }
}

/**
 * 处理访问异常
 */
function handling_access_exceptions() {
    // 在子线程执行的定时器，如果不用子线程，则无法获取弹出页面的控件
    var thread_handling_access_exceptions = threads.start(function () {
        while (true) {
            textContains("访问异常").waitFor();
            sleep(random_time(delay_time * 2.5));
            // 新版验证暂时采用手动方式，可装学习强国2.22.0无验证
            if (text("拖动滑块直到出现").exists()) {
                // 震动提示
                device.vibrate(200);
                sleep(500);
                device.vibrate(300);
                sleep(random_time(delay_time * 4.5));
            }
            if (textContains("网络开小差").exists()) {
                click("确定");
                continue;
            }
            // 执行脚本只需通过一次验证即可，防止占用资源
            break;
        }
    });
    return thread_handling_access_exceptions;
}

/* 
处理访问异常，滑动验证
*/
var thread_handling_access_exceptions = handling_access_exceptions();

/*
**********每日答题*********
*/
var restart_flag = 0;

if (!finish_dict['每日答题'][0]) {
    sleep(random_time(delay_time));
    if (!className("android.view.View").depth(22).text("学习积分").exists()) back_track();
    entry_model('每日答题');
    // 等待题目加载
    text("查看提示").waitFor();
    do_periodic_answer(5);
    my_click_clickable("返回");
}

/*
 **********每周答题*********
 */
var restart_flag = 1;
// 是否重做过，如果重做，也即错了，则换用精度更高的百度ocr
var if_restart_flag = false;

/*
 **********专项答题*********
 */

/*
 **********挑战答题*********
*/
var date = new Date();
if (date.getDay() == 2 || date.getDay() == 5 || date.getDay() == 0 && !finish_dict['趣味答题'][0]) {
    sleep(random_time(delay_time));

    if (!className("android.view.View").depth(22).text("学习积分").exists()) back_track();
    entry_model('趣味答题');
    // 点击强国总题库
    text("挑战答题").waitFor();
    sleep(random_time(delay_time / 2))
    while (!click("total.88d389ee"));
    // 加载页面
    className("android.view.View").clickable(true).depth(22).waitFor();
    log("挑战答题");
    // flag为true时挑战成功拿到6分
    var flag = false;
    while (!flag) {
        sleep(random_time(delay_time * 3));
        var num = 0;
        while (num < 5) {
            // 每题的过渡
            sleep(random_time(delay_time * 2));
            // 如果答错，第一次立即复活机会
            if (text("立即复活").exists()) {
                num -= 2;
                sleep(random_time(delay_time / 2));
                click("立即复活");
                // 等待题目加载
                sleep(random_time(delay_time * 3));
            }
            // 第二次重新开局
            if (text("再来一局").exists()) {
                sleep(random_time(delay_time / 2));
                my_click_clickable("再来一局");
                break;
            }
            // 题目
            className("android.view.View").depth(25).waitFor();
            var question = className("android.view.View").depth(25).findOne().text();
            // 截取到下划线前
            question = question.slice(0, question.indexOf(" "));
            // 选项文字列表
            var options_text = [];
            // 等待选项加载
            className("android.widget.RadioButton").depth(28).clickable(true).waitFor();
            // 获取所有选项控件，以RadioButton对象为基准，根据UI控件树相对位置寻找选项文字内容
            var options = className("android.widget.RadioButton").depth(28).find();
            // 选项文本
            options.forEach((element, index) => {
                //挑战答题中，选项文字位于RadioButton对象的兄弟对象中
                options_text[index] = element.parent().child(1).text();
            });
            do_contest_answer(28, question, options_text);
            num++;
        }
        sleep(random_time(delay_time * 2));
        if (num == 5 && !text("再来一局").exists() && !text("结束本局").exists()) flag = true;
    }
    // 随意点击直到退出
    do {
        sleep(random_time(delay_time * 2.5));
        className("android.widget.RadioButton").depth(28).findOne().click();
        sleep(random_time(delay_time * 2.5));
    } while (!text("再来一局").exists() && !text("结束本局").exists());
    click("结束本局");
    sleep(random_time(delay_time * 3));    
    back();
    text("挑战答题").waitFor();
    sleep(random_time(delay_time / 2));
    if (text("文学知识").exists()) back();
}

/*
 ********************四人赛、双人对战********************
 */

/**
 * 答四人赛、双人对战API
 */
function do_contest() {
    while (!text("开始").exists());
    while (!text("继续挑战").exists()) {
        // 等待下一题题目加载
        className("android.view.View").depth(28).waitFor();
        var pos = className("android.view.View").depth(28).findOne().bounds();
        if (className("android.view.View").text("        ").exists()) pos = className("android.view.View").text("        ").findOne().bounds();
        do {
            var point = findColor(captureScreen(), "#1B1F25", {
                region: [pos.left, pos.top, pos.width(), pos.height()],
                threshold: 10,
            });
        } while (!point);
        // 等待选项加载
        className("android.widget.RadioButton").depth(32).clickable(true).waitFor();
        var img = images.inRange(captureScreen(), "#000000", "#444444");
        img = images.clip(img, pos.left, pos.top, pos.width(), device.height - pos.top);
        if (whether_improve_accuracy == "yes") {
            var result = baidu_ocr_api(img);
            var question = result[0];
            var options_text = result[1];
        } else {
            try {
                var result = extract_ocr_recognize(ocr.recognize(img));
                var question = result[0];
                var options_text = result[1];
            } catch (error) {
            }
        }
        log("题目: " + question);
        log("选项: " + options_text);
        if (question) do_contest_answer(32, question, options_text);
        else {
            className("android.widget.RadioButton").depth(32).waitFor();
            className("android.widget.RadioButton").depth(32).findOne(delay_time * 3).click();
        }
        // 等待新题目加载
        while (!textMatches(/第\d题/).exists() && !text("继续挑战").exists() && !text("开始").exists());
    }
}

//答错
function do_it() {
    while (!text("开始").exists());
    while (!text("继续挑战").exists()) {
        sleep(random(8000, 12000));
        // 随机选择
        try {
            var options = className("android.widget.RadioButton").depth(32).find();
            var select = random(0, options.length - 1);
            className("android.widget.RadioButton").depth(32).findOnce(select).click();
        } catch (error) {
        }
        while (!textMatches(/第\d题/).exists() && !text("继续挑战").exists() && !text("开始").exists());
    }
}

/*
 **********四人赛*********
 */
var date = new Date();
if (date.getDay() == 1 || date.getDay() == 4 && !finish_dict['趣味答题'][0]) {
    log("四人赛");
    sleep(random_time(delay_time));

    if (!className("android.view.View").depth(22).text("学习积分").exists()) back_track();
    entry_model('趣味答题');

    sleep(random_time(delay_time));
    my_click_clickable("开始比赛");
    do_contest();
    sleep(random_time(delay_time * 2));
    my_click_clickable("继续挑战");
    sleep(random_time(delay_time));
    toast("“四人赛”第2局进入答错模式");
    toast("“四人赛”第2局进入答错模式");
    sleep(random_time(delay_time));
    my_click_clickable("开始比赛");
    toast("“四人赛”第2局进入答错模式");
    toastLog("“四人赛”第2局进入答错模式");
    do_it();

    sleep(random_time(delay_time * 2));
    back();
    sleep(random_time(delay_time));
    back();
}

/*
 **********双人对战*********
 */
var date = new Date();
if (date.getDay() == 3 || date.getDay() == 6 && !finish_dict['趣味答题'][0]) {
    log("双人对战");
    sleep(random_time(delay_time));

    if (!className("android.view.View").depth(22).text("学习积分").exists()) back_track();
    entry_model('趣味答题');

    // 点击随机匹配
    text("随机匹配").waitFor();
    sleep(random_time(delay_time * 2));
    try {
        className("android.view.View").clickable(true).depth(24).findOnce(1).click();
    } catch (error) {
        className("android.view.View").text("").findOne().click();
    }
    do_contest();
    sleep(random_time(delay_time));
    back();
    sleep(random_time(delay_time));
    back();
    my_click_clickable("退出");
}

/*
 **********订阅*********
 */
if (!finish_dict['订阅'][0] && whether_complete_subscription == "yes") {
    sleep(random_time(delay_time));
    if (!className("android.view.View").depth(22).text("学习积分").exists()) back_track();
    entry_model('订阅');
    // 等待加载
    sleep(random_time(delay_time * 2));

    if (!className("android.view.View").desc("强国号\nTab 1 of 2").exists()) {
        toastLog("强国版本v2.34.0及以上不支持订阅功能");
        back();
    } else {
        // 获取第一个订阅按钮位置
        var subscribe_button_pos = className("android.widget.ImageView").clickable(true).depth(16).findOnce(1).bounds();
        // 订阅数
        var num_subscribe = 0;

        // 强国号
        // 创建本地存储，记忆每次遍历起始点
        if (!storage.contains("subscription_strong_country_startup")) {
            storage.put("subscription_strong_country_startup", 0);
        }
        var subscription_strong_country_startup = storage.get("subscription_strong_country_startup");

        for (var i = subscription_strong_country_startup; i < 10; i++) {
            className("android.view.View").clickable(true).depth(15).findOnce(i).click();
            sleep(random_time(delay_time));

            var num_last_swipe = 0;
            while (num_subscribe < 2) {
                // 点击红色的订阅按钮
                do {
                    var subscribe_pos = findColor(captureScreen(), "#E42417", {
                        region: [subscribe_button_pos.left, subscribe_button_pos.top, subscribe_button_pos.width(), device.height - subscribe_button_pos.top],
                        threshold: 10,
                    });
                    if (subscribe_pos) {
                        sleep(random_time(delay_time * 2));
                        click(subscribe_pos.x + subscribe_button_pos.width() / 2, subscribe_pos.y + subscribe_button_pos.height() / 2);
                        num_subscribe++;
                        sleep(random_time(delay_time));
                    }
                } while (subscribe_pos && num_subscribe < 2);
                if (num_subscribe >= 2) break;
                // 通过对比 检测到的已订阅控件 的位置来判断是否滑到底部
                // 滑动前的已订阅控件的位置
                var complete_subscribe_pos1 = findColor(captureScreen(), "#B2B3B7", {
                    region: [subscribe_button_pos.left, subscribe_button_pos.top, subscribe_button_pos.width(), device.height - subscribe_button_pos.top],
                    threshold: 10,
                });

                swipe(device.width / 2, device.height - subscribe_button_pos.top, device.width / 2, subscribe_button_pos.top, random_time(0));
                sleep(random(650, 850));
                // 滑动后的已订阅控件的位置
                var complete_subscribe_pos2 = findColor(captureScreen(), "#B2B3B7", {
                    region: [subscribe_button_pos.left, subscribe_button_pos.top, subscribe_button_pos.width(), device.height - subscribe_button_pos.top],
                    threshold: 10,
                });
                // 如果滑动前后已订阅控件的位置不变则判断滑到底部，再尝试滑动一次           
                if (complete_subscribe_pos1.x == complete_subscribe_pos2.x && complete_subscribe_pos1.y == complete_subscribe_pos2.y) {
                    if (num_last_swipe >= 2) break; 
                    swipe(device.width / 2, device.height - subscribe_button_pos.top, device.width / 2, subscribe_button_pos.top, random_time(0));                    
                    num_last_swipe++;
                    sleep(random_time(delay_time / 2));
                }
            }
            // 更新本地存储值
            if (i > subscription_strong_country_startup) storage.put("subscription_strong_country_startup", i);
            if (num_subscribe >= 2) break;
            sleep(random_time(delay_time));
        }

        // 地方平台
        // 创建本地存储，记忆每次遍历起始点
        if (!storage.contains("subscription_local_platform_startup")) {
            storage.put("subscription_local_platform_startup", 0);
        }
        var subscription_local_platform_startup = storage.get("subscription_local_platform_startup");

        if (num_subscribe < 2) {
            desc("地方平台\nTab 2 of 2").findOne().click();
            sleep(random_time(delay_time));
            for (var i = subscription_local_platform_startup; i < 5; i++) {
                className("android.view.View").clickable(true).depth(15).findOnce(i).click();
                sleep(random_time(delay_time));
                // 刷新次数
                var num_refresh = 0;
                // 定义最大刷新次数
                if (i == 2) var max_num_refresh = 20;
                else var max_num_refresh = 9;
                while (num_subscribe < 2 && num_refresh < max_num_refresh) {
                    do {
                        var subscribe_pos = findColor(captureScreen(), "#E42417", {
                            region: [subscribe_button_pos.left, subscribe_button_pos.top, subscribe_button_pos.width(), device.height - subscribe_button_pos.top],
                            threshold: 10,
                        });
                        if (subscribe_pos) {
                            sleep(random_time(delay_time * 2));
                            click(subscribe_pos.x + subscribe_button_pos.width() / 2, subscribe_pos.y + subscribe_button_pos.height() / 2);
                            num_subscribe++;
                            sleep(random_time(delay_time));
                        }
                    } while (subscribe_pos && num_subscribe < 2);
                    swipe(device.width / 2, device.height - subscribe_button_pos.top, device.width / 2, subscribe_button_pos.top, random_time(0));
                    num_refresh++;
                    sleep(random_time(delay_time / 2));
                }
                if (i > subscription_local_platform_startup) storage.put("subscription_local_platform_startup", i);
                if (num_subscribe >= 2) break;
                sleep(random_time(delay_time));
            }
        }

        // 退回
        className("android.widget.Button").clickable(true).depth(11).findOne().click();
    }
}

/*
 **********发表观点*********
 */
if (!finish_dict['发表观点'][0] && whether_complete_speech == "yes") {
    var speechs = ["风调雨顺，国泰民安！", "大国领袖，高瞻远瞩！", "强国有我，请党放心！", "不忘初心，牢记使命！", "团结一致，共建美好！", "盛世太平，安居乐业！"];
    sleep(random_time(delay_time));
    if (!className("android.view.View").depth(22).text("学习积分").exists()) back_track();
    entry_model('发表观点');
    // 随意找一篇文章
    sleep(random_time(delay_time));
    my_click_clickable("推荐");
    sleep(random_time(delay_time * 2));
    className("android.widget.FrameLayout").clickable(true).depth(22).findOnce(0).click();
    sleep(random_time(delay_time * 2));
    try {
        var comment = text('观点').findOne(3000).parent().parent().child(2).child(1).child(0).text();
    } catch(e) {
        var comment = speechs[random(0, speechs.length - 1)];
    }
    my_click_clickable("欢迎发表你的观点");
    sleep(random_time(delay_time) * 2);
    setText(comment);
    sleep(random_time(delay_time));
    my_click_clickable("发布");
    sleep(random_time(delay_time * 2));
    my_click_clickable("删除");
    sleep(random_time(delay_time));
    my_click_clickable("确认");
}

sleep(random_time(delay_time * 4));
// 回到积分页
var back_track_flag = 2;
back_track();

if (pushplus_token) {
    // 获取今日得分，延时
    sleep(random_time(delay_time));
    // 推送消息
    var getData = send_pushplus();
    var jinri = getData[0];
    var content_str = getData[1];
    var day_check1 = new Date().getDate();//时间校验
    sleep(random_time(delay_time));
    back();
    sleep(random_time(delay_time / 2));
    // 获取账号名
    var account = id("my_display_name").findOne().text();
    sleep(random_time(delay_time / 2));
    // 推送消息(校验是否重复相同内容)
    var push_check = 0;
    if (pushplus_token != token_check0) { storage.put("token_check_storage", pushplus_token); push_check = 1;}
    if (account != account_check0) { storage.put("account_check_storage", account); push_check = 1;}
    if (day_check1 != day_check0) { storage.put("day_check_storage", day_check1); push_check = 1;}
    if (jinri != score_check0) { storage.put("score_check_storage", jinri); push_check = 1;}
    if (push_check) {
        push_weixin_message("Auto学习：" + account + " " + jinri + "积分");
    } else {
        toastLog("不再重复推送，今日已完成");
    }
}

// 尝试成功点击
function real_click(obj) {
    for (let i = 1; i <= 3; i++) {
        if (obj.click()) { return true; }
        sleep(300);
    }
    click(obj.bounds().centerX(), obj.bounds().centerY());
    return false;
}
/**
* 结束学习强国APP
*/
sleep(random_time(delay_time * 2));
var packageName = getPackageName("学习强国");
app.openAppSetting(packageName);
sleep(2000);
text("学习强国").findOne(5000);
sleep(1500);
let stopbb = textMatches(/(强.停止$|.*停止$|结束运行|停止运行|[Ff][Oo][Rr][Cc][Ee] [Ss][Tt][Oo][Pp])/).findOne();
real_click(stopbb);
sleep(1000);
let surebb = textMatches(/(确定|.*停止.*|[Ff][Oo][Rr][Cc][Ee] [Ss][Tt][Oo][Pp]|O[Kk])/).clickable().findOne(1500);
if (!surebb) {
    back();
} else {
    real_click(surebb);
}
sleep(1500);
back();

sleep(random_time(delay_time * 2));
if (new_hami) launch('com.dingdin.dingdio');
else launch('com.hamibot.hamibot');
sleep(random_time(delay_time));
// 取消屏幕唤醒
device.cancelKeepingAwake();
// 恢复媒体音量
device.setMusicVolume(vol);
// 震动半秒(可选项)
if (all_completed_Vibrate == "yes") device.vibrate(500);
toastLog("脚本运行完成");
sleep(random_time(delay_time));
home();
exit();
