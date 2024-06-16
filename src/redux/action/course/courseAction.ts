import { checkTokenExp } from "../../../utils/CheckTokenExp";
import { getApi, patchApi, postApi } from "../../../utils/FetchData";
import { AppDispatch, ICourses, ILesson } from "../../../utils/Typescript";
import { alertSlice } from "../../reducers/alertSlice";
import { courseSlice } from "../../reducers/course/courseSlice";

interface IDataLesson {
  courseId: string;
  chapterId: string;
  lessonId: string;
  newLessons: ILesson[];
}

const courseAction = {
  getCourses: async (token: string, dispatch: AppDispatch) => {
    const result = await checkTokenExp(token, dispatch);
    const access_token = result ? result : token;

    try {
      dispatch(alertSlice.actions.alertAdd({ loading: true }));

      const res = await getApi("courses", access_token);
      dispatch(courseSlice.actions.getCourses(res.data));

      dispatch(alertSlice.actions.alertAdd({ loading: false }));
    } catch (error: any) {
      dispatch(alertSlice.actions.alertAdd({ error: error.message }));
    }
  },

  /**
   * Tạo khóa học
   * @param course Thông tin khóa học
   * @param token Token người dùng đăng nhập
   * @param dispatch
   */
  createCourse: async (
    course: ICourses,
    token: string,
    dispatch: AppDispatch
  ) => {
    const result = await checkTokenExp(token, dispatch);
    const access_token = result ? result : token;

    try {
      dispatch(alertSlice.actions.alertAdd({ loading: true }));

      let data;
      if (
        course &&
        course.thumbnail &&
        course.thumbnail.url &&
        typeof course.thumbnail.url === "string"
      ) {
        data = {
          public_id: course.thumbnail.public_id,
          url: course.thumbnail.url,
        };
      } else {
        let formData = new FormData();
        formData.append("file", course.thumbnail.url);
        const resImg = await postApi("upload", formData, access_token);

        if (resImg && resImg.data) {
          data = { public_id: resImg.data.public_id, url: resImg.data.url };
        } else {
          data = {};
        }
      }

      // Thông tin khóa học mới
      const newCourse = {
        ...course,
        thumbnail: data,
      };
      const res = await postApi("course", newCourse, access_token);

      if (res && res.data && res.data.error) {
        dispatch(alertSlice.actions.alertAdd({ error: res.data.error }));
      } else if (res && res.data && res.data.newCourse) {
        dispatch(
          courseSlice.actions.createCourse(res.data.newCourse as ICourses)
        );
        dispatch(alertSlice.actions.alertAdd({ success: res.data.msg }));
        return {
          courseNew: res.data.newCourse,
          isSuccess: true,
        };
      }
      return { isSuccess: false };
    } catch (error: any) {
      dispatch(alertSlice.actions.alertAdd({ error: error.message }));
    }
  },

  /**
   * Cập nhật thông tin khóa học
   * @param course Thông tin khóa học mới
   * @param courseOld Thông tin khóa học cũ
   * @param token
   * @param dispatch
   */
  editCourse: async (
    course: ICourses,
    courseOld: ICourses,
    token: string,
    dispatch: AppDispatch
  ) => {
    try {
      const result = await checkTokenExp(token, dispatch);
      const access_token = result ? result : token;

      dispatch(alertSlice.actions.alertAdd({ loading: true }));

      let dataThumbnail;
      if (course && courseOld) {
        // 1. Kiểm tra xem hình ảnh có thay đổi => upload lại
        if (course.thumbnail.public_id !== courseOld.thumbnail.public_id) {
          let formData = new FormData();
          formData.append("file", course.thumbnail.url);
          const resImg = await postApi("upload", formData, access_token);

          if (resImg && resImg.data) {
            dataThumbnail = {
              public_id: resImg.data.public_id,
              url: resImg.data.url,
            };
          }
        }
      }
      if (dataThumbnail) {
        course = {
          ...course,
          thumbnail: dataThumbnail,
        };
      }
      // Cập nhật thông tin khóa học
      const res = await patchApi("course", course, access_token);

      if (res && res.data) {
        if (res.data.error) {
          dispatch(alertSlice.actions.alertAdd({ error: res.data.error }));
        } else if (res.data.success) {
          dispatch(
            alertSlice.actions.alertAdd({
              success: "Update course successfully abc12.",
            })
          );
        }
      }
    } catch (error: any) {
      dispatch(alertSlice.actions.alertAdd({ error: error.message }));
    }
  },

  /**
   * Thêm mới bài học
   * @param value
   * @param token
   * @param dispatch
   * @returns
   */
  createLesson: async (
    value: {
      lesson: ILesson;
      courseNow?: {
        courseId: string;
        chapterId: string;
      };
      fileUpload: File | string | undefined;
    },
    token: string,
    dispatch: AppDispatch
  ) => {
    const result = await checkTokenExp(token, dispatch);
    const access_token = result ? result : token;

    if (!value) {
      window.alert("You need enter enough lesson information.");
      return;
    }
    try {
      dispatch(alertSlice.actions.alertAdd({ loading: true }));
      // Neu ma fileUpload co gia tri thi mac dinh duong dan youtube se khong co gia tri
      if (value.fileUpload) {
        let formData = new FormData();
        formData.append("file", value.fileUpload);
        const res = await postApi("upload_imgVideo", formData, access_token);

        if (res && res.data) {
          value.lesson = {
            ...value.lesson,
            url: "",
            fileUpload: {
              public_id: res.data.public_id,
              secure_url: res.data.secure_url,
              mimetype: res.data.resource_type,
            },
          };
        }
      }

      const res = await postApi(
        `course/${value.courseNow?.courseId}/chapter/${value.courseNow?.chapterId}/lesson`,
        value.lesson,
        access_token
      );

      if (res && res.data) {
        dispatch(
          courseSlice.actions.addLessonInChapter({
            courseId: value.courseNow?.courseId,
            content: res.data.content,
          })
        );
        dispatch(alertSlice.actions.alertAdd({ success: res.data.msg }));
      }
    } catch (error: any) {
      dispatch(alertSlice.actions.alertAdd({ error: error.message }));
    }
  },

  updateCourse: async (token: string, dispatch: AppDispatch) => {
    // const result = await checkTokenExp(token, dispatch);

    try {
      dispatch(alertSlice.actions.alertAdd({ loading: true }));

      dispatch(alertSlice.actions.alertAdd({ loading: false }));
    } catch (error: any) {
      dispatch(alertSlice.actions.alertAdd({ error: error.message }));
    }
  },

  updateLessonsOfChapter: async (
    data: IDataLesson,
    token: string,
    dispatch: AppDispatch
  ) => {
    const result = await checkTokenExp(token, dispatch);
    const access_token = result ? result : token;

    try {
      dispatch(alertSlice.actions.alertAdd({ loading: true }));
      const { courseId, chapterId, lessonId, newLessons } = data;
      const res = await patchApi(
        `courses/${courseId}/chapter/${chapterId}/lesson/${lessonId}`,
        newLessons,
        access_token
      );

      console.log("Res: ", res);

      dispatch(alertSlice.actions.alertAdd({ success: res.data.msg }));
    } catch (error: any) {
      dispatch(alertSlice.actions.alertAdd({ error: error.message }));
    }
  },

  deleteCourse: async (
    course: ICourses,
    token: string,
    dispatch: AppDispatch
  ) => {
    // const result = await checkTokenExp(token, dispatch);
    // const access_token = result ? result : token;

    try {
      dispatch(alertSlice.actions.alertAdd({ loading: true }));

      dispatch(alertSlice.actions.alertAdd({ loading: false }));
    } catch (error: any) {
      dispatch(alertSlice.actions.alertAdd({ error: error.message }));
    }
  },
};

export default courseAction;
