/* eslint-disable @typescript-eslint/no-namespace */
import { fabric } from "fabric";
import { CustomObjectType } from "../enums/custom-object-type.enum";

export namespace CanvasFacade {
  /**
   * Create a canvas
   * @param width
   * @param height
   * @param id html id of the canvas html element
   * @returns
   */
  export function create(
    width: number,
    height: number,
    id: string
  ): fabric.Canvas | undefined {
    const canvasElement = document.getElementById(id);

    if (canvasElement) {
      return new fabric.Canvas(canvasElement as any, {
        selection: true,
        backgroundColor: "transparent",
        width: width,
        height: height,
        preserveObjectStacking: true,
      });
    }

    fabric.Object.prototype.cornerStyle = "circle";
    fabric.Object.prototype.cornerColor = "black";

    return undefined;
  }

  /**
   * Get the current background object of the given canvas
   * @param objects
   * @returns
   */
  export function getBackgroundObject(
    ...objects: fabric.Object[]
  ): fabric.Object | undefined {
    return objects.find(
      (element) =>
        (element as any).customType === CustomObjectType.BACKGROUND_IMAGE
    );
  }

  /**
   * Get the current border object of the given canvas
   * @param objects
   * @returns
   */
  export function getBorderObject(
    ...objects: fabric.Object[]
  ): fabric.Object | undefined {
    return objects.find(
      (element) => (element as any).customType === CustomObjectType.BORDER_IMAGE
    );
  }

  /**
   * Clear the given canvas
   * @param canvas
   */
  export function clear(canvas: fabric.Canvas): void {
    canvas.clear();
  }

  /**
   * Add object to the given canvas
   * @param canvas
   * @param objects
   */
  export function add(
    canvas: fabric.Canvas,
    ...objects: fabric.Object[]
  ): void {
    canvas.add(...objects);
  }

  /**
   * Get objects of the given canvas
   * @param canvas
   * @returns
   */
  export function getObjects(canvas: fabric.Canvas): fabric.Object[] {
    return canvas.getObjects();
  }

  /**
   * Map fabric objects to previewer objects (disabling controls)
   * @param objects
   * @returns
   */
  export function mapToPreviewObjects(
    ...objects: fabric.Object[]
  ): fabric.Object[] {
    return objects.map((o) => {
      const clonedObject = fabric.util.object.clone(o);

      clonedObject.set({
        selectable: false,
        evented: false,
        lockMovementX: true,
        lockMovementY: true,
        lockRotation: true,
        hasControls: false,
        hasBorders: false,
      });

      return clonedObject;
    });
  }

  /**
   * Add border image object to the given canvas and resize it to the given scaleWidth
   * @param url
   * @param canvas
   * @param scaleWidth
   */
  export function addBorderImage(
    url: string,
    canvas: fabric.Canvas,
    scaleWidth: number
  ): void {
    const previousBorder = getBorderObject(...getObjects(canvas));

    addImage(url, canvas, scaleWidth, {
      customType: CustomObjectType.BORDER_IMAGE,
      crossOrigin: "anonymous",
    }).then((image) => {
      if (previousBorder) {
        canvas.remove(previousBorder);
      }

      if (image != undefined) {
        image.selectable = false;
      }

      image.setControlsVisibility({
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
      image.lockMovementX = true;
      image.lockMovementY = true;
      image.evented = false;
      image.center();
      canvas.requestRenderAll();
    });
  }

  /**
   * Add background image object to the given canvas and resize it to the given scaleWidth
   * @param url
   * @param canvas
   * @param scaleWidth
   */
  export function addBackgroundImage(
    url: string,
    canvas: fabric.Canvas,
    scaleWidth: number
  ): void {
    const previousbackgroundImage = getBackgroundObject(...getObjects(canvas));

    addImage(url, canvas, scaleWidth, {
      customType: CustomObjectType.BACKGROUND_IMAGE,
      crossOrigin: "anonymous",
    }).then((image) => {
      if (previousbackgroundImage) {
        if (previousbackgroundImage.clipPath) {
          image.clipPath = previousbackgroundImage.clipPath;
        }
        canvas.remove(previousbackgroundImage);
      }

      image.center();
      canvas.sendBackwards(image);
      canvas.requestRenderAll();
    });
  }

  /**
   * Add image to the given canvas
   * @param url
   * @param canvas
   * @param scaleWidth
   * @param options
   * @returns
   */
  export function addImage(
    url: string,
    canvas: fabric.Canvas,
    scaleWidth: number,
    options?: any
  ): Promise<fabric.Image> {
    return new Promise<fabric.Image>((resolve) => {
      fabric.Image.fromURL(
        url,
        (image: fabric.Image) => {
          image.scaleToWidth(scaleWidth);
          canvas.add(image);
          resolve(image);
        },
        options
      );
    });
  }

  /**
   * Remove the clip of the background image
   * @param canvas
   */
  export function removeBackgroundImageClip(canvas: fabric.Canvas): void {
    if (canvas) {
      const backgroundImage = getBackgroundObject(...getObjects(canvas));

      if (backgroundImage) {
        backgroundImage.clipPath = undefined;
      }

      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }

  /**
   * Remove objects of the given canvas
   * @param canvas
   * @param objects
   */
  export function removeObjects(
    canvas: fabric.Canvas,
    ...objects: fabric.Object[]
  ): void {
    canvas.remove(...objects);
    canvas.renderAll();
  }

  /**
   * Export the given canvas to a file (ex: an image)
   * @param canvas
   * @param outputName
   * @param outputType
   * @param options
   * @returns
   */
  export function exportToFile(
    canvas: fabric.Canvas,
    outputName: string,
    outputType = "image/png",
    options?: fabric.IDataURLOptions
  ): Promise<File> {
    return new Promise<File>((resolve) => {
      const base64Url = canvas.toDataURL(options);
      fetch(base64Url)
        .then((res) => res.blob())
        .then((blob) => {
          resolve(
            new File([blob], outputName, {
              type: outputType,
            })
          );
        });
    });
  }

  /**
   * Add a circle clip to the given canvas
   * @param radius
   * @param opacity
   * @param canvas
   */
  export function addCircleClip(
    radius: number,
    opacity: number,
    canvas: fabric.Canvas
  ): void {
    const clipObject = new fabric.Circle({
      radius,
      opacity,
      absolutePositioned: true,
    });

    addClip(canvas, clipObject);
  }

  /**
   * Add a rectangle clip to the given canvas
   * @param width
   * @param height
   * @param opacity
   * @param canvas
   */
  export function addRectangleClip(
    width: number,
    height: number,
    opacity: number,
    canvas: fabric.Canvas
  ): void {
    const clipObject = new fabric.Rect({
      width,
      height,
      opacity,
      absolutePositioned: true,
    });

    addClip(canvas, clipObject);
  }

  /**
   * Add a clip object to the given canvas
   * @param canvas
   * @param clipObject
   */
  export function addClip(
    canvas: fabric.Canvas,
    clipObject: fabric.Object
  ): void {
    if (canvas) removeBackgroundImageClip(canvas);

    clipObject.lockMovementX = true;
    clipObject.lockMovementY = true;
    clipObject.setControlsVisibility({
      mtr: false,
    });
    canvas.add(clipObject);

    clipObject.selectable = true;

    if (
      canvas.width &&
      canvas.height &&
      clipObject.width &&
      clipObject.height
    ) {
      clipObject.left = canvas.width / 2 - clipObject.width / 2;
      clipObject.top = canvas.height / 2 - clipObject.height / 2;
    }

    const backgroundImage = getBackgroundObject(...getObjects(canvas));

    if (backgroundImage) {
      backgroundImage.clipPath = clipObject;
    }

    canvas.setActiveObject(clipObject);
    canvas.on("selection:cleared", () => {
      if (backgroundImage?.clipPath) {
        canvas.setActiveObject(clipObject).renderAll();
      }
    });
  }
}
