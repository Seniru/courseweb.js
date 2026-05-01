import puppeteer from "puppeteer";
import { SERVER_PREFIX } from "../../constants/common.js";
import { LoginStrategy } from "../../types/loginStrategies.js";

export const browserInteractionStrategy: LoginStrategy<[]> = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(SERVER_PREFIX);
  await page.click(".login-identityprovider-btn");

  await page.waitForFunction(
    `window.location.href.startsWith('${SERVER_PREFIX}/my')`,
    { timeout: 0 },
  );
  const sessionKey =
    (await page.content()).match(/"sesskey":"(\w+)"/)?.[1] || null;
  const moodleSession = (await browser.cookies()).filter(
    (cookie) => cookie.name == "MoodleSession",
  )[0].value;

  if (!sessionKey || !moodleSession) throw new Error("Couldn't login");

  return { moodleSession, sessionKey };
};
