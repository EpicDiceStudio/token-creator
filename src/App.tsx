import "./App.css";

import { Canvas } from "./component/canvas/canvas";
import frameApiService from "./utils/service/frameApiService";
frameApiService.addStyles(['http://localhost:4300/styles.css']);

function App() {

  return (
    <>
      <Canvas />
    </>
  );
}

export default App;
