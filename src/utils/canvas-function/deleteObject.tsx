import { Transform } from "fabric/fabric-impl";

function deleteObject(transform: Transform): boolean {
  const target = transform.target;
  const canvas = target.canvas;

  if (canvas) {
    canvas.remove(target);
    canvas.requestRenderAll();
  }

  return true;
}
export default deleteObject;
