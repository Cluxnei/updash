import socketIOClient from 'socket.io-client';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

let socket = null;

export function createSocket() {
  if (socket === null) {
    socket = socketIOClient(process.env.REACT_APP_SERVER_URL, {
      withCredentials: false,
      reconnect: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

function userIsAuthenticated(setValue = null) {
  if (setValue !== null) {
    sessionStorage.setItem('@@userIsAuthenticated', String(setValue));
  }
  return sessionStorage.getItem('@@userIsAuthenticated') === 'true';
};

function setUserToken(token) {
  sessionStorage.setItem('@@userToken', token);
}

export function getUserToken() {
  return sessionStorage.getItem('@@userToken');
}

export function isUserLoggedIn() {

  const user = sessionStorage.getItem('@@user');
  const expires = sessionStorage.getItem('@@expires');

  if (!user || !expires) {
    userIsAuthenticated(false);
    return false;
  }

  if (new Date(Number(expires)) < new Date()) {
    userIsAuthenticated(false);
    return false;
  }

  const token = JSON.parse(user).token;

  if (!token) {
    userIsAuthenticated(false);
    return false;
  }

  return userIsAuthenticated();
}

export function authenticateUser(user, expires) {
  sessionStorage.setItem('@@user', JSON.stringify(user));
  sessionStorage.setItem('@@expires', expires);
  setUserToken(user.token);
  userIsAuthenticated(true);
}

export function handleTokenExpired(token) {
  console.log(token, getUserToken(), getUserToken() === token);
  if (token === getUserToken()) {
    userIsAuthenticated(false);
    sessionStorage.removeItem('@@user');
    sessionStorage.removeItem('@@expires');
    sessionStorage.removeItem('@@userToken');
    return true;
  }
  return false;
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

export async function toastError(message) {
  return Toast.fire({
    icon: 'error',
    title: message,
  });
}

export async function toastSuccess(message) {
  return Toast.fire({
    icon: 'success',
    title: message,
  });
}

export function emmit(_socket, event, _data = {}) {
  const data = {
    ..._data,
    token: getUserToken(),
  };
  console.log('emmiting', event, data);
  _socket.emit(event, data);
}