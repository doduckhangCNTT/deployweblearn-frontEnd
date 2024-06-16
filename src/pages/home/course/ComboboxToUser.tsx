import React, {
  useCallback,
  useEffect,
  useState,
  Fragment,
  useRef,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  IChapter,
  ICourses,
  ILesson,
  IQuizInfoParam,
} from "../../../utils/Typescript";
import { postApi } from "../../../utils/FetchData";
import { useDispatch, useSelector } from "react-redux";
import { authSelector } from "../../../redux/selector/selectors";
import actionAuth from "../../../redux/action/actionAuth";
import QuizTestDialog from "../../../dialog/QuizTestDialog";
import { StatusMakeQuiz } from "../../../enum/enumeration";

interface IProps {
  chapter: IChapter;
  course: ICourses;
  progressCallBack?: Function;
}

const ComboboxToUser: React.FC<IProps> = ({
  chapter,
  course,
  progressCallBack,
}) => {
  const [toggle, setToggle] = useState(true);
  const params = useParams();
  const { courseId, lessonId } = params;
  const navigate = useNavigate();
  /**Thông tin người dùng hiện tại */
  const { authUser } = useSelector(authSelector);
  const dispatch = useDispatch();
  const [lessons, setLessons] = useState<ILesson[]>();

  const handleGetNewInfoOfUserById = useCallback(async () => {
    if (authUser && authUser.user) {
      const newInfoUser = {
        user: authUser.user,
        access_token: authUser.access_token,
      };

      actionAuth.updateNewInfoForUser(newInfoUser, dispatch);
    }
  }, [authUser, dispatch]);

  useEffect(() => {
    if (authUser && authUser.user) {
      if (chapter && chapter.lessons && chapter.lessons.length) {
        // Danh sách khóa học hoàn thành
        const lessonsNew = chapter.lessons.map((lesson) => {
          const isComplete =
            authUser.user?.courses.some(
              (course) =>
                course &&
                course.lessons &&
                course.lessons.length &&
                course.lessons.some(
                  (lessonItem) =>
                    lessonItem.lessonId.toString() === lesson._id?.toString()
                )
            ) || false;
          lesson.isCompleted = isComplete;
          return lesson;
        });
        if (lessonsNew && lessonsNew.length) {
          setLessons(lessonsNew);
        }
      }
    } else {
      window.alert("You need to login");
    }
  }, [authUser, chapter]);

  /**
   * Tham chiếu đến quiz
   */
  const quizRef = useRef<any>(null);

  /**
   * Di chuyển đến bài học tiếp theo
   * @param indexLesson Thứ tự bài học
   * @param lesson Thông tin bài học
   */
  async function nextLesson(indexLesson: number, lesson: ILesson) {
    if (course && lesson) {
      // Kiểm tra quiz của lesson đã hoàn thành chưa
      const isCompletedQuizOfUser = isCompletedQuiz(lesson);

      // Kiểm tra bài học có quiz bắt buộc hay không
      if (
        lesson.quiz &&
        lesson.quiz.status === StatusMakeQuiz.require &&
        !isCompletedQuizOfUser
      ) {
        // Di chuyển đến bài quiz
        if (quizRef.current) {
          quizRef.current.openModalQuiz();
        }
      } else {
        // 1. Di chuyển đến bài học tiếp theo
        navigate(`/startCourse/${course._id}/lesson/${lesson._id}`);
        // Lưu thông tin bài học
        await handleAddLessonLearned(lesson);
        handleProgressCourse();
        // 2. Lưu lại tiến trình học của người dùng
        await saveProgressLesson(indexLesson, lesson);
      }
    }
  }

  /**
   * Kiểm tra xem quiz của lesson đã hoàn thành chưa
   * @param lesson Lesson được chọn
   * @returns
   */
  function isCompletedQuiz(lesson: ILesson) {
    if (
      authUser &&
      authUser.user &&
      authUser.user.courses &&
      authUser.user.courses.length
    ) {
      const courseNow = authUser.user?.courses.find(
        (course) => course.course === courseId
      );

      if (courseNow && courseNow.lessons && courseNow.lessons.length) {
        const lessonNow = courseNow.lessons.find(
          (lessonItem) =>
            lessonItem.lessonId.toString() === lesson._id?.toString()
        );

        if (
          lesson &&
          lesson.quiz &&
          lesson.quiz.status === StatusMakeQuiz.require
        ) {
          if (lessonNow && lessonNow.quiz) {
            return lessonNow.quiz.completed;
          } else {
            return lesson.quiz.completed;
          }
        }
        // true ở đây có thể hiểu là không có bài quiz
        return true;
      }
    }
  }

  /**
   * Tính toán phần trăm hoàn thành khóa học
   * @returns
   */
  function handleProgressCourse() {
    if (!authUser || (authUser && !authUser.user)) return;

    if (
      authUser.user &&
      authUser.user.courses &&
      authUser.user.courses.length
    ) {
      const courseNow = authUser.user.courses.find(
        (course) => course.course.toString() === courseId
      );
      if (courseNow && courseNow.lessons && courseNow.lessons.length) {
        const amountLessonOfUser = courseNow.lessons.length;
        let totalAmountLessonOfCourse = 0;
        course.content.forEach((contentItem) => {
          if (
            contentItem &&
            contentItem.lessons &&
            contentItem.lessons.length
          ) {
            totalAmountLessonOfCourse += contentItem.lessons.length;
          }
        });
        const percentCompleted = Math.round(
          (amountLessonOfUser / totalAmountLessonOfCourse) * 100
        );
        if (progressCallBack) {
          handleGetNewInfoOfUserById();
          progressCallBack(percentCompleted);
        }
      }
    }
  }

  /**
   * Thêm mới thông tin bài học hoàn thành của người dùng
   * @param lesson Thông tin bài học
   */
  async function handleAddLessonLearned(lesson: ILesson) {
    try {
      if (authUser && authUser.user && lesson) {
        let data: any = {
          userId: authUser.user._id,
          courseId: courseId,
          lessonId: lesson._id,
        };
        // Nếu có thông tin quiz ở trạng thái bắt buộc
        if (lesson.quiz) {
          data.quiz = {
            quizId: lesson.quiz.quizId,
            completed: lesson.quiz.completed,
          };
          const res = await postApi(
            `course/lesson`,
            data,
            authUser.access_token
          );
          if (res && res.data) {
            return res.data.success;
          }
        } else {
          // Lưu thông tin bài học
          const res = await postApi(
            `course/lesson`,
            data,
            authUser.access_token
          );
          if (res && res.data) {
            return res.data.success;
          }
        }
      }
      return false;
    } catch (error: any) {
      console.error(error);
    }
  }

  /**
   * Lưu tiến trình bài học của người dùng
   * @param indexLesson Thứ tự bài học
   */
  async function saveProgressLesson(indexLesson: number, lesson: ILesson) {
    try {
      if (authUser && authUser.user && lesson) {
        const data = {
          /**Mã khóa học */
          courseId: courseId,
          /**Mã người dùng */
          userId: authUser.user._id,
          /**Tiến trình khóa học */
          progressLesson: indexLesson,
          lessonId: lesson._id,
        };
        await postApi(`course/user`, data, authUser.access_token);
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Lưu thông tin điểm của học viên
   * Created By: DDKhang (08/06/2024)
   */
  async function handleSubmitQuizModal(
    quizInfo: IQuizInfoParam,
    indexLesson: number,
    lesson: ILesson
  ) {
    if (quizInfo && lesson && lesson.quiz) {
      (lesson.quiz as any).completed = quizInfo.isCompleted;
      (lesson.quiz as any).quizId = quizInfo.quizId;

      if (lesson.quiz && lesson.quiz.status === StatusMakeQuiz.require) {
        // 1. Di chuyển đến bài học tiếp theo
        navigate(`/startCourse/${course._id}/lesson/${lesson._id}`);
        // Lưu thông tin bài học
        await handleAddLessonLearned(lesson);
        handleProgressCourse();
        // 2. Lưu lại tiến trình học của người dùng
        await saveProgressLesson(indexLesson, lesson);
      } else {
        nextLesson(indexLesson, lesson);
      }
    }
  }

  function handleCloseQuizModal() {}

  function handleClassNameShowCompletedQuizOfLesson(lesson: ILesson) {
    const isCompletedQuizOfLesson = isCompletedQuiz(lesson);

    if (lesson && lesson.quiz && isCompletedQuizOfLesson) {
      return "font-bold px-5 py-2 hover:text-blue-500  bg-green-400 rounded-[100px] cursor-pointer";
    } else {
      return "font-bold px-5 py-2 hover:text-blue-500 bg-slate-200 rounded-[100px] cursor-pointer";
    }
  }

  return (
    <>
      <div className="">
        {/* Name chapter */}
        <button
          className="
                  w-full flex justify-between 
                  text-sm px-4 py-2.5 border-2 
                  text-center items-center
                  hover:bg-slate-200 
                  focus:outline-none font-medium 
                  "
          onClick={() => setToggle(!toggle)}
        >
          <h1 className="">{chapter.name}</h1>
          <svg
            className="ml-2 w-4 h-4"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </button>

        <div
          className={`${
            toggle ? "" : "hidden"
          } z-10 w-full bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600`}
        >
          {lessons &&
            lessons.map((les, i) => {
              return (
                <ul
                  key={i}
                  className="p-3 space-y-3 text-sm text-gray-700 dark:text-gray-200"
                  aria-labelledby="dropdownRadioButton"
                >
                  <li
                    className={`${
                      lessonId === les._id ? "bg-sky-200 rounded-full p-1" : ""
                    }`}
                  >
                    <div className="flex justify-between cursor-pointer">
                      <div className="hover:bg-slate-100 rounded-[15px] flex items-center w-full px-2">
                        {/* Hiển thị trạng thái hoàn thành bài học */}
                        {les && les.isCompleted ? (
                          <span className="">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.5"
                              stroke="currentColor"
                              className="w-6 h-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                              />
                            </svg>
                          </span>
                        ) : (
                          <span></span>
                        )}

                        <div className="flex justify-between items-center w-full">
                          {/* Tên bài học */}
                          <label
                            onClick={() => nextLesson(i + 1, les)}
                            htmlFor={les._id}
                            className="ml-2 w-full py-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer"
                          >
                            {les.name}
                          </label>
                          {/* Bài quiz */}
                          {les && les.quiz && les.quiz.quizId && (
                            <div>
                              <QuizTestDialog
                                ref={quizRef}
                                text="Quiz"
                                quizId={les.quiz.quizId}
                                lesson={les}
                                className={handleClassNameShowCompletedQuizOfLesson(
                                  les
                                )}
                                handleClose={handleCloseQuizModal}
                                handleSubmit={handleSubmitQuizModal}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              );
            })}
        </div>
      </div>
    </>
  );
};

export default ComboboxToUser;
