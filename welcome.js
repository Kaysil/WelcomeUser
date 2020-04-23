var wait = global.nodemodule['wait-for-stuff'];
var chathook = function(type, data){
	var fb = data.facebookapi;
    var msg = data.msgdata;
	
if (msg.type === 'event') {
	switch (msg.logMessageType) {
		case 'log:subscribe':
		msg.logMessageData.addedParticipants.forEach(id => {
			var [err, threadInfo] = wait.for.function(data.facebookapi.getThreadInfo, data.msgdata.threadID);
			var userID = id.userFbId;
		fb.getUserInfo([userID], (err, userInfo) => {
			data.log(threadInfo.participantIDs);
			data.log(Object.keys(threadInfo.participantIDs).length);
			if (err) return {handler: `internal`, data: `Lỗi không xác định`};
			if (userID !== fb.getCurrentUserID()) { 
			    data.return({handler: `internal-raw`, data: {body: `Chào mừng @${userInfo[userID].name}`, mentions: [{tag: `@${userInfo[userID].name}`, id: userID}]}});
			    fb.sendMessage(`[Welcome] Chào mừng bạn đã đến với nhóm chat ${threadInfo.name}, bạn là người dùng thứ ${Object.keys(threadInfo.participantIDs).length} của nhóm`, userID);
			}
			if (userID === fb.getCurrentUserID()) return fb.changeNickname(`[ ${global.config.commandPrefix} ] ${global.config.botname}`, msg.threadID, userID);
			})
		})
		break;
		case 'log:unsubscribe':
		    var [err, threadInfo] = wait.for.function(data.facebookapi.getThreadInfo, data.msgdata.threadID);
			var userID = msg.logMessageData.leftParticipantFbId;
		fb.getUserInfo([userID], (err, userInfo) => {
			if (userID !== fb.getCurrentUserID()) {
			    data.return({handler: `internal-raw`, data: {body: `\r\nTạm biệt @${userInfo[userID].name}.`, mentions: [{tag: `@${userInfo[userID].name}`, id: userID}]}});
			    fb.sendMessage(`[Goodbye] Tạm biệt bạn đã rời khỏi nhóm ${threadInfo.name}, nhóm còn lại ${Object.keys(threadInfo.participantIDs).length} người dùng`, userID);
			}
		})
		break;
 }
}
}

module.exports = {
    chathook
};