const queue: any[] = [];

let isFlushingPending = false;

// 推入微任务队列
// 等同步任务执行完了，再执行微任务

export function nextTick(fn) {
  return fn ? Promise.resolve().then(fn) : Promise.resolve();
}

export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
    queueFlush();
  }
}

function queueFlush() {
  if (isFlushingPending) return;
  isFlushingPending = true;
  nextTick(flushJobs);
}

function flushJobs() {
  isFlushingPending = false;
  let job;
  while ((job = queue.shift())) {
    job && job();
  }
}
