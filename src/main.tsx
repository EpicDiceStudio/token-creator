import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

window.addEventListener("message", (message) => {
  console.log("UN MESSAGE !", message);
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
