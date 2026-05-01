import { CaseInsensitive } from "./common.js";

export type Department = "IT" | "EN" | "BS" | "HS";
export type DepartmentPrefix = CaseInsensitive<Department>;
export type RegistrationNumber = `${DepartmentPrefix}${number}`;

