export type LoginResult = {
  moodleSession: string;
  sessionKey: string;
};

export type LoginStrategy<T extends unknown[] = unknown[]> = (
  ...args: T
) => Promise<LoginResult>;

export type SessionStrategy = (
  moodleSession: string,
  sessionKey: string,
) => Promise<void>;

export type BrowserInteractionStrategy = () => Promise<void>;

export type LoginStrategies = {
  withSession: SessionStrategy;
  withBrowserInteraction: BrowserInteractionStrategy;
};
