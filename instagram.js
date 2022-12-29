import { IgApiClient } from "instagram-private-api";

function zipThreads(records, items) {
  const threads = [];
  for (const r of records) {
    let thread = r;
    for (const i of items) {
      if (i.thread_id === r.threadId) {
        thread = Object.assign(r, i);
      }
    }
    threads.push(thread);
  }
  return threads;
}

class Instagram {
  ig;

  constructor() {
    this.ig = new IgApiClient();
  }

  async login(username, password, proxy = null) {
    this.ig.state.generateDevice(username);
    // await this.ig.simulate.preLoginFlow();
    const me = await this.ig.account.login(username, password);
    // process.nextTick(async () => await this.ig.simulate.postLoginFlow());
    return me;
  }

  async getInbox() {
    const inbox = await this.ig.feed.directInbox();
    const records = await inbox.records();
    const items = await inbox.items();
    return zipThreads(records, items);
  }

  async getPending() {
    const inbox = await this.ig.feed.directPending();
    const items = await inbox.items();
    const records = await inbox.records();
    return zipThreads(items, records);
  }

  async approveAll() {
    const pending = await this.getPending();
    return await this.ig.directThread.approveMultiple(pending.keys());
  }

  async getNotSeenMessages(thread, pk) {
    const lastSeenAt = parseInt(thread.last_seen_at[pk].timestamp);
    return thread.items.filter((x) => parseInt(x.timestamp) > lastSeenAt);
  }
}

export default Instagram;
