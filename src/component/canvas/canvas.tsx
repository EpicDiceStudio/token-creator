import { fabric } from "fabric";
import "./canvas.scss";
import { useEffect, useState } from "react";
import frameApiService from "../../utils/service/frameApiService";
import {
  AddRequestMessage,
  EntityType,
  FrameMessage,
  FrameMessageType,
  LoadRequestMessage,
  ModalType,
  PlugInContext,
  RequestMessageType,
} from "@epic-dice-studio/dice-stories-plug-ins-api";

export const Canvas = () => {
  const [file, setFile] = useState(false);
  const [test, setTest] = useState({})
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [canvas2, setCanvas2] = useState<fabric.Canvas | null>(null);


  fabric.Object.prototype.cornerStyle = "circle";
  fabric.Object.prototype.cornerColor = "black";

  //Parti image de fond
  useEffect(() => {
    if (!canvas) {
      const canvasElement = document.getElementById("canvas");
      const canvasElement2 = document.getElementById("canvas2");
      const canvas = new fabric.Canvas(canvasElement as any, {
        selection: true,
        backgroundColor: "transparent",
        width: 400,
        height: 400,
        preserveObjectStacking: true,
      });

      const canvas2 = new fabric.Canvas(canvasElement2 as any, {
        selection: false,
        backgroundColor: "transparent",
        width: 400,
        height: 400,
        preserveObjectStacking: true,
      });
      setCanvas(canvas);
      canvas.on("after:render", () => {
        canvas2.clear();
        canvas2.add(...canvas.getObjects().map((o) => {
          const toto = fabric.util.object.clone(o)
          toto.set({
            selectable: false,
            evented: false,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            hasControls: false,
            hasBorders: false
          });
          return toto;
        }));


        canvas2.renderAll();
        setCanvas2(canvas2);
      });
      frameApiService.messageReceived$.subscribe((e) => {
        onMessageReceived(e, canvas)
      });
    }
  }, []);

  function onMessageReceived(message: FrameMessage<any>, canvas: fabric.Canvas | null) {
    switch (message.type) {
      case FrameMessageType.CONTEXT:
        const context = message.data as PlugInContext
        const medium = context.data as { url: string }

        if (medium.url) {
          fabric.Image.fromURL(medium.url, (oImg: fabric.Image) => {
            oImg.scaleToWidth(300);
            if (canvas) {
              canvas.add(oImg);
              oImg.center();
            }
          }, { crossOrigin: 'anonymous' });
        }
        break;
      case FrameMessageType.CLOSE:
        const url = message?.data?.url;
        setFile(true)
        if (url) {
          fabric.Image.fromURL(url, (oImg: fabric.Image) => {
            oImg.scaleToWidth(300);
            if (canvas) {
              canvas.add(oImg);
              oImg.center();
            }
          }, { crossOrigin: 'anonymous' });
        }
        break;

      case FrameMessageType.REQUEST:
        const request = message as FrameMessage<AddRequestMessage<any>>;
        if (request?.data?.type === RequestMessageType.ADD && request.data.entityType === EntityType.MEDIA) {

          const filters = new Map<string, any>()
          filters.set('id', request.data.data)
          frameApiService.sendMessage({
            type: FrameMessageType.REQUEST,
            data: {
              entityType: EntityType.MEDIUM,
              type: RequestMessageType.LOAD,
              filters
            } as LoadRequestMessage
          })
        }
        if ((request?.data?.type === RequestMessageType.LOAD && request.data.entityType === EntityType.MEDIUM)) {
          frameApiService.sendMessage({
            type: FrameMessageType.CLOSE,
            data: request.data.data,
          })
        }
        break;
    }
  }

  // //partie Bordure
  // function handleChangeBorder(file: any): void {
  //   const borderReader = new FileReader();
  //   borderReader.onload = () => {
  //     if (borderReader.result && canvas) {
  //       fabric.Image.fromURL(
  //         borderReader.result.toString(),
  //         (currentBorder: fabric.Image) => {
  //           currentBorder.scaleToWidth(200);
  //           currentBorder.setControlsVisibility({
  //             bl: false,
  //             br: false,
  //             tl: false,
  //             tr: false,
  //             mb: false,
  //             ml: false,
  //             mr: false,
  //             mt: false,
  //             mtr: true,
  //           });
  //           canvas.add(currentBorder);
  //           currentBorder.lockMovementX = true;
  //           currentBorder.lockMovementY = true;

  //           currentBorder.center();
  //           setImageExists(true);
  //         }
  //       );
  //     }
  //   };
  //   borderReader.readAsDataURL(file);
  // }
  //clip circle
  function AddCircleClip() {
    deleteClip()
    const clipPath = new fabric.Circle({ radius: 100, opacity: 0.01 });
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
        clipPath.left = canvas2.width / 2 - 100;
        clipPath.top = canvas2.height / 2 - 100;
      }
      canvas2.clipPath = clipPath;
    }
  }
  //add rec clipping
  function AddRecClip() {
    deleteClip()
    const clipPath = new fabric.Rect({ width: 200, height: 200, opacity: 0.01 })
    if (canvas2) {
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
      clipPath.center()
      canvas2.clipPath = clipPath;
    }
  }


  function cleanArea() {
    if (canvas) {
      canvas.clear();
      setFile(false);
    }
  }
  function deleteClip() {
    if (canvas2 && canvas2.clipPath) {
      canvas2.clipPath = undefined;
      canvas2.getObjects().forEach((obj) => {
        if (obj.clipPath || (obj instanceof fabric.Rect) || (obj instanceof fabric.Circle)) {
          canvas2.remove(obj);
        }
      });
      canvas2.renderAll();
    }
  }

  function handleAddFile() {
    frameApiService.sendMessage({
      type: FrameMessageType.OPEN_MODAL,
      data: {
        type: ModalType.SELECT_MEDIA,
        title: "mediatheque",
      },
    });
  }

  function handleSave() {
    console.log(1);
    if (canvas2 && canvas2.clipPath) {
      const base64Url = canvas2.toDataURL({
        format: 'png',
        left: 100,
        top: 100,
        width: 200,
        height: 200
      })
      console.log(2);
      fetch(base64Url)
        .then(res => res.blob())
        .then(blob => {
          const date = new Date()
          const finalResult = new File([blob], `file ${date}`, { type: "image/png" })
          console.log(3);

          frameApiService.sendMessage({
            type: FrameMessageType.REQUEST,
            data: { entityType: EntityType.MEDIA, type: RequestMessageType.ADD, data: { file: finalResult } } as AddRequestMessage<{
              file: File;
            }>,
          });
          console.log(4);
        })
    } else {
      alert("addClipPath for save file")
    }
  }
  return (
    <>
      <div className="navbar flex flex-wrap gap-3 justify-content-between align-content-center mb-3 p-2 ">
        <div>
          <button className="p-button p-button-text p-button-plain" onClick={handleAddFile}>
            <i className="pi pi-plus pr-2"></i>Add file from mediathèque
          </button>
          <button className="p-button p-button-text p-button-plain" onClick={AddCircleClip}>
            <i className="pi pi-plus pr-2"></i>Add circle clipping
          </button>
          <button className="p-button p-button-text p-button-plain" onClick={AddRecClip}>
            <i className="pi pi-plus pr-2"></i>Add Rec clipping
          </button>
          <button className="p-button p-button-text p-button-plain" onClick={cleanArea}>
            <i className="pi pi-eraser pr-2"></i>Clean area
          </button>
          <button className="p-button p-button-text p-button-plain" onClick={deleteClip}>
            <i className="pi pi-trash pr-2"></i>Remove clip
          </button>
        </div>
        <div>
          <button className="p-button" onClick={handleSave}>Save</button>
        </div>
      </div>
      <div className={"canvas-container flex gap-3 justify-content-center mt-6"} id="canvasContainer ">
        <div className="text-center editor">
          <h3>Editor</h3>
          <canvas id="canvas" />
        </div>
        <div className="text-center preview">
          <h3>Preview</h3>
          <canvas id="canvas2" />
        </div>
      </div>
    </>
  );
};
