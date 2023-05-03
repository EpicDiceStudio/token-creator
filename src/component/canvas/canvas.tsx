import { fabric } from "fabric";
import "./canvas.scss";
import { SetStateAction, useEffect, useState } from "react";
import frameApiService from "../../utils/service/frameApiService";
import { Dropdown } from 'primereact/dropdown';

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
import fileTypes from "../../utils/filetype/filetype";
import { FileUploader } from "react-drag-drop-files";
import { CustomObjectType } from "../../utils/enums/custom-object-type";

export const Canvas = () => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [canvas2, setCanvas2] = useState<fabric.Canvas | null>(null);
  const [selectedClipping, setSelectedClipping] = useState(null);
  const [selectedRemoveItem, setSelectedRemoveItem] = useState(null);
  const [menuClipping, setMenuClipping] = useState<SetStateAction<boolean>>(false);
  const [menuItem, setMenuItem] = useState<SetStateAction<boolean>>(false);

  // const clippings = [
  //   { name: 'circle clipping', interaction: () => AddCircleClip() },
  //   { name: 'Rec clipping', interaction: () => AddRecClip() },
  //   { name: 'Remove clip', interaction: () => deleteClip() },
  // ];
  // const deleteItem = [
  //   { name: 'delete background', interaction: () => deleteBackgroundImage() },
  //   { name: 'delete border', interaction: () => deleteBorder() },
  // ];
  // useEffect(() => {
  //   if (selectedClipping) {
  //     (selectedClipping as any).interaction()
  //   }
  // }, [selectedClipping])
  // useEffect(() => {
  //   if (selectedRemoveItem) {
  //     (selectedRemoveItem as any).interaction()
  //   }
  // }, [selectedRemoveItem])
  fabric.Object.prototype.cornerStyle = "circle";
  fabric.Object.prototype.cornerColor = "black";


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
        const backgroundImage = canvas2?.getObjects().find(element => (element as any).customType === CustomObjectType.BACKGROUND_IMAGE)
        canvas2.clear();
        if (backgroundImage?.clipPath) {
          canvas2.add(backgroundImage.clipPath)
        }
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
          if (backgroundImage?.clipPath && toto.customType === CustomObjectType.BACKGROUND_IMAGE) {
            toto.clipPath = backgroundImage.clipPath
          }
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
            if (canvas) {
              const previousbackgroundImage = canvas?.getObjects().find(element => (element as any).customType === CustomObjectType.BACKGROUND_IMAGE)
              if (previousbackgroundImage) {
                if (previousbackgroundImage.clipPath) {
                  oImg.clipPath = previousbackgroundImage.clipPath
                }
                canvas.remove(previousbackgroundImage)
              }
              oImg.scaleToWidth(300);
              canvas.add(oImg);
              oImg.center();
              canvas.sendBackwards(oImg);
            }
          }, { crossOrigin: 'anonymous', customType: CustomObjectType.BACKGROUND_IMAGE } as any);
        }
        break;
      case FrameMessageType.CLOSE:
        const url = message?.data?.url;
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

  //partie Bordure
  function handleChangeBorder(file: any): void {
    const borderReader = new FileReader();
    borderReader.onload = () => {
      if (borderReader.result && canvas) {
        fabric.Image.fromURL(
          borderReader.result.toString(),
          (currentBorder: fabric.Image) => {
            const previousBorder = canvas?.getObjects().find(element => (element as any).customType === CustomObjectType.BORDER_IMAGE)
            if (previousBorder) {
              canvas.remove(previousBorder)
            }
            currentBorder.scaleToWidth(200);
            if (currentBorder != undefined) { currentBorder.selectable = false }
            currentBorder.setControlsVisibility({
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
            canvas.add(currentBorder);
            currentBorder.lockMovementX = true;
            currentBorder.lockMovementY = true;
            currentBorder.center();
          }, {
            customType: CustomObjectType.BORDER_IMAGE
          } as any
        );
      }
    };
    borderReader.readAsDataURL(file);
  }
  function handleChangeBgcImg(file: any): void {

    const borderReader = new FileReader();
    borderReader.onload = () => {
      if (borderReader.result && canvas) {

        fabric.Image.fromURL(
          borderReader.result.toString(),
          (oImg: fabric.Image) => {
            const previousbackgroundImage = canvas?.getObjects().find(element => (element as any).customType === CustomObjectType.BACKGROUND_IMAGE)
            if (previousbackgroundImage) {
              if (previousbackgroundImage.clipPath) {
                oImg.clipPath = previousbackgroundImage.clipPath
              }
              canvas.remove(previousbackgroundImage)
            }
            oImg.scaleToWidth(300);
            canvas.add(oImg);
            oImg.center();
            canvas.sendBackwards(oImg);
          }, {
            customType: CustomObjectType.BACKGROUND_IMAGE
          } as any
        );
      }
    };
    borderReader.readAsDataURL(file);
  }

  function AddCircleClip() {
    deleteClip()
    const clipPath = new fabric.Circle({ radius: 100, opacity: 0.01, absolutePositioned: true });
    if (canvas2) {
      clipPath.lockMovementX = true;
      clipPath.lockMovementY = true;
      canvas2.add(clipPath);
      clipPath.selectable = true;
      if (canvas2.width && canvas2.height) {
        clipPath.left = canvas2.width / 2 - 100;
        clipPath.top = canvas2.height / 2 - 100;
      }
      const backgroundImage = canvas2?.getObjects().find(element => (element as any).customType === CustomObjectType.BACKGROUND_IMAGE)
      if (backgroundImage) { backgroundImage.clipPath = clipPath }
    }
  }

  function AddRecClip() {
    deleteClip()
    const clipPath = new fabric.Rect({ width: 200, height: 200, opacity: 0.01, absolutePositioned: true })
    if (canvas2) {
      clipPath.lockMovementX = true;
      clipPath.lockMovementY = true;
      canvas2.add(clipPath);
      clipPath.selectable = true;
      if (canvas2.width && canvas2.height) {
        clipPath.left = 100;
        clipPath.top = 100;
      }
      const backgroundImage = canvas2?.getObjects().find(element => (element as any).customType === CustomObjectType.BACKGROUND_IMAGE)
      if (backgroundImage) { backgroundImage.clipPath = clipPath }
    }
  }


  function cleanArea() {
    if (canvas) {
      deleteClip()
      canvas.clear();
    }
  }
  function deleteClip() {
    if (canvas2) {
      const backgroundImage = canvas2?.getObjects().find(element => (element as any).customType === CustomObjectType.BACKGROUND_IMAGE)
      if (backgroundImage) { backgroundImage.clipPath = undefined }
      canvas2.renderAll();
    }
  }
  function deleteBackgroundImage() {
    if (canvas) {
      if (canvas2) { deleteClip() }
      const backgroundImage = canvas?.getObjects().find(element => (element as any).customType === CustomObjectType.BACKGROUND_IMAGE)
      if (backgroundImage) {
        canvas.remove(backgroundImage)
        canvas.renderAll()
      }
    }
  }
  function deleteBorder() {
    if (canvas) {
      const borderImage = canvas?.getObjects().find(element => (element as any).customType === CustomObjectType.BORDER_IMAGE)
      if (borderImage) {
        canvas.remove(borderImage)
        canvas.renderAll()
      }
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
    if (canvas2 && canvas2.clipPath) {
      const base64Url = canvas2.toDataURL({
        format: 'png',
        left: 100,
        top: 100,
        width: 200,
        height: 200
      })
      fetch(base64Url)
        .then(res => res.blob())
        .then(blob => {
          const finalResult = new File([blob], "Token", { type: "image/png" })

          frameApiService.sendMessage({
            type: FrameMessageType.REQUEST,
            data: { entityType: EntityType.MEDIA, type: RequestMessageType.ADD, data: { file: finalResult } } as AddRequestMessage<{
              file: File;
            }>,
          });
        })
    } else {
      alert("addClipPath for save file")
    }
  }

  return (
    <>
      <div className="navbar flex flex-wrap gap-3 justify-content-between align-content-center mb-3 p-2 ">

        {/* <Dropdown value={selectedClipping} onChange={(e) => setSelectedClipping(e.value)} options={clippings} optionLabel="name"
          placeholder="clipping options" className="w-full md:w-14rem dropdown" appendTo={"self"} />


        <Dropdown value={selectedRemoveItem} onChange={(e) => setSelectedRemoveItem(e.value)} options={deleteItem} optionLabel="name"
          placeholder="delete item" className="w-full md:w-14rem dropdown" appendTo={"self"} /> */}

        <div>
          <button className="p-button p-button-text p-button-plain" onClick={handleAddFile}>
            <i className="pi pi-plus pr-2"></i>Add file from mediathèque
          </button>
          <button className="p-button p-button-text p-button-plain" onClick={cleanArea}>
            <i className="pi pi-eraser pr-2"></i>Clean area
          </button>
          {!menuItem ? (
            <button className="p-button p-button-text p-button-plain" onClick={() => {
              setMenuItem(true),
                setMenuClipping(false)
            }}>
              <i className="pi pi-eraser pr-2"></i>Delete item
            </button>
          ) : (
            <button className="p-button p-button-text p-button-plain" onClick={() => { setMenuItem(false) }}>
              Close item menu
            </button>)
          }
          {!menuClipping ? (
            <button className="p-button p-button-text p-button-plain" onClick={() => { setMenuClipping(true), setMenuItem(false) }}>
              <i className="pi pi-plus pr-2"></i>clipping options
            </button>
          ) : (<>
            <button className="p-button p-button-text p-button-plain" onClick={() => { setMenuClipping(false) }}>
              Close clipping options
            </button>
          </>
          )
          }
        </div>
        <div>
          <button className="p-button" onClick={handleSave}>Save</button>
        </div>
      </div>
      {menuItem &&
        <>
          <section className="menuDropdown">
            <button className="p-button p-button-text p-button-plain" onClick={() => { deleteBackgroundImage(), setMenuItem(false) }}>
              <i className="pi pi-trash pr-2"></i>Delete background
            </button>
            <button className="p-button p-button-text p-button-plain" onClick={() => { deleteBorder(), setMenuItem(false) }}>
              <i className="pi pi-trash pr-2"></i>Delete border
            </button>
          </section>
        </>
      }
      {
        menuClipping &&
        <>
          <section className="menuDropdown">
            <button className="p-button p-button-text p-button-plain" onClick={() => { AddCircleClip(), setMenuClipping(false) }}>
              <i className="pi pi-plus pr-2"></i>circle clipping
            </button>
            <button className="p-button p-button-text p-button-plain" onClick={() => { AddRecClip(), setMenuClipping(false) }}>
              <i className="pi pi-plus pr-2"></i>Rec clipping
            </button>
            <button className="p-button p-button-text p-button-plain" onClick={() => { deleteClip(), setMenuClipping(false) }}>
              <i className="pi pi-trash pr-2"></i>Remove clip
            </button>
          </section>
        </>
      }
      <FileUploader handleChange={handleChangeBgcImg} name="file" types={fileTypes} />
      <FileUploader handleChange={handleChangeBorder} name="file" types={fileTypes} />
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
