import { useCallback, useEffect, useState } from "react";
import { createSocket, isUserLoggedIn } from "../../helpers";
import './style.css';

const socket = createSocket();

export default function Dashboard() {

    const [monitors, setMonitors] = useState([]);
    const [monitor, setMonitor] = useState({});

    useEffect(() => {
        document.title = 'Dashboard';
        if (!isUserLoggedIn()) {
            window.location.href = '/login';
            return;
        }

        socket.emit('get-monitors');

        socket.on('monitors-list', (data) => {
            setMonitors(data);
            if (data.length) {
                setMonitor(data[0]);
            }
        });

    }, []);

    useEffect(() => {
        const call = (data) => {
            const monitorIndex = monitors.findIndex(_monitor => _monitor.id === data.monitor_id);
            if (monitorIndex === -1) {
                return;
            }
            setMonitors(oldMonitors => {
                oldMonitors[monitorIndex] = data.monitor;
                return [...oldMonitors];
            });
        };
        socket.on('monitor-runned', call);
        return () => {
            socket.off('monitor-runned', call);
        };
    }, [monitors]);

    function handleMonitorClick(_monitor) {
        setMonitor(_monitor);
    }


    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-md-12 text-white">
                    <h1>Dashboard</h1>
                </div>
            </div>
            <div className="row">
                <div className="col-md-4">
                    <div className="card bg-dark text-white">
                        <div className="card-body">
                            <h5 className="card-title">
                                <button className="btn btn-primary">
                                    add new monitor
                                </button>
                            </h5>
                            <div className="row monitors-list">
                                {
                                    monitors.map((_monitor, monitorIndex) => {
                                        return (
                                            <button onClick={() => handleMonitorClick(_monitor)} className="col-md-12 monitor-list-item" key={`${_monitor.id}-${monitorIndex}`}>
                                                <div className="monitor-up-time-percentage" style={{ backgroundColor: _monitor.uptime_color }}>
                                                    <span>{_monitor.uptime_percentage.toFixed(2)}%</span>
                                                </div>
                                                <div className="monitor-name-and-tags-container">
                                                    <div className="monitor-name">
                                                        {_monitor.name}
                                                    </div>
                                                    <div className="monitor-tags">
                                                        {_monitor.tags.map((tag, tagIndex) => (
                                                            <span
                                                                key={`${tag.id}-${tagIndex}`}
                                                                style={{ backgroundColor: tag.color }}
                                                                className="monitor-tag"
                                                            >
                                                                {tag.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="monitor-heartbeats">
                                                    {_monitor.heartbeats.slice(0, 11).reverse().map((heartbeat, heartbeatIndex) => (
                                                        <span
                                                            key={`small-${heartbeat.id}-${heartbeatIndex}`}
                                                            style={{ backgroundColor: heartbeat.color }}
                                                            className="monitor-heartbeat"
                                                        />
                                                    ))}
                                                </div>
                                            </button>
                                        );
                                    })
                                }
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-8 view-monitor">
                    <span className="monitor-name">{monitor.name}</span>
                    <br />
                    <a className="monitor-url" href="{monitor.url}" target="_blank">{monitor.url}</a>
                    <div className="mt-3 monitor-buttons">
                        <button className="monitor-btn btn btn-primary">Pause</button>
                        <button className="monitor-btn btn btn-secondary">Edit</button>
                        <button className="monitor-btn btn btn-danger">Delete</button>
                    </div>
                    <div className="card bg-dark text-white mt-3">
                        <div className="card-body">
                            <div className="monitor-big-heartbeats">
                                <div className="monitor-heartbeats">
                                    {monitor?.heartbeats?.slice(0, 33)?.reverse()?.map((heartbeat, heartbeatIndex) => (
                                        <span
                                            key={`big-${heartbeat.id}-${heartbeatIndex}`}
                                            style={{ backgroundColor: heartbeat.color }}
                                            className="monitor-heartbeat"
                                        />
                                    ))}
                                </div>
                                <span className="monitor-status" style={{backgroundColor: monitor.status_color}}>{monitor.status}</span>
                            </div>
                            <p>Check every {monitor.heart_beat_interval} seconds</p>
                        </div>
                    </div>
                    <div className="card bg-dark text-white mt-3">
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-4 monitor-counters">
                                    <span className="title">Response</span>
                                    <span className="subtitle">(Current)</span>
                                    <span className="value">{monitor?.response_times?.current} ms</span>
                                    
                                </div>
                                <div className="col-md-4 monitor-counters">
                                    <span className="title">Avg Response</span>
                                    <span className="subtitle">(all-time)</span>
                                    <span className="value">{monitor?.response_times?.avg?.all_time.toFixed(2)} ms</span>
                                </div>
                                <div className="col-md-4 monitor-counters">
                                    <span className="title">Uptime</span>
                                    <span className="subtitle">(all-time)</span>
                                    <span className="value">{monitor?.response_times?.uptime?.all_time.toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}