import { useEffect, useState } from "react";
import { createSocket, isUserLoggedIn } from "../../helpers";
import './style.css';

const socket = createSocket();

export default function Dashboard() {

    const [monitors, setMonitors] = useState([]);    

    useEffect(() => {
        document.title = 'Dashboard';
        if (!isUserLoggedIn()) {
            window.location.href = '/login';
            return;
        }

        socket.emit('get-monitors');

        socket.on('monitors-list', (data) => {
            setMonitors(data);
        });
    }, []);

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-md-12">
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
                                    monitors.map((monitor, monitorIndex) => {
                                        return (
                                            <div className="col-md-12 monitor-list-item" key={`${monitor.id}-${monitorIndex}`}>
                                                <div className="monitor-up-time-percentage" style={{backgroundColor: monitor.uptime_color}}>
                                                    <span>{monitor.uptime_percentage.toFixed(2)}%</span>
                                                </div>
                                                <div className="monitor-name-and-tags-container">
                                                    <div className="monitor-name">
                                                        {monitor.name}
                                                    </div>
                                                    <div className="monitor-tags">
                                                        {monitor.tags.map((tag, tagIndex) => (
                                                            <span 
                                                                key={`${tag.id}-${tagIndex}`}
                                                                style={{backgroundColor: tag.color}}
                                                                className="monitor-tag"
                                                            >
                                                                {tag.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="monitor-heartbeats">
                                                    {monitor.heartbeats.slice(0, 11).map((heartbeat, heartbeatIndex) => (
                                                        <span 
                                                            key={`${heartbeat.id}-${heartbeatIndex}`}
                                                            style={{backgroundColor: heartbeat.color}}
                                                            className="monitor-heartbeat"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}