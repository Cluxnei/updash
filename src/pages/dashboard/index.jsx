import { useEffect, useState } from "react";
import { createSocket, isUserLoggedIn } from "../../helpers";


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

        socket.on('monitors', (data) => {
            setMonitors(data);
        });
    }, []);

    return (
        <div>
            <h1>Dashboard</h1>
        </div>
    );
}