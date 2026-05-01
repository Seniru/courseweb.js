import EventEmitter from "events";

import { RegistrationNumber } from "./types/userMetadata.js";
import { SERVER_PREFIX } from "./constants/common.js";
import { sessionStrategy } from "./auth/strategies/session.js";
import { browserInteractionStrategy } from "./auth/strategies/browserInteraction.js";
import {
  LoginStrategies,
  LoginStrategy,
  VerificationOption,
} from "./types/loginStrategies.js";
import { CourseWebClientEvents } from "./types/events.js";
import { browserAutomaticStrategy } from "./auth/strategies/browserAutomatic.js";

class Client extends (EventEmitter as new () => CourseWebClientEvents) {
  registrationNumber: RegistrationNumber;

  private moodleSession: string | null = null;
  private sessionKey: string | null = null;

  constructor(registrationNumber: RegistrationNumber) {
    super();
    this.registrationNumber =
      registrationNumber.toLowerCase() as RegistrationNumber;
  }

  login(): LoginStrategies {
    const applyLoginStrategy = <T extends unknown[] = unknown[]>(
      strategy: LoginStrategy<T>,
    ) => {
      return async (...args: T) => {
        const { moodleSession, sessionKey } = await strategy(...args);
        this.moodleSession = moodleSession;
        this.sessionKey = sessionKey;
        this.emit("login");
      };
    };

    return {
      withSession: applyLoginStrategy(sessionStrategy),
      withBrowserInteraction: applyLoginStrategy(browserInteractionStrategy),
      withBrowserAutomation: applyLoginStrategy(
        (password: string, verificationOption: VerificationOption) =>
          browserAutomaticStrategy(
            this.registrationNumber,
            password,
            verificationOption,
          ),
      ),
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
