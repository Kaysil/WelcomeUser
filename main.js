!global.data.CustomAlerts ? global.data.CustomAlerts = {} : "";

var wait = global.nodemodule['wait-for-stuff'];
var fs = global.nodemodule["fs"];
var path = global.nodemodule["path"];

function getFacebookAdmin() {
	var adminArray = global.config.admins.filter(arr => arr.startsWith("FB-"))
		return adminArray;
}

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

var rootpath = path.resolve(__dirname, "..", "CustomAlerts-config");
ensureExists(rootpath);

var defaultConfig = {
	"messages": {
          "whenUserJoin": "Welcome {username}",
          "whenUserLeave": "Goodbye {username}",
		  "when_bot_join_change_nick_name": "[{botprefix}] {botname}",
		  "when_user_add_bot": "User {username} ({userid}) added me into {threadname} ({threadid})",
		  "when_user_kick_bot": "User {username} ({userid}) removed me from {threadname} ({threadid})",
		  "link_line": "[{userlink}, {threadlink}]"
	 }
};

if (!fs.existsSync(path.join(rootpath, "config.json"))) {
	fs.writeFileSync(path.join(rootpath, "config.json"), JSON.stringify(defaultConfig, null, 5));
	var config = defaultConfig;
} else {
	var config = JSON.parse(fs.readFileSync(path.join(rootpath, "config.json"), {
		encoding: "utf8"
	}));
}

var langMap = {
	"en_US": {
		"invalidArgs": "Using: " + global.config.commandPrefix + "cas [message] | reset",
		"notisGroup": "You can using this command here! Try using in the group chat"
	},
	"vi_VN": {
		"invalidArgs": "Sử dụng: " + global.config.commandPrefix + "cas [tin nhắn] | reset",
		"notisGroup": "Bạn không thể dùng lệnh này tại đây! Hãy thử dùng nó trong nhóm"
	}
}

var getLang = function () {}
var onLoad = function (data) {
	var log = data.log;
	getLang = function (langVal, userID) {
	  var lang = global.config.language;
	  if (userID && global.data.userLanguage[userID]) {
		lang = global.data.userLanguage[userID];
		if (!langMap[lang]) {
		  log("Warning: Invalid language: ", lang, `; using ${global.config.language} as fallback...`);
		  lang = global.config.language;
		}
	  }

	  if (langMap[lang]) {
		return String(langMap[lang][langVal]);
	  } else {
		log("Warning: Invalid language: ", lang, "; using en_US as fallback...");
		return String((langMap["en_US"] || {})[langVal]);
	  }
	}
}

var cascmd = function (type, data) {
	if (data.msgdata.isGroup) {
		if (!global.data.CustomAlerts[data.msgdata.threadID]) global.data.CustomAlerts[data.msgdata.threadID] = {};
		var args = data.args;
			args.shift();
		if (!args) {
			data.return({
				handler: "internal",
				data:getLang("invalidArgs", `FB-${data.msgdata.senderID}`)
			})
		}
		var mstr = "";
		switch (args[0].toLowerCase()) {
			case "join":
			case "j":
				mstr = data.args;
				mstr.shift()
				if (mstr === "reset" || mstr === "default") {
					global.data.CustomAlerts[data.msgdata.threadID].join = config.messages.botJoinMessage;
				} else if (mstr === "off") {
					global.data.CustomAlerts[data.msgdata.threadID].join = "off";
				} else {
					global.data.CustomAlerts[data.msgdata.threadID].join = mstr.join(" ");
				}
				break;
			case "leave":
			case "l":
				mstr = data.args;
				mstr.shift()
				if (mstr === "reset" || mstr === "default") {
					global.data.CustomAlerts[data.msgdata.threadID].leave = config.messages.botLeaveMessage;
				} else if (mstr === "off") {
					global.data.CustomAlerts[data.msgdata.threadID].leave = "off";
				} else {
					global.data.CustomAlerts[data.msgdata.threadID].leave = mstr.join(" ");
				}
		}
	} else {
		data.return({
			handler: "internal",
			data: getLang("notisGroup", `FB-${data.msgdata.senderID}`)
		})
	}
}

var chathook = function(type, data) {
	var fb = data.facebookapi;
    var msg = data.msgdata;
	var threadID = msg.threadID;
	var senderID = msg.senderID;
	var str = "";
	
if (msg.type === 'event') {
	switch (msg.logMessageType) {
		case 'log:subscribe':
			msg.logMessageData.addedParticipants.forEach(id => {
				
			var [err, threadInfo] = wait.for.function(data.facebookapi.getThreadInfo, data.msgdata.threadID);
			var userID = id.userFbId;
			
			fb.getUserInfo([userID], (err, userInfo) => {
				var userMentions = `@${userInfo[userID].name}`;
				var join = "";

			if (!global.data.CustomAlerts[msg.threadID].join || global.data.CustomAlerts[msg.threadID].join === "" || global.data.CustomAlerts[msg.threadID].join === config.messages.whenUserJoin) {
				join = data.prefix + " " + config.messages.whenUserJoin.replace("{username}", userMentions).replace("{groupname}", threadInfo.name).replace("{membercount}", Object.keys(threadInfo.participantIDs).length);
			} else if (global.data.CustomAlerts[msg.threadID].join === "off") {
				join = "";
			} else {
				join = data.prefix + " " + global.data.CustomAlerts[msg.threadID].join.replace("{username}", userMentions).replace("{groupname}", threadInfo.name).replace("{membercount}", Object.keys(threadInfo.participantIDs).length);
			}

			if (userID !== fb.getCurrentUserID()) {
				fb.sendMessage({
					body: join,
					mentions: [{
						tag: userMentions,
						id: userID
					}],
				}, msg.threadID);
			} else {
				setTimeout(function () {
					str = config.messages["when_user_add_bot"]
					.replace("{username}", userInfo[authorID].name)
					.replace("{threadid}", threadID)
					.replace("{threadname}", threadInfo.name)
					.replace("{userid}", authorID);
					str += `\n\n`;
					str += config.messages["link_line"]
					.replace("{threadlink}", "https://facebook.com/messages/t/" + threadID)
					.replace("{userlink}", "https://facebook.com/" + authorID);
					getFacebookAdmin().forEach(n => {
						data.facebookapi.sendMessage(str, n.slice(3));
					});

					fb.changeNickname(
						config.messages["when_bot_join_change_nick_name"]
						.replace("{botprefix}", global.config.commandPrefix)
						.replace("{botname}", global.config.botname), threadID, fb.getCurrentUserID()
						);
				}, 2000);
			}
		  })
		})
		break;
		case 'log:unsubscribe':
			var userID = msg.logMessageData.leftParticipantFbId;
			var [err, threadInfo] = wait.for.function(data.facebookapi.getThreadInfo, data.msgdata.threadID);
			
			fb.getUserInfo([userID], (err, userInfo) => {

			var userMentions = `@${userInfo[userID].name}`;
			var leave = "";

			if (!global.data.CustomAlerts[msg.threadID].leave || global.data.CustomAlerts[msg.threadID].leave === "" || global.data.CustomAlerts[msg.threadID].leave === config.messages.whenUserLeave) {
				leave = data.prefix + " " + config.messages.whenUserLeave.replace("{username}", userMentions).replace("{groupname}", threadInfo.name).replace("{membercount}", Object.keys(threadInfo.participantIDs).length);
			} else if (global.data.CustomAlerts[msg.threadID].join === "off") {
				leave = "";
			} else {
				leave = data.prefix + " " + global.data.CustomAlerts[msg.threadID].leave.replace("{username}", userMentions).replace("{groupname}", threadInfo.name).replace("{membercount}", Object.keys(threadInfo.participantIDs).length);
			}

			if (userID !== fb.getCurrentUserID()) {
				fb.sendMessage({
					body: `${data.prefix} ${leave}`,
					mentions: [{
						tag: userMentions,
						id: userID
					}],
				}, msg.threadID);
		  } else {
			setTimeout(function () {
				str = config.messages["when_user_kick_bot"]
				.replace("{username}", userInfo[authorID].name)
				.replace("{threadid}", threadID)
				.replace("{threadname}", threadInfo.name)
				.replace("{userid}", authorID);
				str += `\n\n`;
				str += config.messages["link_line"]
				.replace("{threadlink}", "https://facebook.com/messages/t/" +threadID)
				.replace("{userlink}", "https://facebook.com/" +authorID);
				getFacebookAdmin().forEach(n => {
					data.facebookapi.sendMessage(str, n.slice(3));
				});
			}, 2000);
		  }
		})
		break;
 }
}
}

module.exports = {
	chathook,
	cascmd,
	onLoad
};