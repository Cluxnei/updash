/* eslint-disable camelcase */
const { default: axios } = require('axios');
const {
  _select, _insert, _update, _query, SOFT_DELETES_WHERE, _lastInsertId,
} = require('./database/connection');
const { currentTimestamp, isToday, log } = require('./helpers');

const MINIMUM_HEARTBEATS_COUNT = 11;
const FIXED_MONITOR_TIMEOUT = 2000;
const HEART_BEATS_LIMIT = 100;

function monitorFactory(maxHeartbeatInterval = 60) {
  const randomUrls = [
    'https://www.google.com',
    'https://www.youtube.com',
    'https://www.facebook.com',
    'https://www.instagram.com',
    'https://www.twitter.com',
    'https://www.github.com',
    'https://www.linkedin.com',
    'https://www.pinterest.com',
    'https://www.reddit.com',
    'https://www.quora.com',
    'https://www.wikipedia.org',
    'https://www.amazon.com',
    'https://www.ebay.com',
    'https://www.twitch.tv',
    'https://www.netflix.com',
    'https://www.imdb.com',
    'https://www.spotify.com',
    `${process.env.SERVER_URL}:${process.env.SERVER_PORT}`,
  ];
  const url = randomUrls[Math.floor(Math.random() * randomUrls.length)];
  let name = url.split('://')[1].split('.')[0];
  if (url.includes('www')) {
    const [_name] = url.split('www.')[1].split('.');
    name = _name;
  }
  return {
    name,
    url,
    heart_beat_interval: Math.max(10, Math.floor(Math.random() * maxHeartbeatInterval)),
  };
}

function fillHeartbeatsData(heartbeats) {
  const mapper = (hb) => {
    if (hb.isEmpty) {
      return hb;
    }
    const heartbeat = { ...hb };
    heartbeat.color = heartbeat.is_failed ? 'red' : 'green';
    const time = new Date(heartbeat.created_at);
    const day = isToday(time) ? 'today' : `${time.getDate()}/${time.getMonth() + 1}/${time.getFullYear().toString().substring(2)}`;
    heartbeat.label_time = `${day} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
    return heartbeat;
  };
  if (heartbeats.length < MINIMUM_HEARTBEATS_COUNT) {
    const emptyHeartbeatsToCreate = MINIMUM_HEARTBEATS_COUNT - heartbeats.length;
    const emptyHeartbeats = [];
    for (let i = 0; i < emptyHeartbeatsToCreate; i += 1) {
      emptyHeartbeats.push({
        isEmpty: true,
        color: 'gray',
      });
    }
    return [...emptyHeartbeats, ...heartbeats].map(mapper);
  }
  return heartbeats.map(mapper);
}

function fillTagsData(tags) {
  return tags;
}

function uptimeColorByPercentage(uptimePercentage) {
  if (uptimePercentage >= 98) {
    return 'white';
  }
  if (uptimePercentage >= 90) {
    return 'yellow';
  }
  if (uptimePercentage >= 80) {
    return 'orange';
  }
  if (uptimePercentage >= 70) {
    return 'red';
  }
  return 'black';
}

async function fillMonitorData(m) {
  const monitor = { ...m };
  const [
    heartbeats,
    tags,
    [{ uptime_percentage }],
    [{ uptime_percentage_last_24_hours }],
    [{ response_time_avg_all_time }],
    [{ response_time_avg_last_24_hours }],
  ] = await Promise.all([
    _select(['*'], 'monitor_heart_beats', `${SOFT_DELETES_WHERE} AND monitor_id = ?`, [monitor.id], 'created_at DESC', HEART_BEATS_LIMIT),
    _select(['t.*'], 'tags t,monitor_tags mt', `t.${SOFT_DELETES_WHERE} AND mt.tag_id = t.id AND mt.monitor_id = ?`, [monitor.id]),
    _query(
      `SELECT (
                (
                    (SELECT COUNT(id) FROM monitor_heart_beats WHERE ${SOFT_DELETES_WHERE} AND monitor_id = ? AND is_failed = 0)
                    /
                    (SELECT COUNT(id) FROM monitor_heart_beats WHERE ${SOFT_DELETES_WHERE} AND monitor_id = ?)
                ) * 100
            ) as uptime_percentage`,
      [monitor.id, monitor.id],
    ),
    _query(
      `SELECT (
                (
                    (SELECT COUNT(id) FROM monitor_heart_beats WHERE ${SOFT_DELETES_WHERE} AND monitor_id = ? AND is_failed = 0 AND created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 24 hour))
                    /
                    (SELECT COUNT(id) FROM monitor_heart_beats WHERE ${SOFT_DELETES_WHERE} AND monitor_id = ? AND created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 24 hour))
                ) * 100
            ) as uptime_percentage_last_24_hours`,
      [monitor.id, monitor.id],
    ),
    _select(['AVG(response_time) as response_time_avg_all_time'], 'monitor_heart_beats', `${SOFT_DELETES_WHERE} AND monitor_id = ?`, [monitor.id]),
    _select(['AVG(response_time) as response_time_avg_last_24_hours'], 'monitor_heart_beats', `${SOFT_DELETES_WHERE} AND monitor_id = ? AND created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 24 hour)`, [monitor.id]),
  ]);
  monitor.tags = fillTagsData(tags);
  monitor.heartbeats = fillHeartbeatsData(heartbeats);
  const zeroSafa = (n) => (n === null || typeof n === 'undefined' ? 0 : n);
  monitor.response_times = {
    current: zeroSafa(heartbeats[0]?.response_time),
    avg: {
      all_time: zeroSafa(response_time_avg_all_time),
      last_24_hours: zeroSafa(response_time_avg_last_24_hours),
    },
    uptime: {
      all_time: zeroSafa(uptime_percentage),
      all_time_text_color: uptimeColorByPercentage(zeroSafa(uptime_percentage)),
      last_24_hours: zeroSafa(uptime_percentage_last_24_hours),
      last_24_hours_text_color: uptimeColorByPercentage(zeroSafa(uptime_percentage_last_24_hours)),
    },
  };
  monitor.uptime_percentage = zeroSafa(uptime_percentage);
  monitor.uptime_color = monitor.status === 'up' ? 'green' : 'red';
  monitor.status_color = monitor.status === 'down' ? 'red' : 'green';
  return monitor;
}

async function fillMonitorsData(_monitors) {
  const monitors = [..._monitors];
  const promises = [];
  monitors.forEach((monitor, index) => {
    const promise = fillMonitorData(monitor).then((filledMonitor) => {
      monitors[index] = filledMonitor;
    });
    promises.push(promise);
  });
  await Promise.all(promises);
  return monitors;
}

async function getMonitors(user) {
  const monitors = await _select(['*'], 'monitors', `${SOFT_DELETES_WHERE} AND owner_id = ?`, [user.id]);
  log({ id: 'monitor.js' }, `Got ${monitors.length} monitors`);
  return fillMonitorsData(monitors);
}

async function handleGetMonitors(socket, {__user}) {
  socket.emit('monitors-list', await getMonitors(__user));
}

async function handlePauseMonitor(socket, {__user, monitorId}) {
  const [monitor] = await _select(['owner_id'], 'monitors', `${SOFT_DELETES_WHERE} AND id = ?`, [monitorId], null, 1);
  if (__user.id !== monitor.owner_id) {
    socket.emit('error-message', {
      message: 'You are not the owner of this monitor',
    });
    return;
  }
  await _update('monitors', { is_paused: 1, updated_at: currentTimestamp() }, 'id = ?', [monitorId]);
  socket.emit('monitor-paused', {
    id: monitorId,
    is_paused: true,
  });
}

async function handleResumeMonitor(socket, {__user, monitorId}) {
  const [monitor] = await _select(['owner_id'], 'monitors', `${SOFT_DELETES_WHERE} AND id = ?`, [monitorId], null, 1);
  if (__user.id !== monitor.owner_id) {
    socket.emit('error-message', {
      message: 'You are not the owner of this monitor',
    });
    return;
  }
  await _update('monitors', { is_paused: 0, updated_at: currentTimestamp() }, 'id = ?', [monitorId]);
  socket.emit('monitor-resumed', {
    id: monitorId,
    is_paused: false,
  });
}

async function handleDeleteMonitor(socket, {__user, monitorId}) {
  const [monitor] = await _select(['owner_id'], 'monitors', `${SOFT_DELETES_WHERE} AND id = ?`, [monitorId], null, 1);
  if (__user.id !== monitor.owner_id) {
    socket.emit('error-message', {
      message: 'You are not the owner of this monitor',
    });
    return;
  }
  const timestamp = currentTimestamp();
  await _update('monitors', { deleted_at: timestamp, updated_at: timestamp }, 'id = ?', [monitorId]);
  socket.emit('monitor-deleted', {
    id: monitorId,
    deleted_at: timestamp,
  });
}

async function handleCreateMonitor(socket, {__user, monitor}) {
  await _insert('monitors', {
    ...monitor,
    owner_id: __user.id,
  });
  const lastInsertId = await _lastInsertId();
  // const freshMonitor = await _select(['*'], 'monitors', `${SOFT_DELETES_WHERE} AND id = ?`, [lastInsertId], null, 1);
  // const filledMonitor = await fillMonitorData(freshMonitor);
  socket.emit('monitor-created', {monitorId: lastInsertId});
}

async function handleEditMonitor(socket, {monitor}) {
  await _update('monitors', {
    ...monitor,
    updated_at: currentTimestamp(),
  }, 'id = ?', [monitor.id]);
  socket.emit('monitor-edited');
}

async function computeMonitorStatus(monitor) {
  const lastHeartbeats = await _select(['is_failed'], 'monitor_heart_beats', `${SOFT_DELETES_WHERE} AND monitor_id = ?`, [monitor.id], 'created_at DESC', monitor.min_fail_attemps_to_down);
  const lastHeartbeatsFailed = lastHeartbeats.filter((heartbeat) => heartbeat.is_failed);
  if (lastHeartbeatsFailed.length === monitor.min_fail_attemps_to_down) {
    return 'down';
  }
  return 'up';
}

function resolveFailedErrorToText(error) {
  if (error.code === 'ENOTFOUND') {
    return 'Not found';
  }
  if (error.code === 'ECONNREFUSED') {
    return 'Connection refused';
  }
  if (error.code === 'ETIMEDOUT') {
    return 'Timed out';
  }
  return error.code;
}

async function runMonitor(broadcastSocket, _monitor) {
  const monitor = { ..._monitor };
  log({ id: 'monitor.js' }, `Running monitor ${monitor.id}`);
  const startTime = Date.now();
  const getResponseTime = () => Date.now() - startTime;
  const safeString = (value) => {
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }
    return JSON.stringify(value);
  };
  let hbStatus = null;
  let isFailed = false;
  try {
    const response = await axios.call(monitor.method, monitor.url, {
      timeout: FIXED_MONITOR_TIMEOUT,
      validateStatus: (status) => (
        status >= monitor.min_acceptable_status_code && status <= monitor.max_acceptable_status_code
      ),
      maxRedirects: monitor.max_redirects,
      headers: monitor.headers ? JSON.parse(monitor.headers) : {},
      data: monitor.body ? JSON.parse(monitor.body) : {},
    });
    await _insert('monitor_heart_beats', {
      monitor_id: monitor.id,
      status_code: response.status,
      response_time: getResponseTime(),
      is_failed: false,
      response: safeString(response.data),
    });
    hbStatus = response.status;
  } catch (err) {
    if (err.response) {
      await _insert('monitor_heart_beats', {
        monitor_id: monitor.id,
        status_code: err.response.status,
        response_time: getResponseTime(),
        is_failed: true,
        response: err.response.data,
      });
      hbStatus = err.response.status;
      isFailed = true;
      log({ id: 'monitor.js' }, `Monitor ${monitor.id} failed with status ${err.response.status}`);
      return;
    }
    if (err.isAxiosError) {
      await _insert('monitor_heart_beats', {
        monitor_id: monitor.id,
        status_code: null,
        response_time: getResponseTime(),
        is_failed: true,
      });
      hbStatus = resolveFailedErrorToText(err);
      isFailed = true;
      log({ id: 'monitor.js' }, `Monitor ${monitor.id} failed with timeout`);
      return;
    }
    throw err;
  } finally {
    const status = await computeMonitorStatus(monitor);
    const timestamp = currentTimestamp();
    await _update('monitors', { runned_at: timestamp, updated_at: timestamp, status }, 'id = ?', [monitor.id]);
    monitor.runned_at = timestamp;
    monitor.updated_at = timestamp;
    monitor.status = status;
    broadcastSocket.emit('monitor-runned', {
      monitor_id: monitor.id,
      monitor: await fillMonitorData(monitor),
      hbStatus,
      isFailed,
    });
  }
}

async function handleMonitorsThread(broadcastSocket) {
  const monitorsToRun = await _select(
    [
      '*',
      'UNIX_TIMESTAMP(CURRENT_TIMESTAMP) - UNIX_TIMESTAMP(runned_at) as runned_seconds_ago',
    ],
    'monitors',
    `${SOFT_DELETES_WHERE} AND is_paused = 0 AND (runned_at IS NULL OR (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) - UNIX_TIMESTAMP(runned_at)) >= heart_beat_interval)`,
  );
  log({ id: 'monitor.js' }, `Got ${monitorsToRun.length} monitors to run`, monitorsToRun);
  const promises = [];
  monitorsToRun.forEach((monitor) => {
    promises.push(runMonitor(broadcastSocket, monitor));
  });
  await Promise.all(promises);
}

module.exports = {
  monitorFactory,
  getMonitors,
  handleGetMonitors,
  handleMonitorsThread,
  handlePauseMonitor,
  handleResumeMonitor,
  handleDeleteMonitor,
  handleCreateMonitor,
  handleEditMonitor,
};
