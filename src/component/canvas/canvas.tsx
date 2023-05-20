import "./canvas.scss";
import { fabric } from "fabric";
import { useEffect, useState, useRef } from "react";
import { Menu } from "primereact/menu";

import {
  AddRequestMessage,
  EntityType,
  FrameMessage,
  FrameMessageType,
  ModalType,
  RequestMessageType,
} from "@epic-dice-studio/dice-stories-plug-ins-api";
import frameApiService from "../../service/frame-api.service";
import { CanvasFacade } from "../../service/canvas-facade.service";
import { DiceStoriesApi } from "../../service/dice-stories-api.service";

export const Canvas = () => {
  //#region states
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [previewCanvas, setPreviewCanvas] = useState<fabric.Canvas | null>(
    null
  );
  const [displayContent, setDisplayContent] = useState<boolean>(false);
  const [addingBackground, setAddingBackground] = useState<boolean>(false);
  const [addingBorder, setAddingBorder] = useState<boolean>(false);
  const [message, setMessage] = useState<any>(null);
  //#endregion

  //#region refs
  const addMenu = useRef(null);
  const clippingMenu = useRef(null);
  const deleteMenu = useRef(null);
  //#endregion

  //#region consts
  const exportImageName = "Token";

  //#region canvas
  const canvasHeight = 400;
  const canvasWidth = 400;
  //#endregion

  //#region scaling
  const imageScaling = 300;
  const borderScaling = 200;
  //#endregion

  //#region objects properties
  const clipPathOpacity = 0.01;
  const circleClipPathRadius = 100;
  const rectClipPathWidth = 200;
  const rectClipPathHeight = 200;
  //#endregion

  //#region menus
  const addFiles = [
    { label: "Background", command: () => requestAddBackground() },
    { label: "Border", command: () => requestAddBorder() },
  ];

  const clippings = [
    {
      label: "Circle",
      command: () => {
        if (previewCanvas)
          CanvasFacade.addCircleClip(
            circleClipPathRadius,
            clipPathOpacity,
            previewCanvas
          );
      },
    },
    {
      label: "Rectangle",
      command: () => {
        if (previewCanvas)
          CanvasFacade.addRectangleClip(
            rectClipPathWidth,
            rectClipPathHeight,
            clipPathOpacity,
            previewCanvas
          );
      },
    },
    {
      label: "Remove",
      command: () => {
        if (previewCanvas)
          CanvasFacade.removeBackgroundImageClip(previewCanvas);
      },
    },
  ];

  const deleteItem = [
    { label: "Background", command: () => removeBackgroundImage() },
    { label: "Border", command: () => removeBorder() },
    { label: "All", command: () => clean() },
  ];
  //#endregion
  //#endregion

  //#region effects

  useEffect(() => {
    if (!canvas) {
      const canvas = CanvasFacade.create(canvasWidth, canvasHeight, "canvas");
      const previewCanvas = CanvasFacade.create(
        canvasWidth,
        canvasHeight,
        "previewCanvas"
      );

      if (canvas && previewCanvas) {
        setCanvas(canvas);
        setPreviewCanvas(previewCanvas);

        canvas.on("after:render", () => {
          const backgroundImage = CanvasFacade.getBackgroundObject(
            ...CanvasFacade.getObjects(previewCanvas)
          );

          CanvasFacade.clear(previewCanvas);

          if (backgroundImage?.clipPath) {
            CanvasFacade.add(previewCanvas, backgroundImage.clipPath);
          }

          const objects = CanvasFacade.getObjects(canvas);
          const previewObjects = CanvasFacade.mapToPreviewObjects(...objects);

          if (backgroundImage?.clipPath) {
            const backgroundObject = CanvasFacade.getBackgroundObject(
              ...previewObjects
            );
            if (backgroundObject)
              backgroundObject.clipPath = backgroundImage.clipPath;
          }

          CanvasFacade.add(previewCanvas, ...previewObjects);

          previewCanvas.renderAll();
          setPreviewCanvas(previewCanvas);
        });

        frameApiService.messageReceived$.subscribe((e) => {
          setMessage(e);
        });
      }
    }
  }, [canvas]);

  useEffect(() => {
    if (message) {
      switch (message.type) {
        case FrameMessageType.CONTEXT:
          if (message.data?.styles?.length) {
            frameApiService.addStyles(message.data.styles).finally(() => {
              setDisplayContent(true);
            });
          }
          break;
        case FrameMessageType.CLOSE:
          handleSelectMedium(message, canvas);
          break;
        case FrameMessageType.REQUEST:
          DiceStoriesApi.handleRequest(message);
          break;
      }
    }
  }, [message]);

  //#endregion

  //#region menu actions

  function handleSelectMedium(
    message: FrameMessage<any>,
    canvas: fabric.Canvas | null
  ): void {
    const url = message?.data?.data?.url;
    if (url && canvas) {
      if (addingBackground) {
        setAddingBackground(false);
        CanvasFacade.addBackgroundImage(url, canvas, imageScaling);
      } else if (addingBorder) {
        setAddingBorder(false);
        CanvasFacade.addBorderImage(url, canvas, borderScaling);
      }
    }
  }

  function requestAddBackground(): void {
    setAddingBackground(true);
    setAddingBorder(false);
    handleAddFile();
  }

  function requestAddBorder(): void {
    setAddingBackground(false);
    setAddingBorder(true);
    handleAddFile();
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

  function clean(): void {
    if (canvas && previewCanvas) {
      CanvasFacade.removeBackgroundImageClip(previewCanvas);
      CanvasFacade.clear(canvas);
    }
  }

  function removeBackgroundImage(): void {
    if (canvas) {
      if (previewCanvas) {
        CanvasFacade.removeBackgroundImageClip(previewCanvas);
      }

      const backgroundImage = CanvasFacade.getBackgroundObject(
        ...CanvasFacade.getObjects(canvas)
      );

      if (backgroundImage) {
        CanvasFacade.removeObjects(canvas, backgroundImage);
      }
    }
  }

  function removeBorder(): void {
    if (canvas) {
      const borderImage = CanvasFacade.getBorderObject(
        ...CanvasFacade.getObjects(canvas)
      );

      if (borderImage) {
        CanvasFacade.removeObjects(canvas, borderImage);
      }
    }
  }

  function handleSave(): void {
    if (previewCanvas) {
      let refObject = CanvasFacade.getBorderObject(
        ...CanvasFacade.getObjects(previewCanvas)
      );

      if (!refObject) {
        refObject = CanvasFacade.getBackgroundObject(
          ...CanvasFacade.getObjects(previewCanvas)
        );
      }

      if (
        refObject &&
        refObject.width &&
        refObject.height &&
        refObject.scaleX &&
        refObject.scaleY
      ) {
        CanvasFacade.exportToFile(previewCanvas, exportImageName, "image/png", {
          format: "png",
          left: refObject.left,
          top: refObject.top,
          width: refObject.width * refObject.scaleX,
          height: refObject.height * refObject.scaleY,
        }).then((file) => {
          frameApiService.sendMessage({
            type: FrameMessageType.REQUEST,
            data: {
              entityType: EntityType.MEDIA,
              type: RequestMessageType.ADD,
              data: { file },
            } as AddRequestMessage<{
              file: File;
            }>,
          });
        });
      } else {
        alert("addClipPath for save file");
      }
    }
  }

  //#endregion

  return (
    <>
      {displayContent && (
        <div>
          <div className="navbar flex flex-wrap gap-3 justify-content-between align-content-center mb-1 p-2 ">
            <div className="flex gap-3">
              <Menu model={addFiles} popup ref={addMenu} />
              <button
                className="p-button p-button-text p-button-plain"
                onClick={(e: any) => (addMenu?.current as any)?.toggle(e)}
              >
                Add<i className="pi pi-angle-down pl-2"></i>
              </button>
              <Menu model={clippings} popup ref={clippingMenu} />
              <button
                className="p-button p-button-text p-button-plain"
                onClick={(e: any) => (clippingMenu?.current as any)?.toggle(e)}
              >
                Clip<i className="pi pi-angle-down pl-2"></i>
              </button>
              <Menu model={deleteItem} popup ref={deleteMenu} />
              <button
                className="p-button p-button-text p-button-plain"
                onClick={(e: any) => (deleteMenu?.current as any)?.toggle(e)}
              >
                Remove<i className="pi pi-angle-down pl-2"></i>
              </button>
            </div>
            <div>
              <button className="p-button" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        className={"canvas-container flex gap-3 justify-content-center mt-6"}
        id="canvasContainer "
      >
        <div className="text-center editor">
          <h3>Editor</h3>
          <canvas id="canvas" />
        </div>
        <div className="text-center preview">
          <h3>Preview</h3>
          <canvas id="previewCanvas" />
        </div>
      </div>
    </>
  );
};
