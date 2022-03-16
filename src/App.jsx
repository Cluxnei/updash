import { useEffect } from 'react';
import { isUserLoggedIn } from './helpers';

import loadingSvg from './assets/loading.svg';

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

  return (
    <div className='loading-container'>
      <img src={loadingSvg} alt="loading" />  
    </div>
  );
}

export default App;
