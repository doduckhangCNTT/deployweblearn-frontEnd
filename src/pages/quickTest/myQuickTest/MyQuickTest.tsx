import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  authSelector,
  courseSelector,
  quickTestsSelector,
} from "../../../redux/selector/selectors";
import { IUser } from "../../../utils/Typescript";
import { alertSlice } from "../../../redux/reducers/alertSlice";
import quickTestAction from "../../../redux/action/quickTestAction";

const MyQuickTest = () => {
  const { quickTests } = useSelector(quickTestsSelector);
  const { authUser } = useSelector(authSelector);

  const { courses } = useSelector(courseSelector);

  const dispatch = useDispatch();

  /**
   * Hiển thị thông tin bài kiểm tra
   */
  function handleShowQuickTest() {}

  useEffect(() => {
    if (!authUser || !authUser.access_token || (authUser && !authUser.user)) {
      dispatch(alertSlice.actions.alertAdd({ error: "Invalid access token" }));
    } else {
      quickTestAction.getQuickTests(authUser.access_token, dispatch);
    }
  }, [authUser, dispatch]);

  /**
   * Kiểm tra bài test có tồn tại trong khóa học
   */
  function isExitQuickTestInCourse(quizId: string): boolean {
    if (courses && courses.length) {
      // Danh sách khóa học của user hiện tại
      const coursesOfUser = courses.filter(
        (course) =>
          course.user?._id.toString() === authUser.user?._id.toString()
      );

      if (coursesOfUser && coursesOfUser.length) {
        // Kiểm tra bài học nào chứa thông tin lesson
        coursesOfUser.forEach((course) => {
          course.content.forEach((content) => {
            content.lessons.forEach((lesson) => {
              if (lesson && lesson.quiz && lesson.quiz.quizId === quizId) {
                return true;
              }
            });
          });
        });
      }
    }
    // Trả về
    return false;
  }

  /**
   * Xóa thông tin quickTest
   * @param quickId Mã quickTest
   */
  async function handleDeleteQuickTest(quickId?: string) {
    if (!authUser.access_token) {
      return dispatch(
        alertSlice.actions.alertAdd({ error: "Invalid access token" })
      );
    }
    if (quickId) {
      try {
        // Kiểm tra quickTest đã tồn tại trên course nào chưa
        const isExitQuickTest = isExitQuickTestInCourse(quickId);

        if (isExitQuickTest) {
          const isStatus = window.confirm(
            "Quick Test exited in your course. Are you sure want to delete this quick test?"
          );
          if (isStatus) {
            // Ok
            await quickTestAction.deleteQuickTestId(
              quickId,
              authUser.access_token,
              dispatch
            );
          }
        } else {
          // Xóa trên UI -> xóa trên store
          await quickTestAction.deleteQuickTestId(
            quickId,
            authUser.access_token,
            dispatch
          );
        }
      } catch (error: any) {
        console.error(error);
      }
    }
  }

  return (
    <div>
      <div className="text-[30px] font-bold">My Quick Tests</div>
      <div className="flex gap-[10px] flex-wrap mt-2">
        {quickTests
          .filter(
            (qt) =>
              (qt.user as IUser)?._id.toString() ===
              authUser.user?._id.toString()
          )
          .map((quickTest, index) => (
            <div
              key={index}
              className="w-[350px] border-slate-300 rounded-sm shadow-lg"
            >
              <div className="">
                <img
                  className="w-full h-[250px]"
                  src={quickTest.image?.url as string}
                  alt=""
                />
              </div>
              <div className="mt-2 px-3">
                <div className="flex justify-between">
                  <div
                    onClick={handleShowQuickTest}
                    className="font-bold text-[20px]"
                  >
                    {quickTest.titleTest}
                  </div>
                  {quickTest.statusAccess === "private" ? (
                    <div className="bg-red-500 rounded-lg px-2 text-white">
                      {quickTest.statusAccess}
                    </div>
                  ) : (
                    <div className="bg-blue-500 rounded-lg px-2 text-white">
                      {quickTest.statusAccess}
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-2">
                  <div className="flex gap-2 mt-2">
                    <span>
                      <img
                        className="w-[26px] h-[26px] rounded-full"
                        src={authUser.user?.avatar}
                        alt=""
                      />
                    </span>
                    <span>{authUser.user?.name}</span>
                  </div>

                  <div className="bg-blue-500 rounded-lg text-white flex items-center px-3 cursor-pointer hover:opacity-80">
                    <span>Show</span>
                  </div>
                </div>
              </div>
              <div className="btn-action mt-2 flex">
                <button
                  onClick={() => handleDeleteQuickTest(quickTest._id)}
                  className="w-1/2 bg-red-500 text-white cursor-pointer hover:opacity-80 h-[30px]"
                >
                  Delete
                </button>
                <button className="w-1/2 bg-blue-500 text-white cursor-pointer hover:opacity-80 h-[30px]">
                  Edit
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default MyQuickTest;
