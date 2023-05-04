import { AddRequestMessage, EntityType, FrameMessage, FrameMessageType, LoadRequestMessage, PlugInContext, RequestMessageType } from "@epic-dice-studio/dice-stories-plug-ins-api";

import { fabric } from "fabric";
import { CustomObjectType } from "../enums/custom-object-type";
import frameApiService from "./frameApiService";


function messageContext(message: FrameMessage<any>, canvas: fabric.Canvas | null, imageScaling: number): void {
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
                oImg.scaleToWidth(imageScaling);
                canvas.add(oImg);
                oImg.center();
                canvas.sendBackwards(oImg);
            }
        }, { crossOrigin: 'anonymous', customType: CustomObjectType.BACKGROUND_IMAGE } as any);
    }
}
function messageClose(message: FrameMessage<any>, canvas: fabric.Canvas | null, imageScaling: number): void {
    const url = message?.data?.url;
    if (url) {
        fabric.Image.fromURL(url, (oImg: fabric.Image) => {
            oImg.scaleToWidth(imageScaling);
            if (canvas) {
                canvas.add(oImg);
                oImg.center();
            }
        }, { crossOrigin: 'anonymous' });
    }
}
function messageRequest(message: FrameMessage<AddRequestMessage<any>>): void {
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
}
export { messageContext, messageClose, messageRequest }