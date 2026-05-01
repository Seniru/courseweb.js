// Source - https://stackoverflow.com/a/61609010
// Posted by Binier, modified by community. See post 'Timeline' for change history
// Retrieved 2026-05-01, License - CC BY-SA 4.0

import EventEmitter from "events";

export interface CourseWebEvents {
    "login": () => void
}

export interface CourseWebClientEvents extends EventEmitter {
  on<U extends keyof CourseWebEvents>(
    event: U, listener: CourseWebEvents[U]
  ): this;

  emit<U extends keyof CourseWebEvents>(
    event: U, ...args: Parameters<CourseWebEvents[U]>
  ): boolean;
}
