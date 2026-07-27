export type LatestRequest = {
  signal: AbortSignal;
  isCurrent: () => boolean;
  cancel: () => void;
};

export type LatestRequestManager = {
  start: () => LatestRequest;
  cancel: () => void;
};

export const createLatestRequestManager = (): LatestRequestManager => {
  let currentId = 0;
  let currentController: AbortController | null = null;

  const cancelCurrent = () => {
    currentId += 1;
    currentController?.abort();
    currentController = null;
  };

  return {
    start: () => {
      cancelCurrent();

      const requestId = currentId;
      const controller = new AbortController();
      currentController = controller;

      return {
        signal: controller.signal,
        isCurrent: () => requestId === currentId && !controller.signal.aborted,
        cancel: () => {
          controller.abort();
          if (requestId === currentId) {
            currentId += 1;
            currentController = null;
          }
        },
      };
    },
    cancel: cancelCurrent,
  };
};
