import { useEffect } from "react";
import { isUserLoggedIn } from "../../helpers";

export default function Dashboard() {

    useEffect(() => {
        document.title = 'Dashboard';
        if (!isUserLoggedIn()) {
            window.location.href = '/login';
        }
    }, []);

    return (
        <div>
            <h1>Dashboard</h1>
        </div>
    );
}