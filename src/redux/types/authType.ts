import { IUser } from "../../utils/Typescript";

export const AUTH = "AUTH";

export interface IAuth {
  msg?: string;
  access_token?: string;
  user?: IUser;
}

export interface IAuthType {
  payload: IAuth;
}

interface INewInfoUser {
  user: IUser;
}

export interface INewInfoUserType {
  payload: INewInfoUser;
}
