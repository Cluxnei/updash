const { default: axios } = require("axios");
const { _select, _insert, _update, _query } = require("./database/connection");
const { log, currentTimestamp, isToday } = require("./helpers");

const MINIMUM_HEARTBEATS_COUNT = 10;
const FIXED_MONITOR_TIMEOUT = 2000;
const MINIMUM_UPTIME_PERCENTAGE_TO_GREEN = 95;
const HEART_BEATS_LIMIT = 100;

function monitorFactory(max_heart_beat_interval = 60) {
    return {
        name: 'Monitor name',
        url: `${process.env.SERVER_URL}:${process.env.SERVER_PORT}`,
        heart_beat_interval: Math.max(10, Math.floor(Math.random() * max_heart_beat_interval)),
    };
}

function fillHeartbeatsData(heartbeats) {
    const mapper = heartbeat => {
        if (heartbeat.isEmpty) {
            return heartbeat;
        }
        heartbeat.color = heartbeat.is_failed ? 'red' : 'green';
        const time = new Date(heartbeat.created_at);
        const day = isToday(time) ? 'today' : `${time.getDate()}/${time.getMonth() + 1}/${time.getFullYear().toString().substring(2)}`;
        heartbeat.label_time = `${day} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`;
        return heartbeat;
    };
    if (heartbeats.length < MINIMUM_HEARTBEATS_COUNT) {
        const emptyHeartbeatsToCreate = MINIMUM_HEARTBEATS_COUNT - heartbeats.length;
        const emptyHeartbeats = [];
        for (let i = 0; i < emptyHeartbeatsToCreate; i++) {
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

async function fillMonitorData(monitor) {
    const [heartbeats, tags, [{uptime_percentage}], [{response_time_avg_all_time}]] = await Promise.all([
        _select(['*'], 'monitor_heart_beats', `monitor_id = ?`, [monitor.id], 'created_at DESC', HEART_BEATS_LIMIT),
        _select(['*'], 'monitor_tags', `monitor_id = ?`, [monitor.id]),
        _query(
            `SELECT (
                (
                    (SELECT COUNT(id) FROM monitor_heart_beats WHERE monitor_id = ? AND is_failed = 0)
                    /
                    (SELECT COUNT(id) FROM monitor_heart_beats WHERE monitor_id = ?)
                ) * 100
            ) as uptime_percentage`,
            [monitor.id, monitor.id]
        ),
        _select(['AVG(response_time) as response_time_avg_all_time'], 'monitor_heart_beats', 'monitor_id = ?', [monitor.id]),
    ]);
    monitor.tags = fillTagsData(tags);
    monitor.heartbeats = fillHeartbeatsData(heartbeats);
    monitor.response_times = {
        current: heartbeats[0]?.response_time,
        avg: {
            all_time: response_time_avg_all_time,
        },
        uptime: {
            all_time: uptime_percentage,
        },
    };
    monitor.uptime_percentage = uptime_percentage;
    monitor.uptime_color = monitor.uptime_percentage > MINIMUM_UPTIME_PERCENTAGE_TO_GREEN ? 'green' : 'red';
    monitor.status_color = monitor.status === 'down' ? 'red' : 'green';
    return monitor;
}

async function fillMonitorsData(monitors) {
    const promises = [];
    monitors.forEach((monitor, index) => {
        const promise = fillMonitorData(monitor).then(filledMonitor => {
            monitors[index] = filledMonitor;
        });
        promises.push(promise);
    });
    await Promise.all(promises);
    return monitors;
}

async function getMonitors() {
    const monitors = await _select(['*'], 'monitors');
    log({ id: 'monitor.js' }, `Got ${monitors.length} monitors`);
    return fillMonitorsData(monitors);
}

async function handleGetMonitors(socket, _) {
    socket.emit('monitors-list', await getMonitors());
}

async function computeMonitorStatus(monitor) {
    const lastHeartbeats = await _select(['is_failed'], 'monitor_heart_beats', `monitor_id = ?`, [monitor.id], 'created_at DESC', monitor.min_fail_attemps_to_down);
    const lastHeartbeatsFailed = lastHeartbeats.filter(heartbeat => heartbeat.is_failed);
    if (lastHeartbeatsFailed.length === monitor.min_fail_attemps_to_down) {
        return 'down';
    }
    return 'up';
}

async function runMonitor(broadcastSocket,  monitor) {
    log({ id: 'monitor.js' }, `Running monitor ${monitor.id}`);
    const startTime = Date.now();
    const getResponseTime = () =>  Date.now() - startTime;
    try {
        const response = await axios.call(monitor.method, monitor.url, {
            timeout: FIXED_MONITOR_TIMEOUT,
            validateStatus: status => status >= monitor.min_acceptable_status_code && status <= monitor.max_acceptable_status_code,
            maxRedirects: monitor.max_redirects,
            headers: monitor.headers ? JSON.parse(monitor.headers) : {},
            data: monitor.body ? JSON.parse(monitor.body) : {},
        });
        await _insert('monitor_heart_beats', {
            monitor_id: monitor.id,
            status_code: response.status,
            response_time: getResponseTime(),
            is_failed: false,
        });
    } catch (err) {
        if (err.response) {
            await _insert('monitor_heart_beats', {
                monitor_id: monitor.id,
                status_code: err.response.status,
                response_time: getResponseTime(),
                is_failed: true,
            });
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
            log({ id: 'monitor.js' }, `Monitor ${monitor.id} failed with timeout`);
            return;
        }
        throw err;
    } finally {
        const status = await computeMonitorStatus(monitor);
        const timestamp = currentTimestamp();
        await _update('monitors', {runned_at: timestamp, updated_at: timestamp, status}, 'id = ?', [monitor.id]);
        monitor.runned_at = timestamp;
        monitor.updated_at = timestamp;
        broadcastSocket.emit('monitor-runned', {
            monitor_id: monitor.id,
            monitor: await fillMonitorData(monitor),
        });
    }
}

async function handleMonitorsThread(broadcastSocket) {
    const monitorsToRun = await _select([
        '*',
        'UNIX_TIMESTAMP(CURRENT_TIMESTAMP) - UNIX_TIMESTAMP(runned_at) as runned_seconds_ago'
    ],
        'monitors',
        `runned_at IS NULL OR (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) - UNIX_TIMESTAMP(runned_at)) >= heart_beat_interval`
    );
    log({ id: 'monitor.js' }, `Got ${monitorsToRun.length} monitors to run`, monitorsToRun);
    const promises = [];
    monitorsToRun.forEach(monitor => {
        promises.push(runMonitor(broadcastSocket, monitor));
    });
    await Promise.all(promises);
}

module.exports = {
    monitorFactory,
    getMonitors,
    handleGetMonitors,
    handleMonitorsThread,
};

