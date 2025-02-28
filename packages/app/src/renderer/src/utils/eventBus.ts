import mitt from "mitt";

type Events = {
  "open-setting-dialog": {
    tab?: "webhook";
    extra?: {
      // webhook的房间号
      roomId?: string;
    };
  };
};

const eventBus = mitt<Events>();

export default eventBus;
