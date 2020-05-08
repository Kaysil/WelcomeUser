var wait = global.nodemodule['wait-for-stuff'];
var fs = global.nodemodule["fs"];
var path = global.nodemodule["path"];

function ensureExists(path, mask) {
  if (typeof mask != 'number') {
    mask = 0o777;
  }
  try {
    fs.mkdirSync(path, {
      mode: mask,
      recursive: true
    });
    return undefined;
  } catch (ex) {
    return { err: ex };
  }
}

var homeDir = path.resolve(__dirname, "..", "BotTools");
ensureExists(homeDir);

var defaultConfig = {
	"botJoinChangeNickname": true,
	"botLeaveWarning": true,
	"botJoinWarning": true,
	"botJoinNickname": "[{botprefix}] {botname}",
	"botJoinMessage": "!WARNING! ADDED\nTHREAD NAME: {threadname}\nTHREAD ID: {threadid}\n\nUSER NAME: {username}\nUSER ID: {userid}",
	"botLeaveMessage": "!WARNING! KICKED\nTHREAD NAME: {threadname}\nTHREAD ID: {threadid}\n\nUSER NAME: {username}\nUSER ID: {userid}",
	"linkLine": "LINK:\nTHREAD: {threadlink}\nUSER: {userlink}",
	"warnSendID": [
		"100009285954354"
	]
};

if (!fs.existsSync(path.join(homeDir, "config.json"))) {
	fs.writeFileSync(path.join(homeDir, "config.json"), JSON.stringify(defaultConfig, null, 5));
	var config = defaultConfig;
} else {
	var config = JSON.parse(fs.readFileSync(path.join(homeDir, "config.json"), {
		encoding: "utf8"
	}));
}

var chathook = function (type, data) {
	var fb = data.facebookapi;
	var msg = data.msgdata;
	if (msg.type === 'event') {
		switch (msg.logMessageType) {
			case 'log:subscribe':
			  msg.logMessageData.addedParticipants.forEach(id => {
				var [err, threadInfo] = wait.for.function(data.facebookapi.getThreadInfo, data.msgdata.threadID);
				var authorID = data.msgdata.author;
				var threadID = data.msgdata.threadID;
				var userID = id.userFbId;
					if (!config.botJoinWarning) {} else {
						fb.getUserInfo([authorID], (err, userInfo) => {
							if (userID === fb.getCurrentUserID()) {
								setTimeout(function () {
									var str = config.botJoinMessage
									.replace("{username}", userInfo[authorID].name)
									.replace("{threadid}", threadID)
									.replace("{threadname}", threadInfo.name)
									.replace("{userid}", authorID);
									str += `\n\n`;
									str += config.linkLine
									.replace("{threadlink}", "https://facebook.com/messages/t/" +threadID)
									.replace("{userlink}", "https://facebook.com/" +authorID);
									config.warnSendID.forEach(n => {
										data.facebookapi.sendMessage(str, n);
									});
								}, 2000);
							}
						})
					}
					if (userID === fb.getCurrentUserID()) {
				if (!config.botJoinChangeNickname) {} else {
					var str = config.botJoinNickname
					.replace("{botprefix}", global.config.commandPrefix)
					.replace("{botname}", global.config.botname);
					fb.changeNickname(str, threadID, fb.getCurrentUserID());
				}
					};
	})
			break;
			case 'log:unsubscribe':
				var userID = msg.logMessageData.leftParticipantFbId;
				var authorID = data.msgdata.author;
				var threadID = data.msgdata.threadID;
				var [err, threadInfo] = wait.for.function(data.facebookapi.getThreadInfo, data.msgdata.threadID);
					if (!config.botLeaveWarning) {} else {
						fb.getUserInfo([authorID], (err, userInfo) => {
							if (userID === fb.getCurrentUserID()) {
								setTimeout(function () {
								var str = config.botLeaveMessage
								.replace("{username}", userInfo[authorID].name)
								.replace("{threadid}", threadID)
								.replace("{threadname}", threadInfo.name)
								.replace("{userid}", authorID);
								str += `\n\n`;
								str += config.linkLine
								.replace("{threadlink}", "https://facebook.com/messages/t/" +threadID)
								.replace("{userlink}", "https://facebook.com/" +authorID);
								config.warnSendID.forEach(n => {
									data.facebookapi.sendMessage(str, n);
								});
						}, 2000);
					}
				})
			}
			break;
	 }
}
}
module.exports = {
	chathook
}