import socketIOClient from "socket.io-client";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const SERVER_ENDPOINT = `${process.env.REACT_APP_SERVER_URL}:${process.env.REACT_APP_SERVER_PORT}`;

let socket = null;

export function createSocket() {
  if (socket === null) {
    socket = socketIOClient(SERVER_ENDPOINT);
  }
  return socket;
};

export function isUserLoggedIn() {
  const user = sessionStorage.getItem('@@user');
  const expires = sessionStorage.getItem('@@expires');
  if (!user || !expires) {
    return false;
  }
  if (new Date(Number(expires)) < new Date()) {
    return false;
  }
  return true;
}

export function authenticateUser(user, expires) {
  sessionStorage.setItem('@@user', user);
  sessionStorage.setItem('@@expires', expires);
}

export const MySwal = withReactContent(Swal);

export const Toast = MySwal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', MySwal.stopTimer);
    toast.addEventListener('mouseleave', MySwal.resumeTimer);
  },
});
