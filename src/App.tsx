import { Canvas } from "./component/canvas/canvas";
import frameApiService from "./service/frame-api.service";
import "primereact/resources/primereact.min.css";

frameApiService.addStyles(["http://localhost:4300/styles.css"]);

function App() {
  return (
    <>
      <Canvas />
    </>
  );
}

export default App;
