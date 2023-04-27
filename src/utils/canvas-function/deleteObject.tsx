import {Transform} from "fabric/fabric-impl";

function deleteObject(eventData:MouseEvent, transform:Transform):boolean {
    const target = transform.target;
    const canvas = target.canvas;
    canvas.remove(target);
    canvas.requestRenderAll();
return true
}
export default deleteObject