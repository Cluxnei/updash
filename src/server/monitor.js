const { _select } = require("./database/connection");
const { log } = require("./helpers");

const MINIMUM_HEARTBEATS_COUNT = 10;

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
        heartbeat.color = 'green';
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
    const [heartbeats, tags] = await Promise.all([
        _select(['*'], 'monitor_heart_beats', `monitor_id = ?`, [monitor.id], 'created_at DESC'),
        _select(['*'], 'monitor_tags', `monitor_id = ?`, [monitor.id]),
    ]);
    monitor.tags = fillTagsData(tags);
    monitor.heartbeats = fillHeartbeatsData(heartbeats);
    monitor.uptime_color = 'green';
    monitor.uptime_percentage = 100;
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
    log({id: 'monitor.js'}, `Got ${monitors.length} monitors`);
    return fillMonitorsData(monitors);
}

async function handleGetMonitors(socket, _) {
    socket.emit('monitors-list', await getMonitors());
}

module.exports = {
    monitorFactory,
    getMonitors,
    handleGetMonitors,
};

