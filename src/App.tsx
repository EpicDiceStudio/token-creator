
import './App.css'
import { useState} from "react";
import {Files} from "./component/file-management/files";
import {Canvas} from "./component/canvas/canvas";

function App() {
  const [file,setFile] = useState(null)

  return (
    <>
        <Files file={file} setFile={setFile}/>
        <Canvas file={file} setFile={setFile}/>
    </>
  )
}

export default App
