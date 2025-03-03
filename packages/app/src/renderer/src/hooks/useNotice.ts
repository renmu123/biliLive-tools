import { useNotification } from "naive-ui";

interface Options {
  title: string;
  content?: string;
  duration?: number;
  closable?: boolean;
}

export function useNotice() {
  const { info, success, warning, error } = useNotification();
  return {
    info: (input: string | Options) => {
      const iOptions = {
        duration: 1500,
        keepAliveOnHover: true,
      };
      if (typeof input === "object") {
        return info({
          ...iOptions,
          ...input,
        });
      } else {
        return info({
          ...iOptions,
          title: input,
        });
      }
    },
    success: (input: string | Options) => {
      const iOptions = {
        duration: 1000,
        keepAliveOnHover: true,
      };
      if (typeof input === "object") {
        return success({
          ...iOptions,
          ...input,
        });
      } else {
        return success({
          ...iOptions,
          title: input,
        });
      }
    },
    warning: (input: string | Options) => {
      const iOptions = {
        duration: 1500,
        keepAliveOnHover: true,
      };
      if (typeof input === "object") {
        return warning({
          ...iOptions,
          ...input,
        });
      } else {
        return warning({
          ...iOptions,
          title: input,
        });
      }
    },
    error: (input: string | Options) => {
      const iOptions = {
        duration: 2000,
        keepAliveOnHover: true,
      };
      if (typeof input === "object") {
        return error({
          ...iOptions,
          ...input,
        });
      } else {
        return error({
          ...iOptions,
          title: input,
        });
      }
    },
  };
}
