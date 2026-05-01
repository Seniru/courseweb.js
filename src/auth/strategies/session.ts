import { LoginStrategy } from "../../types/loginStrategies.js";

export const sessionStrategy: LoginStrategy<[string, string]> = async (
  moodleSession: string,
  sessionKey: string,
) => ({
  moodleSession,
  sessionKey,
});
