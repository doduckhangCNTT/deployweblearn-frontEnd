import { AppDispatch } from "./Typescript";
import jwt_decode from "jwt-decode";
import { getApi } from "./FetchData";
import { alertSlice } from "../redux/reducers/alertSlice";

interface IDecode {
  exp: number;
  iat: number;
  id: string;
}

/**
 * Kiểm tra xem token người dùng đã hết hạn chưa
 * @param token Token người dùng đăng nhập
 * @param dispatch
 * @returns
 */
export const checkTokenExp = async (token: string, dispatch: AppDispatch) => {
  if (token) {
    const decode: IDecode = jwt_decode(token);

    // Chưa hết hạn token
    if (decode.exp >= Date.now() / 1000) return;

    // Hết hạn -> Lấy thông tin token mới
    const res = await getApi("refresh_token");
    // await actionAuth.refreshAction(dispatch);
    // console.log("ACCESS_TOKEN: ", res.data);
    if (res && res.data) {
      return res.data.access_token;
    }
    return "";
  } else {
    dispatch(alertSlice.actions.alertAdd({ error: "Invalid Authentication" }));
  }
};
