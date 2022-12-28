const contexts = {};
const timeLimit = 300000; // 5 minutes

function getContext(userId) {
  let context = contexts[userId];
  if (context) {
    context.lastSeen = Date.now();
  }
  return context;
}

function setContext(userId, context) {
  if (!contexts[userId]) {
    contexts[userId] = {};
  }
  Object.assign(contexts[userId], context);
}

function resetContext(userId) {
  delete contexts[userId];
}

function cleanUnactiveContext() {
  const users = Object.keys(contexts);
  users.forEach((userId) => {
    const lastSeen = contexts[userId].lastSeen;
    if (Date.now() - lastSeen - timeLimit >= 0) {
      resetContext(userId);
    }
  });
}

setInterval(cleanUnactiveContext, timeLimit);

export default {
  getContext,
  setContext,
  resetContext,
};
