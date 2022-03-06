const { _select } = require("./database/connection");
const { log } = require("./helpers");

function monitorFactory(max_heart_beat_interval = 60) {
    return {
        name: 'Monitor name',
        url: `${process.env.SERVER_URL}:${process.env.SERVER_PORT}`,
        heart_beat_interval: Math.max(10, Math.floor(Math.random() * max_heart_beat_interval)), 
    };
}

async function fillMonitorData(monitor) {
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

