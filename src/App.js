import { useEffect } from "react";
import { isUserLoggedIn } from "./helpers";

function App() {
  useEffect(() => {
    if (isUserLoggedIn()) {
      window.location.href = '/dash';
      return;
    }
    window.location.href = '/login';
  }, []);

  return (<h1>Loading</h1>);
}

export default App;
