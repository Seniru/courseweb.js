import EventEmitter from "events";
import { RegistrationNumber } from "./types/userMetadata.js";
import puppeteer from "puppeteer";

const SERVER_PREFIX = "https://courseweb.sliit.lk";

class Client extends EventEmitter {
  registrationNumber: RegistrationNumber;

  private moodleSession: string | null = null;
  private sessionKey: string | null = null;

  constructor(registrationNumber: RegistrationNumber) {
    super();
    this.registrationNumber =
      registrationNumber.toLowerCase() as RegistrationNumber;
  }

  login() {
    return {
      withSession: async (moodleSession: string, sessionKey: string) => {
        this.moodleSession = moodleSession;
        this.sessionKey = sessionKey;
        this.emit("login");
      },

      withBrowserInteraction: async () => {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.goto(SERVER_PREFIX);
        await page.click(".login-identityprovider-btn");

        await page.waitForFunction(
          `window.location.href.startsWith('${SERVER_PREFIX}/my')`,
          { timeout: 0 },
        );
        this.sessionKey =
          (await page.content()).match(/"sesskey":"(\w+)"/)?.[1] || null;
        this.moodleSession = (await browser.cookies()).filter(
          (cookie) => cookie.name == "MoodleSession",
        )[0].value;
        await browser.close();
        this.emit("login");
      },
    };
  }

  //https://doodlezucc.github.io/MoodleREST/
  async invokeMoodleService(methodName: string, args: any) {
    const response = await fetch(
      `${SERVER_PREFIX}/lib/ajax/service.php?sesskey=${this.sessionKey}`,
      {
        method: "POST",
        headers: {
          accept: "application/json, text/javascript, */*; q=0.01",
          "content-type": "application/json",
          cookie: `MoodleSession=${this.moodleSession}`,
        },
        body: JSON.stringify([
          {
            methodname: methodName,
            args,
          },
        ]),
      },
    );
    const result = await response.json();
    return result;
  }

  async getSiteInfo() {
    const res = await this.invokeMoodleService(
      "core_webservice_get_site_info",
      {},
    );
    return res;
  }

  async getNotifications() {
    const res = await this.invokeMoodleService(
      "message_popup_get_popup_notifications",
      { offset: 0, limit: 10, useridto: 0 },
    );
    return res[0].data;
  }

  async getEnrolledCourses() {
    const res = await this.invokeMoodleService(
      "core_course_get_enrolled_courses_by_timeline_classification",
      { classification: "all" },
    );
    return res[0].data;
  }

  async getAssignments() {
    const res = await this.invokeMoodleService(
      "mod_assign_get_assignments",
      {},
    );
    return res;
  }
}

export default Client;
