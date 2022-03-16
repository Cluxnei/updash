import { useEffect } from 'react';
import { isUserLoggedIn } from './helpers';
import Loader from './Loader';

function App() {
  useEffect(() => {
    const navAsync = (route, delay = 2000) => {
      setTimeout(() => {
        window.location.href = route;
      }, delay);
    };
    if (isUserLoggedIn()) {
      navAsync('/dash');
      return;
    }
    navAsync('/login');
  }, []);

  return <Loader />;
}

export default App;
