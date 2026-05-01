import puppeteer from "puppeteer";
import { SERVER_PREFIX } from "../../constants/common.js";
import {
  LoginStrategy,
  VerificationOption,
} from "../../types/loginStrategies.js";
import { RegistrationNumber } from "../../types/userMetadata.js";

const verificationOptions: Record<VerificationOption, Function> = {
  companionApp: async (page: puppeteer.Page) => {
    throw new Error("Unsupported exception");
  },
  call: async (page: puppeteer.Page) => {
    await page.waitForSelector("[data-value='TwoWayVoiceMobile'");
    await page.click("[data-value='TwoWayVoiceMobile']");
  },
  text: async (page: puppeteer.Page) => {
    throw new Error("");
  },
};

export const browserAutomaticStrategy: LoginStrategy<
  [RegistrationNumber, string, VerificationOption]
> = async (
  registrationNumber: RegistrationNumber,
  password: string,
  verificationOption: VerificationOption,
) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(SERVER_PREFIX);
  (await page.click(".login-identityprovider-btn"),
    // fill in email
    await page.waitForSelector("input[type=email]"));
  const emailInput = await page.$("input[type=email]");
  await emailInput?.type(registrationNumber.toLowerCase() + "@my.sliit.lk", {
    delay: 50,
  });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.click("input[type=submit]"),
  ]);

  // fill in password
  await page.waitForSelector("input[type=password]", { visible: true });
  await page.waitForNetworkIdle({ idleTime: 500 });
  const passwordInput = await page.$("input[type=password]");
  await passwordInput?.click();
  await passwordInput?.type(password, { delay: 100 });

  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.click("input[type=submit]"),
  ]);

  // use sign in another way
  // this method is easier as all the verification methods is in one place
  await page.waitForSelector("#signInAnotherWay");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    // wait for all network to settle down
    // without this step, there's a potential that this request fails
    // the reason is unknown, maybe they flag down the request if it's too fast
    // or maybe we just have to wait for something
    page.waitForNetworkIdle({ idleTime: 1500 }),
    page.click("#signInAnotherWay"),
  ]);

  await verificationOptions[verificationOption](page);

  // finish auth (and click on Stay Signed in)
  await page.waitForFunction(
    `window.location.href.startsWith("https://login.microsoftonline.com/common/SAS/ProcessAuth")`,
    { timeout: 0 },
  );
  await page.waitForSelector("input[type=submit]", { visible: true });
  await page.waitForNetworkIdle({ idleTime: 500 });
  await page.click("input[type=submit]");

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
