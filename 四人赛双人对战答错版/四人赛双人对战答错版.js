// 检查无障碍服务是否已经启用
auto.waitFor();

/**
 * 获取配置参数及本地存储数据
 */
// 基础数据
var { four_player_battle } = hamibot.env;
var { two_player_battle } = hamibot.env;
var { four_player_count } = hamibot.env;
var { two_player_count } = hamibot.env;
var { contest_delay_time } = hamibot.env;
var { all_completed_Vibrate } = hamibot.env;
var { stop_app2 } = hamibot.env;
var delay_time = 1000;
four_player_count = Number(four_player_count);
two_player_count = Number(two_player_count);
contest_delay_time = Number(contest_delay_time) * 1000;

/**
 * 模拟随机时间
 * @param {int} time 时间
 * @return {int} 随机后的时间值
 */
function random_time(time) {
    return time + random(100, 1000);
}

sleep(random_time(delay_time));
launch('com.hamibot.hamibot');
textMatches(/Hamibot|日志/).waitFor();
toastLog("答错脚本正在运行");
sleep(random_time(delay_time));

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
 * 点击对应的模块的 去答题
 * @param {string} name 模块的名字
 */
function entry_model(name) {
    sleep(random_time(delay_time * 2));
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
 * 如果因为某种不知道的bug退出了界面，则使其回到正轨
 */
function back_track() {
    do {
        app.launchApp("学习强国");
        sleep(random_time(delay_time * 5));
        var while_count = 0;
        while (!id("comm_head_title").exists() && while_count < 5) {
            while_count++;
            back();
            sleep(random_time(delay_time));
        }
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
    // 当由于未知原因退出学习强国，则重新执行
    } while (!className("FrameLayout").packageName("cn.xuexi.android").exists());
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

//答错
function do_it() {
    while (!text("开始").exists());
    while (!text("继续挑战").exists()) {
        sleep(random_time(contest_delay_time));
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
if (four_player_battle == "yes") {
    sleep(random_time(delay_time));

    if (!className("android.view.View").depth(22).text("学习积分").exists()) back_track();
    entry_model("四人赛");

    for (var i = 0; i < four_player_count; i++) {
        sleep(random_time(delay_time));
        my_click_clickable("开始比赛");
        do_it();
        if (i < four_player_count - 1) {
            sleep(random_time(delay_time));
            while (!click("继续挑战"));
            sleep(random_time(delay_time));
        }
    }
    sleep(random_time(delay_time * 2));
    back();
    sleep(random_time(delay_time));
    back();
}

/*
**********双人对战*********
*/
if (two_player_battle == "yes") {
    sleep(random_time(delay_time));

    if (!className("android.view.View").depth(22).text("学习积分").exists()) back_track();
    entry_model("双人对战");

    for (var i = 0; i < two_player_count; i++) {
        // 点击随机匹配
        text("随机匹配").waitFor();
        sleep(random_time(delay_time * 2));
        try {
            className("android.view.View").clickable(true).depth(24).findOnce(1).click();
        } catch (error) {
            className("android.view.View").text("").findOne().click();
        }
        do_it();
        sleep(random_time(delay_time));
        if (i < two_player_count - 1) {
            sleep(random_time(delay_time));
            while (!click("继续挑战"));
            sleep(random_time(delay_time));
        }
    }
    sleep(random_time(delay_time));
    back();
    sleep(random_time(delay_time));
    back();
    my_click_clickable("退出");
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
if (stop_app2) {
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
    launch('com.hamibot.hamibot');
    sleep(random_time(delay_time));
}

// 震动半秒(可选项)
if (all_completed_Vibrate == "yes") device.vibrate(500);
toastLog("脚本运行完成");
sleep(random_time(delay_time));
if (stop_app2) home();
exit();
