import { useEffect, useState } from "react";
import { createSocket, isUserLoggedIn, MySwal } from "../../helpers";
import './style.css';
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top',
        },
    },
};

const SMALL_HEARTBEATS_COUNT = 11;
const BIG_HEARTBEATS_COUNT = 33;

const socket = createSocket();

export default function Dashboard() {

    const [monitors, setMonitors] = useState([]);
    const [monitor, setMonitor] = useState({});
    const [failuresChartData, setFailuresChartData] = useState({
        labels: [],
        datasets: [
            {
                label: 'Failures',
                data: [],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
        ],
    });
    const [assertionsChartData, setAssertionsChartData] = useState({
        labels: [],
        datasets: [
            {
                label: 'Assertions',
                data: [],
                borderColor: 'rgb(53, 255, 135)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            }
        ],
    });

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

        const pauseOrResumeMonitorCallback = (data) => {
            console.log(data);
            const _monitorIndex = monitors.findIndex(_monitor => _monitor.id === data.id);
            if (_monitorIndex === -1) {
                return;
            }
            if (monitor.id === data.id) {
                setMonitor((oldMonitor) => ({
                    ...oldMonitor,
                    is_paused: data.is_paused,
                }));
            }
            setMonitors((oldMonitors) => {
                const _monitors = [...oldMonitors];
                _monitors[_monitorIndex] = {
                    ...oldMonitors[_monitorIndex],
                    is_paused: data.is_paused,
                };
                return _monitors;
            });
        };

        socket.on('monitor-paused', pauseOrResumeMonitorCallback);
        socket.on('monitor-resumed', pauseOrResumeMonitorCallback);
        socket.on('monitor-deleted', (data) => {
            setMonitors((oldMonitors) => {
                return oldMonitors.filter(_monitor => _monitor.id !== data.id);
            });
            if (monitor.id === data.id) {
                setMonitor({});
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
            setMonitor((oldMonitor) => {
                const currentMonitorIndex = monitors.findIndex(_monitor => _monitor.id === oldMonitor.id);
                if (currentMonitorIndex === -1) {
                    return oldMonitor;
                }
                return monitors[currentMonitorIndex];
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

    function handlePauseOrResumeMonitor() {
        if (monitor.is_paused) {
            socket.emit('resume-monitor', monitor.id);
            return;
        }
        socket.emit('pause-monitor', monitor.id);
    }

    async function handleDeleteMonitor() {
        console.log('delete monitor');
        const {value} = await MySwal.fire({
            title: 'Are you sure?',
            text: 'You won\'t be able to revert this!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });
        if (!value) {
            return;
        }
        socket.emit('delete-monitor', monitor.id);
    }

    useEffect(() => {
        let mounted = true;
        if (!monitor.id || !mounted) {
            return;
        }
        setFailuresChartData(_chartData => {
            const failed_heartbeats = monitor.heartbeats.slice(0, BIG_HEARTBEATS_COUNT).filter(heartbeat => heartbeat.is_failed).reverse();
            return {
                ..._chartData, 
                labels: failed_heartbeats.map(heartbeat => heartbeat.label_time),
                datasets: [
                    {
                        ..._chartData.datasets[0],
                        data: failed_heartbeats.map(heartbeat => heartbeat.response_time),
                    },
                ]
            };
        });
        setAssertionsChartData(_chartData => {
            const assertions = monitor.heartbeats.slice(0, BIG_HEARTBEATS_COUNT).filter(heartbeat => !heartbeat.is_failed).reverse();
            return {
                ..._chartData, 
                labels: assertions.map(heartbeat => heartbeat.label_time),
                datasets: [
                    {
                        ..._chartData.datasets[0],
                        data: assertions.map(heartbeat => heartbeat.response_time),
                    },
                ]
            };
        });
        return () => {
            mounted = false;
        };
    }, [monitor]);

    if (!monitors.length || !monitor.id) {
        return null;
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
                                            <button 
                                                onClick={() => handleMonitorClick(_monitor)} 
                                                className={`col-md-12 monitor-list-item ${monitor.id === _monitor.id ? 'active' : ''}`}
                                                key={`${_monitor.id}-${monitorIndex}`}
                                            >
                                                <div className="monitor-up-time-percentage" style={{ 
                                                    backgroundColor: _monitor.uptime_color,
                                                    color: _monitor.response_times.uptime.all_time_text_color
                                                    }}
                                                >
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
                                                    {_monitor.heartbeats.slice(0, SMALL_HEARTBEATS_COUNT).reverse().map((heartbeat, heartbeatIndex) => (
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
                    <a className="monitor-url" href={monitor.url} target="_blank" rel="noreferrer">{monitor.url}</a>

                    <div className="mt-3 monitor-buttons">
                        <button className="monitor-btn btn btn-primary" onClick={handlePauseOrResumeMonitor}>
                            {monitor.is_paused ? 'resume' : 'pause'}
                        </button>
                        <button className="monitor-btn btn btn-secondary">Edit</button>
                        <button className="monitor-btn btn btn-danger" onClick={handleDeleteMonitor}>Delete</button>
                        {monitor.tags.length && (
                            <div className="card bg-dark">
                                <div className="card-body p-2">
                                    {monitor.tags.map((tag, tagIndex) => (
                                        <span
                                            key={`big-${tag.id}-${tagIndex}`}
                                            style={{ backgroundColor: tag.color }}
                                            className="monitor-tag"
                                        >
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="card bg-dark text-white mt-3">
                        <div className="card-body">
                            <div className="monitor-big-heartbeats">
                                <div className="monitor-heartbeats">
                                    {monitor.heartbeats.slice(0, BIG_HEARTBEATS_COUNT).reverse().map((heartbeat, heartbeatIndex) => (
                                        <span
                                            key={`big-${heartbeat.id}-${heartbeatIndex}`}
                                            style={{ backgroundColor: heartbeat.color }}
                                            className="monitor-heartbeat"
                                        />
                                    ))}
                                </div>
                                <span className="monitor-status" style={{ backgroundColor: monitor.status_color }}>{monitor.status}</span>
                            </div>
                            <p className="monitor-heartbeat-interval-description">Check every {monitor.heart_beat_interval} seconds</p>
                        </div>
                    </div>
                    <div className="card bg-dark text-white mt-3">
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-3 col-sm-6 monitor-counters">
                                    <span className="title">Response</span>
                                    <span className="subtitle">(Current)</span>
                                    <span className="value">{monitor.response_times.current} ms</span>

                                </div>
                                <div className="col-md-3 col-sm-6 monitor-counters">
                                    <span className="title">Avg Response</span>
                                    <span className="subtitle">(all-time)</span>
                                    <span className="value">{monitor.response_times.avg.all_time.toFixed(2)} ms</span>
                                </div>
                                <div className="col-md-2 col-sm-6 monitor-counters">
                                    <span className="title">Avg Response</span>
                                    <span className="subtitle">(last-24-hours)</span>
                                    <span className="value">{monitor.response_times.avg.last_24_hours.toFixed(2)} ms</span>
                                </div>
                                <div className="col-md-2 col-sm-6 monitor-counters">
                                    <span className="title">Uptime</span>
                                    <span className="subtitle">(all-time)</span>
                                    <span className="value" style={{color: monitor.response_times.uptime.all_time_text_color}}>{monitor.response_times.uptime.all_time.toFixed(2)}%</span>
                                </div>
                                <div className="col-md-2 col-sm-6 monitor-counters">
                                    <span className="title">Uptime</span>
                                    <span className="subtitle">(last-24-hours)</span>
                                    <span className="value" style={{color: monitor.response_times.uptime.last_24_hours_text_color}}>{monitor.response_times.uptime.last_24_hours.toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {failuresChartData.labels.length ? (
                        <div className="card bg-dark text-white mt-3">
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-12 monitor-response-chart">
                                        <Line data={failuresChartData} options={options} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                    {assertionsChartData.labels.length ? (
                        <div className="card bg-dark text-white mt-3">
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-12 monitor-response-chart">
                                        <Line data={assertionsChartData} options={options} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}