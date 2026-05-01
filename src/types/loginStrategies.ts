export type VerificationOption = "companionApp" | "text" | "call";

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
export type BrowserAutomaticStrategy = (
  password: string,
  verificationOption: VerificationOption,
) => Promise<void>;

export type LoginStrategies = {
  withSession: SessionStrategy;
  withBrowserInteraction: BrowserInteractionStrategy;
  withBrowserAutomation: BrowserAutomaticStrategy;
};
