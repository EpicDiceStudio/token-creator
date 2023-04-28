import { fabric } from "fabric";
import "./canvas.scss";
import { useEffect, useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import fileTypes from "../../utils/filetype/filetype";

export const Canvas = (props: any) => {
  const [file, setFile] = useState(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [canvas2, setCanvas2] = useState<fabric.Canvas | null>(null);
  const [imageExists, setImageExists] = useState(false);

  fabric.Object.prototype.cornerStyle = "circle";
  fabric.Object.prototype.cornerColor = "black";

  //Parti image de fond
  useEffect(() => {
    if (!canvas) {
      const canvasElement = document.getElementById("canvas");
      const canvasElement2 = document.getElementById("canvas2");
      const canvas = new fabric.Canvas(canvasElement as any, {
        selection: true,
        backgroundColor: "blue",
        width: 500,
        height: 500,
        preserveObjectStacking: true,
      });

      const canvas2 = new fabric.Canvas(canvasElement2 as any, {
        selection: true,
        backgroundColor: "purple",
        width: 500,
        height: 500,
        preserveObjectStacking: true,
      });
      setCanvas(canvas);
      canvas.on("after:render", () => {
        canvas2.clear();
        canvas2.add(...canvas.getObjects().map((o) => o));
        canvas2.renderAll();
        setCanvas2(canvas2);
      });
    }
  }, []);

  useEffect(() => {
    if (file) {
      if (imageExists) {
        alert("Une image est déjà présente sur le canvas.");
        return;
      }
    }
  }, [file]);

  function handleChange(file: any): void {
    // setFile(file);
    const fileReader = new FileReader();
    fileReader.onload = () => {
      if (fileReader.result && canvas) {
        fabric.Image.fromURL(
          fileReader.result.toString(),
          (oImg: fabric.Image) => {
            oImg.scaleToWidth(300);
            canvas.add(oImg);
            oImg.center();
            setImageExists(true);
          }
        );
      }
    };
    fileReader.readAsDataURL(file);
  }
  //partie Bordure
  function handleChangeBorder(file: any): void {
    const borderReader = new FileReader();
    borderReader.onload = () => {
      if (borderReader.result && canvas) {
        fabric.Image.fromURL(
          borderReader.result.toString(),
          (currentBorder: fabric.Image) => {
            currentBorder.scaleToWidth(200);
            currentBorder.setControlsVisibility({
              bl: false,
              br: false,
              tl: false,
              tr: false,
              mb: false,
              ml: false,
              mr: false,
              mt: false,
              mtr: true,
            });
            canvas.add(currentBorder);
            currentBorder.lockMovementX = true;
            currentBorder.lockMovementY = true;

            currentBorder.center();
            setImageExists(true);
          }
        );
      }
    };
    borderReader.readAsDataURL(file);
  }
  //clip circle
  function AddCircleClip() {
    const clipPath = new fabric.Circle({ radius: 98, opacity: 0.01 });
    if (canvas2) {
      clipPath.center();
      clipPath.lockMovementX = true;
      clipPath.lockMovementY = true;
      canvas2.add(clipPath);
      clipPath.setControlsVisibility({
        bl: false,
        br: false,
        tl: false,
        tr: false,
        mb: false,
        ml: false,
        mr: false,
        mt: false,
        mtr: false,
      });
      if (canvas2.width && canvas2.height) {
        clipPath.left = canvas2.width / 2 - 98;
        clipPath.top = canvas2.height / 2 - 98;
      }
      canvas2.clipPath = clipPath;
    }
  }
  function cleanArea() {
    if (canvas) {
      canvas.clear();
      setImageExists(false);
      setFile(null);
    }
  }
  function deleteClip() {
    if (canvas) {
      console.log("test");
    }
  }

  return (
    <>
      <section className={"FileSection"}>
        <FileUploader
          multiple={false}
          handleChange={handleChange}
          name={"file"}
          types={fileTypes}
          children={
            <div className={"dragAndDropArea"}>
              <p>Drag or drop you're file</p>
              <p>File must have JPEG,PNG,GIF,PNG,MP4,AVI,WEBM,AVIF extension</p>
            </div>
          }
        />
        <FileUploader
          multiple={false}
          handleChange={handleChangeBorder}
          name={"file"}
          types={fileTypes}
          children={
            <div className={"dragAndDropArea"}>
              <p>Drag or drop you're border file</p>
              <p>File must have JPEG,PNG,GIF,PNG,MP4,AVI,WEBM,AVIF extension</p>
            </div>
          }
        />
      </section>
      <section className={"button-group"}>
        <button onClick={AddCircleClip}>Add circle clipping</button>
        <button onClick={cleanArea}>Clean area</button>
        <button onClick={deleteClip}>delete clip</button>
      </section>
      <div className={"canvas-container"} id="canvasContainer ">
        <canvas id="canvas" />
        <canvas id="canvas2" />
      </div>
    </>
  );
};
