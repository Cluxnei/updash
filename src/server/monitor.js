const monitors = [];

function randomColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

function monitorTagFactory(id = null) {
    const _id = id || Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
    return {
        id: _id,
        name: `Tag ${_id}`,
        color: randomColor(),
    };
}

function fixHeartbeatLength(heartbeats) {
    const FIXED_HEART_BEATS = 11;
    if (heartbeats.length > FIXED_HEART_BEATS) {
        return heartbeats;
    }
    const numberOfEmptyHeartbeats = FIXED_HEART_BEATS - heartbeats.length;
    const emptyHeartbeats = [];
    for (let i = 0; i < numberOfEmptyHeartbeats; i++) {
        emptyHeartbeats.push({
            id: 'empty',
            status: 'none',
            color: 'gray',
            responseTime: null,
        });
    }
    return [...emptyHeartbeats, ...heartbeats];
}

function monitorHeartbeatFactory(id = null) {
    const _id = id || Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
    const status = Math.random() > 0.5 ? "up" : "down";
    return {
        id: _id,
        status,
        color: status === "up" ? "green" : "red",
        responseTime: Math.random() * 472,
    };
}

function monitorFactory(id = null) {
    const _id = id || Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
    const status = Math.random() > 0.5 ? "up" : "down";
    const tags = [];
    const numberOfTags = Math.random() < 0.5 ? 0 : Math.floor(Math.random() * 5);
    for (let i = 0; i < numberOfTags; i++) {
        tags.push(monitorTagFactory(i));
    }
    const heartbeats = [];
    const numberOfHeartbeats = Math.random() < 0.5 ? 0 : Math.floor(Math.random() * 15);
    for (let i = 0; i < numberOfHeartbeats; i++) {
        heartbeats.push(monitorHeartbeatFactory(i));
    }
    return {
        id: _id,
        name: `Monitor ${_id}`,
        description: `This is monitor ${_id} description`,
        status,
        upTimePercentage: Math.random() * 100,
        uptimeColor: status === "up" ? "green" : "red",
        tags,
        heartbeats: fixHeartbeatLength(heartbeats),
    };
}

function getMockedMonitors() {
    const mockedMonitors = [];
    const numberOfMockedMonitors = Math.floor(Math.random() * 100);
    for (let i = 0; i < numberOfMockedMonitors; i++) {
        mockedMonitors.push(monitorFactory());
    }
    return mockedMonitors;
}

async function getMonitors() {

}

function handleGetMonitors(socket, _) {
    socket.emit('monitors-list', getMockedMonitors());
}

module.exports = {
    monitors,
    getMockedMonitors,
    getMonitors,
    handleGetMonitors,
};

