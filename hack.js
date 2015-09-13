var request = require('request');
var chalk = require('chalk');
var async = require('async');
request = request.defaults({jar:true});

var HOST = 'http://www.jppt.com.cn';
var LOGIN_URL = '/xmpublic/student/loginSubmit.do?area=3502&type=';
var LOGOUT_URL = '/xmpublic/student/logout.do?area=3502';

var START_TRAIN_URL = '/xmpublic/student/loginSerialNum.do';
var VIP_LOGIN = '/xmllvip/loginSerialNum.do';
var END_TRAIN_URL = '/xmllvip/endTrain.do';
var AUTO_SAVE_URL = '/xmllvip/autoSave.do';

//chalk color theme;
var error = chalk.bold.red;
var info = chalk.yellow;
var progress = chalk.green;

//help info.
if(process.argv[2] == '-h' || process.argv[2] === '--help'){
    console.log(chalk.bold.green('node hack.js [username] [password] [execute hour]'));
    process.exit();
}

//execute info.
var exeTotalTime = process.argv[4]?process.argv[4]:3;
if(typeof exeTotalTime != "number"){
    console.log('execute time has to be a number(argument[3]).');
} else {
    console.log('The program will run for ' + exeTotalTime + ' hour.');
}



var totalExeTimes = exeTotalTime * 60
var exeInterval = 60 * 1000;
var exeTimes = 0;
var intervalId;

//login info.
var username = process.argv[2] ? process.argv[2] : '659001199108285711';
var password = process.argv[3] ? process.argv[3] : 'beyourself';
var loginForm = {
    identifyType: 1,
    identifyNum: username,
    password: password
};

var saveForm = {
    isTotalFirstMsg: true
};

console.log(chalk.green('Ready to login use username: ' + username));
request.post({url: HOST + LOGIN_URL, form: loginForm}, function (err, res, body) {
    if (err) {
        console.log(error(err));
    } else {
        //错误存放在了body体中，如果body为空则正确。
        if (body) {
            console.log(error('Login error: ' + body));
        } else {
            console.log(progress('Login success!'));
            console.log(progress('Tring to login training system...'));
            request.post({url: HOST + START_TRAIN_URL}, function (err, res, body) {
                var body = body.replace(/\'/g,'"');
                body = JSON.parse(body);
                var vipLoginForm = {
                    cardNumber: body.cardNumber,
                    studentId: body.studentId,
                    url: 'http://Fwww.jppt.com.cn/xmllvip/book/bookList.do'
                };
                request.post({url: HOST + VIP_LOGIN, form: vipLoginForm}, function(err, res, body){
                    if(err){
                        console.log(err);
                    }

                    console.log(progress('Login training system successful!'));
                    var t = this;
                    //捕获ctrl +C 退出学时系统。
                    process.on('SIGINT', function () {
                        console.log("Caught interrupt signal");
                        request.post({url: HOST + END_TRAIN_URL}, function (err, res, body) {
                            if (body.result == 0) {
                                console.log("Exit successfully.");
                                process.exit();
                            } else {
                                console.log(body);
                                console.error('Oops, please try again.');
                                process.exit();
                            }
                        });
                    });
                    intervalId = setInterval(function () {
                        if (exeTimes > totalExeTimes) {
                            clearInterval(intervalId);
                            request.post({url: HOST + END_TRAIN_URL}, function (err, res, body) {
                                if (body && body.result == 0) {
                                    console.log(chalk.info('end train success!'));
                                } else {
                                    console.log(body);
                                }
                            })
                        } else {
                            request.post({
                                url: HOST + AUTO_SAVE_URL,
                                form: saveForm
                            }, function (err, res, body) {
                                if (body && JSON.parse(body).result == 0) {
                                    exeTimes++;
                                    console.log(info('save success! ' + exeTimes));
                                } else {
                                    console.log(body);
                                    console.log(info('Save time failed.'));
                                }
                            })
                        }
                    }, exeInterval)
                })
            });
        }
    }
});
