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

var rootpath = path.resolve(__dirname, "..", "CustomAlerts-config");
ensureExists(rootpath);

var defaultConfig = {
	"messages": {
          "userJoin": "Welcome {username}",
          "userLeave": "Goodbye {username}",
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

var chathook = async function(type, data) {
	var fb = data.facebookapi;
    var msg = data.msgdata;
	var threadID = msg.threadID;
	var senderID = msg.senderID;
	var str = "";
	
	if (msg.type === 'event') {
		switch (msg.logMessageType) {
			case 'log:subscribe':
				for (var user of msg.logMessageData.addedParticipants) {
					var threadInfo = await fb.getThreadInfo(msg.threadID);
					var userID = user.userFbId;
					var authorID = msg.author;
					var userInfo = await fb.getUserInfo([userID, authorID]);
					var userMentions = `@${userInfo[userID].name}`;
					var join = data.prefix + " " + config.messages.userJoin
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
					}
				};
			break;
			case 'log:unsubscribe':
				var userID = msg.logMessageData.leftParticipantFbId;
				var authorID = msg.author;
				var threadInfo = await fb.getThreadInfo(msg.threadID);
				var userInfo = await fb.getUserInfo([userID, authorID]);
				var userMentions = `@${userInfo[userID].name}`;
				var leave = data.prefix + " " + config.messages.userLeave
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
				}
			break;
		}
	}
}

module.exports = {
	chathook
};