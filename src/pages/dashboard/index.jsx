import { useEffect, useState } from "react";
import { createSocket, emmit, isUserLoggedIn, MySwal, syntaxHighlight, toastError } from "../../helpers";
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
import NewMonitorModal from "./new-monitor-modal";
import Loader from "../../Loader";
import EditMonitorModal from "./edit-monitor-modal";

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
    const [loading, setLoading] = useState(false);

    const [showNewMonitorModal, setShowNewMonitorModal] = useState(false);
    const [showEditMonitorModal, setShowEditMonitorModal] = useState(false);

    function getLastMonitorSelectedId() {
        return Number(sessionStorage.getItem('@@lastMonitorSelectedId')) || null;
    }

    function setLastMonitorSelectedId(id) {
        sessionStorage.setItem('@@lastMonitorSelectedId', String(id));
    }


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

    function getMonitors() {
        setLoading(true);
        setMonitors([]);
        setMonitor({});
        emmit(socket, 'get-monitors');
    }

    const reloadMonitorsCallback = () => getMonitors();

    useEffect(() => {
        document.title = 'Dashboard';
        document.body.classList.add('no-background-image');

        if (!isUserLoggedIn()) {
            window.location.href = '/';
            return;
        }

        getMonitors();

        socket.on('monitors-list', (data) => {
            setLoading(false);
            setMonitors(data);
            if (data.length) {
                const lastMonitorSelectedId = getLastMonitorSelectedId();
                if (lastMonitorSelectedId) {
                    const selectedMonitorIndex = data.findIndex(m => m.id === lastMonitorSelectedId);
                    if (selectedMonitorIndex !== -1) {
                        setMonitor(data[selectedMonitorIndex]);
                        return;
                    }
                    setMonitor(data[0]);
                    return;
                }
                setMonitor(data[0]);
            }
        });

        socket.on('monitor-paused', reloadMonitorsCallback);
        socket.on('monitor-resumed', reloadMonitorsCallback);
        socket.on('monitor-deleted', reloadMonitorsCallback);

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

    useEffect(() => {
        const call = () => {
            setShowNewMonitorModal(false);
            setLoading(false);
            getMonitors();
        };
        socket.on('monitor-created', call);
        return () => {
            socket.off('monitor-created', call);
        };
    }, [monitors]);
    
    useEffect(() => {
        const call = () => {
            setShowEditMonitorModal(false);
            setLoading(false);
            getMonitors();
        };
        socket.on('monitor-edited', call);
        return () => {
            socket.off('monitor-edited', call);
        };
    }, [monitors]);

    function handleMonitorClick(_monitor) {
        setMonitor(_monitor);
        setLastMonitorSelectedId(_monitor.id);
    }

    function handlePauseOrResumeMonitor() {
        setLoading(true);
        if (monitor.is_paused) {
            emmit(socket, 'resume-monitor', {
                monitorId: monitor.id,
            });
            return;
        }
        emmit(socket, 'pause-monitor', {
            monitorId: monitor.id,
        });
    }

    async function handleDeleteMonitor() {
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
        emmit(socket, 'delete-monitor', {
            monitorId: monitor.id,
        });
    }

    const normalize = (value) => {
        const v = value.trim();
        return v.length ? v : null;
    };
    
    function extractMonitorFromForm(prefix) {
        return {
            name: normalize(document.getElementById(`${prefix}-name`).value),
            url: normalize(document.getElementById(`${prefix}-url`).value),
            description: normalize(document.getElementById(`${prefix}-description`).value),
            heart_beat_interval: normalize(document.getElementById(`${prefix}-interval`).value),
            min_fail_attemps_to_down: normalize(document.getElementById(`${prefix}-min-attemps-to-down`).value),
            max_redirects: normalize(document.getElementById(`${prefix}-max-redirects`).value),
            min_acceptable_status_code: normalize(document.getElementById(`${prefix}-min-acceptable-status-code`).value),
            max_acceptable_status_code: normalize(document.getElementById(`${prefix}-max-acceptable-status-code`).value),
            type: normalize(document.getElementById(`${prefix}-type`).value),
            method: normalize(document.getElementById(`${prefix}-method`).value),
            headers: normalize(document.getElementById(`${prefix}-headers`).value),
            body: normalize(document.getElementById(`${prefix}-body`).value),
        };
    }

    function handleNewMonitorFormSubmit(event) {
        event.preventDefault();

        const _newMonitor = extractMonitorFromForm('new-monitor');
        
        const requiredFields = [
            'name',
            'url',
            'heart_beat_interval',
            'min_fail_attemps_to_down',
            'max_redirects',
            'min_acceptable_status_code',
            'max_acceptable_status_code',
            'type',
            'method',
        ];

        const errors = requiredFields.filter(field => !_newMonitor[field]);

        if (errors.length) {
            toastError(`${errors.join(', ')} are required`);
            return;
        }

        emmit(socket, 'create-monitor', {monitor: _newMonitor});

        setLoading(true);
    }

    function handleEditMonitorFormSubmit(event) {
        event.preventDefault();

        const _editedMonitor = {
            id: normalize(document.getElementById('edit-monitor-id').value),
            ...extractMonitorFromForm('edit-monitor')
        };

        const requiredFields = [
            'id',
            'name',
            'url',
            'heart_beat_interval',
            'min_fail_attemps_to_down',
            'max_redirects',
            'min_acceptable_status_code',
            'max_acceptable_status_code',
            'type',
            'method',
        ];

        const errors = requiredFields.filter(field => !_editedMonitor[field]);

        if (errors.length) {
            toastError(`${errors.join(', ')} are required`);
            return;
        }

        emmit(socket, 'edit-monitor', {monitor: _editedMonitor});

        setLoading(true);
    }

    useEffect(() => {
        let mounted = true;
        if (!monitor.id || !mounted) {
            return;
        }
        setFailuresChartData(_chartData => {
            const failedHeartbeats = monitor.heartbeats.slice(0, BIG_HEARTBEATS_COUNT).filter(heartbeat => heartbeat.is_failed).reverse();
            return {
                ..._chartData, 
                labels: failedHeartbeats.map(heartbeat => heartbeat.label_time),
                datasets: [
                    {
                        ..._chartData.datasets[0],
                        data: failedHeartbeats.map(heartbeat => heartbeat.response_time),
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

    if (loading) {
        return <Loader />;
    }


    return (
        <>
            <NewMonitorModal 
                show={showNewMonitorModal} 
                onHide={() => setShowNewMonitorModal(false)} 
                handleSubmit={handleNewMonitorFormSubmit} 
            />
            {monitor && monitor.id ? (
                <EditMonitorModal 
                    show={showEditMonitorModal} 
                    onHide={() => setShowEditMonitorModal(false)} 
                    handleSubmit={handleEditMonitorFormSubmit} 
                    monitor={monitor} 
                />
            ) : null}
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
                                    <button className="btn btn-primary" onClick={() => setShowNewMonitorModal(true)}>
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
                                                        {_monitor.heartbeats.slice(0, SMALL_HEARTBEATS_COUNT).map((heartbeat, heartbeatIndex) => (
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
                    {monitor.id ? (
                        <div className="col-md-8 view-monitor">
                            <span className="monitor-name">{monitor.name}</span>
                            <br />
                            <a className="monitor-url" href={monitor.url} target="_blank" rel="noreferrer">{monitor.url}</a>
                            <div className="mt-3 monitor-buttons">
                                <button className="monitor-btn btn btn-primary" onClick={handlePauseOrResumeMonitor}>
                                    {monitor.is_paused ? 'resume' : 'pause'}
                                </button>
                                <button className="monitor-btn btn btn-secondary" onClick={() => setShowEditMonitorModal(true)}>Edit</button>
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

                            {monitor.heartbeats.length ? (
                                <div className="card bg-dark text-white mt-3">
                                    <div className="card-title">
                                        <h5>Last Heartbeat Response</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            <code>
                                                <pre 
                                                    dangerouslySetInnerHTML={{
                                                        __html: syntaxHighlight(monitor.heartbeats[monitor.heartbeats.length - 1].response)
                                                    }} 
                                                />
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
}