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
  ModalType,
  RequestMessageType,
} from "@epic-dice-studio/dice-stories-plug-ins-api";
import fileTypes from "../../utils/filetype/filetype";
import { FileUploader } from "react-drag-drop-files";
import { CustomObjectType } from "../../utils/enums/custom-object-type";
import * as messageMethod from "../../utils/service/onMessageReceiveService";

export const Canvas = () => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [canvas2, setCanvas2] = useState<fabric.Canvas | null>(null);
  const [menuClipping, setMenuClipping] = useState<SetStateAction<boolean>>(false);
  const [menuItem, setMenuItem] = useState<SetStateAction<boolean>>(false);
  // const [selectedClipping, setSelectedClipping] = useState<SetStateAction<boolean>>(false);
  // const [selectedRemoveItem, setSelectedRemoveItem] = useState<SetStateAction<boolean>>(false);
  //taille canvas
  const canvasHeight = 400;
  const canvasWidth = 400;
  //image scaling
  const imageScaling = 300;
  const borderScaling = 200;
  //clipPath paramètre
  const clipPathOpacity = 0.01;
  const circleClipPathRadius = 100;
  const rectClipPathWidth = 200;
  const rectClipPathHeight = 200;
  const rectClipPathLeftPosition = 100;
  const rectClipPathTopPosition = 100;
  //paramètre image enregistrer
  const exportImageName = "Token";
  const exportImageLeftPosition = 100;
  const exportImageTopPosition = 100;
  const exportImageHeight = 200;
  const exportImageWidth = 200;
  // //option menu clipping et delete item
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

  //paramètre corner
  fabric.Object.prototype.cornerStyle = "circle";
  fabric.Object.prototype.cornerColor = "black";

  //génération des canvas
  useEffect(() => {

    if (!canvas) {
      const canvasElement = document.getElementById("canvas");
      const canvasElement2 = document.getElementById("canvas2");
      const canvas = new fabric.Canvas(canvasElement as any, {
        selection: true,
        backgroundColor: "transparent",
        width: canvasWidth,
        height: canvasHeight,
        preserveObjectStacking: true,
      });

      const canvas2 = new fabric.Canvas(canvasElement2 as any, {
        selection: false,
        backgroundColor: "transparent",
        width: canvasWidth,
        height: canvasHeight,
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
  }, [canvas]);

  //partie gestion des messages
  function onMessageReceived(message: FrameMessage<any>, canvas: fabric.Canvas | null) {

    switch (message.type) {
      case FrameMessageType.CONTEXT:
        messageMethod.messageContext(message, canvas, imageScaling)
        break;
      case FrameMessageType.CLOSE:
        messageMethod.messageClose(message, canvas, imageScaling)
        break;

      case FrameMessageType.REQUEST:
        messageMethod.messageRequest(message)
        break;
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
            currentBorder.scaleToWidth(borderScaling);
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
  //partie image de fond 
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
            oImg.scaleToWidth(imageScaling);
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
  //partie clipping
  function AddCircleClip() {

    deleteClip()
    const clipPath = new fabric.Circle({ radius: circleClipPathRadius, opacity: clipPathOpacity, absolutePositioned: true });

    if (canvas2) {
      clipPath.lockMovementX = true;
      clipPath.lockMovementY = true;
      clipPath.setControlsVisibility({
        mtr: false,
      });
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
    const clipPath = new fabric.Rect({ width: rectClipPathWidth, height: rectClipPathHeight, opacity: clipPathOpacity, absolutePositioned: true })

    if (canvas2) {
      clipPath.lockMovementX = true;
      clipPath.lockMovementY = true;
      clipPath.setControlsVisibility({
        mtr: false,
      });
      canvas2.add(clipPath);
      clipPath.selectable = true;

      if (canvas2.width && canvas2.height) {
        clipPath.left = rectClipPathLeftPosition;
        clipPath.top = rectClipPathTopPosition;
      }
      const backgroundImage = canvas2?.getObjects().find(element => (element as any).customType === CustomObjectType.BACKGROUND_IMAGE)

      if (backgroundImage) { backgroundImage.clipPath = clipPath }
    }
  }

  //partie retirer élément ou tout
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

  //partie sauvegarde
  function handleSave() {

    const backgroundImage = canvas2?.getObjects().find(element => (element as any).customType === CustomObjectType.BACKGROUND_IMAGE)

    if (canvas2 && backgroundImage?.clipPath) {
      const base64Url = canvas2.toDataURL({
        format: 'png',
        left: exportImageLeftPosition,
        top: exportImageTopPosition,
        width: exportImageWidth,
        height: exportImageHeight
      })
      fetch(base64Url)
        .then(res => res.blob())
        .then(blob => {
          const finalResult = new File([blob], exportImageName, { type: "image/png" })

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
      <div className="navbar flex flex-wrap gap-3 justify-content-between align-content-center mb-1 p-2 ">
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
