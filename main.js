var wait = global.nodemodule['wait-for-stuff'];
var fs = global.nodemodule["fs"];
var path = global.nodemodule["path"];
var wait = global.nodemodule["wait-for-stuff"];

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

var rootpath = path.resolve(__dirname, "..", "CustomAlerts-files");
ensureExists(rootpath);

var defaultConfig = {
	"messages": {
          "whenUserJoin": "Chào mừng {username}",
          "whenUserLeave": "Tạm biệt {username}",
          "whenUserJoinDM": "Chào mừng cậu đã vào nhóm '{groupname}'.\n\nCậu là người dùng thứ {membercount} của nhóm.",
          "whenUserLeaveDM": "Tạm biệt cậu đã ra khỏi nhóm '{groupname}'.\n\nNhóm còn lại {membercount} người dùng.",
	 },
     "help": [
		 "Leave blank the feature you want to turned off",
		 "{username}, {groupname}, {membercount}"
	 ]
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
	
if (msg.type === 'event') {
	switch (msg.logMessageType) {
		case 'log:subscribe':
			msg.logMessageData.addedParticipants.forEach(id => {
				
			var [err, threadInfo] = wait.for.function(data.facebookapi.getThreadInfo, data.msgdata.threadID);
			var userID = id.userFbId;
			
			fb.getUserInfo([userID], (err, userInfo) => {
				
			var userMentions = `@${userInfo[userID].name}`;
			var join = config.messages.whenUserJoin.replace("{username}", userMentions).replace("{groupname}", threadInfo.name).replace("{membercount}", Object.keys(threadInfo.participantIDs).length);
			var joinDM = config.messages.whenUserJoinDM.replace("{username}", userMentions).replace("{groupname}", threadInfo.name).replace("{membercount}", Object.keys(threadInfo.participantIDs).length);
			
			if (userID !== fb.getCurrentUserID()) {

				fb.sendMessage({
					body: `${data.prefix} ${join}`,
					mentions: [{
						tag: userMentions,
						id: userID
					}],
				}, msg.threadID);
			    fb.sendMessage({
					body: `${data.prefix} ${joinDM}`,
					mentions: [{
						tag: userMentions,
						id: userID
					}],
				}, userID);
			}
		  })
		})
		break;
		case 'log:unsubscribe':
			var userID = msg.logMessageData.leftParticipantFbId;
			var [err, threadInfo] = wait.for.function(data.facebookapi.getThreadInfo, data.msgdata.threadID);
			
			fb.getUserInfo([userID], (err, userInfo) => {

			var userMentions = `@${userInfo[userID].name}`;
			var leave = config.messages.whenUserLeave.replace("{username}", userMentions).replace("{groupname}", threadInfo.name).replace("{membercount}", Object.keys(threadInfo.participantIDs).length);
			var leaveDM = config.messages.whenUserLeaveDM.replace("{username}", userMentions).replace("{groupname}", threadInfo.name).replace("{membercount}", Object.keys(threadInfo.participantIDs).length);
			
			if (userID !== fb.getCurrentUserID()) {
				fb.sendMessage({
					body: `${data.prefix} ${leave}`,
					mentions: [{
						tag: userMentions,
						id: userID
					}],
				}, msg.threadID);
			    fb.sendMessage({
					body: `${data.prefix} ${leaveDM}`,
					mentions: [{
						tag: userMentions,
						id: userID
					}],
				}, userID);
		  }
		})
		break;
 }
}
}

module.exports = {
    chathook
};