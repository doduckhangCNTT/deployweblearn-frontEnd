import { createSlice } from "@reduxjs/toolkit";
import { IAuth, IAuthType, INewInfoUserType } from "../types/authType";
import { IUploadImg } from "../types/uploadType";

const initialState: IAuth = {};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authUser: (state, action: IAuthType) => {
      return action.payload;
    },

    uploadImg: (state, action: IUploadImg) => {
      return { ...state, user: action.payload };
    },

    /**
     * Cập nhật thông tin mới người dùng từ db lên store
     * @param state
     * @param action
     * @returns
     */
    updateNewInfoUser: (state, action: INewInfoUserType) => {
      return { ...state, user: action.payload.user };
    },
  },
});
