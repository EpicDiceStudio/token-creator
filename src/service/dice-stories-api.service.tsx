/* eslint-disable @typescript-eslint/no-namespace */
import {
  AddRequestMessage,
  EntityType,
  FrameMessage,
  FrameMessageType,
  LoadRequestMessage,
  ModalType,
  RequestMessageType,
} from "@epic-dice-studio/dice-stories-plug-ins-api";
import frameApiService from "./frame-api.service";

export namespace DiceStoriesApi {
  /**
   * Handle DiceStories requests messages
   * @param message
   */
  export function handleRequest(
    message: FrameMessage<AddRequestMessage<any>>
  ): void {
    const request = message as FrameMessage<AddRequestMessage<any>>;

    switch (request?.data?.type) {
      case RequestMessageType.ADD:
        if (request.data.entityType === EntityType.MEDIA)
          handleAddMediumRequest(request);
        break;
      case RequestMessageType.LOAD:
        if (request.data.entityType === EntityType.MEDIUM)
          handleLoadMediumRequest(request);
        break;
    }
  }

  /**
   * Handle DiceStories added medium requests messages
   * @param message
   */
  export function handleAddMediumRequest(
    request: FrameMessage<AddRequestMessage<any>>
  ): void {
    if (request.data?.data) {
      const filters = new Map<string, any>();
      filters.set("id", request.data.data);

      frameApiService.sendMessage({
        type: FrameMessageType.REQUEST,
        data: {
          entityType: EntityType.MEDIUM,
          type: RequestMessageType.LOAD,
          filters,
        } as LoadRequestMessage,
      });
    }
  }

  /**
   * Handle DiceStories loaded medium requests messages
   * @param message
   */
  export function handleLoadMediumRequest(
    request: FrameMessage<AddRequestMessage<any>>
  ): void {
    if (request.data?.data) {
      frameApiService.sendMessage({
        type: FrameMessageType.CLOSE,
        data: {
          type: ModalType.SELECT_MEDIA,
          data: request.data.data,
        },
      });
    }
  }
}
