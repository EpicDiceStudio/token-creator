import {fabric} from "fabric"
import './canvas.scss'
import {useEffect, useState} from "react";
import deleteObject from "../../utils/canvas-function/deleteObject";
import { Object} from "fabric/fabric-impl";
import {FileUploader} from "react-drag-drop-files";
import fileTypes from "../../utils/filetype/filetype";



export const Canvas = (props: any) => {

    const file: any = props.file;
    const [canvas, setCanvas] = useState<fabric.Canvas>(null)
    const [imageExists, setImageExists] = useState(false);
    const [border,setBorder]=useState(null)
    const img = document.createElement('img');
    const deleteIcon = "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E";

    fabric.Object.prototype.cornerStyle = 'circle';
    img.src = deleteIcon;





    //Parti image de fond
    useEffect(() => {
        if (!canvas) {
            const canvasElement = document.getElementById("canvas")
            const canvas = new fabric.Canvas(canvasElement, {
                selection: true,
                backgroundColor: 'transparent',
                width: 500,
                height: 500,
            });
            setCanvas(canvas)
        }

    }, [])

    useEffect(() => {
        if (file) {
            if (imageExists) {
                alert("Une image est déjà présente sur le canvas.");
                return;
            }
            const reader = new FileReader()
            reader.onload = () => {
                if (reader.result && canvas) {
                    fabric.Image.fromURL(reader.result.toString(), (oImg: fabric.Image) => {
                        oImg.scaleToWidth(300)
                        canvas.add(oImg)
                        canvas.setActiveObject(oImg);
                        oImg.center()
                        setImageExists(true);
                    });
                }
            }
            reader.readAsDataURL(file)
        }
    }, [file])
    fabric.Object.prototype.controls.deleteControl = new fabric.Control({
        cornerSize: 24,
        cursorStyle: 'pointer',
        mouseUpHandler: function(eventData, transform, ) {
            deleteObject.bind(this)(eventData, transform);
            setImageExists(false);
            props.setFile(null)
        },
        offsetX: 16,
        offsetY: 16,
        render: renderIcon,
        x: 0.5,
        y: -0.5,
    });
    function renderIcon(ctx: any, left: any, top: any, fabricObject: Object): void {
        const size = this.cornerSize;
        ctx.save();
        ctx.translate(left, top);
        ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
        ctx.restore();
    }

    //partie Bordure
    function handleChangeBorder(files:any):void {
        setBorder(files);
        const borderReader = new FileReader()
        borderReader.onload = () => {
            if (borderReader.result && canvas) {
                fabric.Image.fromURL(borderReader.result.toString(), (currentBorder: fabric.Image) => {
                    currentBorder.scaleToWidth(200)
                   /* canvas.add(currentBorder)*/
                    const clipPath = new fabric.Circle({ radius: 100,opacity:0.01 });
                    const group = new fabric.Group([
                        clipPath,
                        currentBorder
                    ])
                    canvas.clipPath = clipPath;
                    canvas.add(group)
                    canvas.setActiveObject(group);
                    group.center()

                    setImageExists(true);
                });
            }
        }
        borderReader.readAsDataURL(files)
    }

    function handleButtonClick1 (){
        console.log(canvas)
        console.log(canvas._objects[0])
        canvas.setActiveObject(canvas._objects[1])
    }
    return (
        <>
        <section className={"FileSection"}>
            <FileUploader
                multiple={false}
                handleChange={handleChangeBorder}
                name={"file"}
                types={fileTypes}
                children={<div className={"dragAndDropArea"}><p>Drag or drop you're border file</p>
                    <p>File must have JPEG,PNG,GIF,PNG,MP4,AVI,WEBM,AVIF extension</p></div>}
            />
            <p>{file ? `File name: ${file.name}` : "no files uploaded yet"}</p>
        </section>
            <section className={'button-group'}>
                <button onClick={handleButtonClick1}>Frame 1</button>
                <button>Frame 2</button>

            </section>
        <div className={"canvas-container"} id="canvasContainer">
            <canvas id='canvas'/>
        </div>
        </>
    )
}