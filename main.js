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
		  "link_line": "{userlink}\n{threadlink}"
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

var chathook = function(type, data) {
	var fb = data.facebookapi;
    var msg = data.msgdata;
	var threadID = msg.threadID;
	var senderID = msg.senderID;
	var str = "";
	
if (msg.type === 'event') {
	switch (msg.logMessageType) {
		case 'log:subscribe':
			msg.logMessageData.addedParticipants.forEach(user => {
				
			var [err, threadInfo] = wait.for.function(data.facebookapi.getThreadInfo, data.msgdata.threadID);
			var userID = user.userFbId;
			var authorID = msg.author;
			
			fb.getUserInfo([userID, authorID], (err, userInfo) => {
				if (err) data.log(err);
				
				var userMentions = `@${userInfo[userID].name}`;
				var join = data.prefix + " " + config.messages.whenUserJoin
				.replace("{username}", userMentions)
				.replace("{groupname}", threadInfo.name)
				.replace("{membercount}", Object.keys(threadInfo.participantIDs).length);

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
			var authorID = msg.author;
			var [err, threadInfo] = wait.for.function(data.facebookapi.getThreadInfo, data.msgdata.threadID);
			
			fb.getUserInfo([userID, authorID], (err, userInfo) => {
				if (err) data.log(err);
				
			var userMentions = `@${userInfo[userID].name}`;
			var leave = data.prefix + " " + config.messages.whenUserLeave
			.replace("{username}", userMentions)
			.replace("{groupname}", threadInfo.name)
			.replace("{membercount}", Object.keys(threadInfo.participantIDs).length);

			if (userID !== fb.getCurrentUserID()) {
				fb.sendMessage({
					body: leave,
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
				.replace("{threadlink}", "https://facebook.com/messages/t/" + threadID)
				.replace("{userlink}", "https://facebook.com/" + authorID);
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
	chathook
};