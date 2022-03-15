import { useEffect } from "react";
import { authenticateUser, createSocket, isUserLoggedIn, Toast } from "../../helpers";
import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';

const socket = createSocket();

export default function Login() {


    useEffect(() => {
        document.title = 'Login';
        if (isUserLoggedIn()) {
            window.location.href = '/dash';
            return;
        }

        socket.on('successful-login', ({username, expires, message}) => {
            Toast.fire({
                icon: 'success',
                title: message,
            });
            authenticateUser(username, expires);
            window.location.href = '/dash';
        });

        socket.on('failed-login', (data) => {
            Toast.fire({
                icon: 'error',
                title: data.message,
            });
        });

    }, []);

    async function handleFormSubmit(evt) {
        evt.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        socket.emit('login-attempt', { username, password });
    }

    return (
        <div className="login-form-container container justify-content-center align-items-center d-flex">
            <form className="col-md-3 login-form" id="login-form" onSubmit={handleFormSubmit}>
                <h3>Sign In</h3>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input id="username" type="text" className="form-control" placeholder="username" autoFocus />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input id="password" type="password" className="form-control" placeholder="password" />
                </div>
                <button type="submit" className="btn btn-login btn-block">Submit</button>
            </form>
        </div>
    );
}