import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import LazyLoadingImg from "../../../components/LazyLoadingImg/LazyLoadingImg";
import categoryAction from "../../../redux/action/categoryAction";
import courseAction from "../../../redux/action/course/courseAction";
import { alertSlice } from "../../../redux/reducers/alertSlice";
import { chooseLessonSlice } from "../../../redux/reducers/course/chooseLessonSlice";
import { courseNowSlice } from "../../../redux/reducers/course/courseNowSlice";
import { courseSlice } from "../../../redux/reducers/course/courseSlice";
import {
  authSelector,
  categorySelector,
  chooseLessonSelector,
  courseNowSelector,
  courseSelector,
  quickTestsSelector,
} from "../../../redux/selector/selectors";
import { getApi, patchApi } from "../../../utils/FetchData";
import {
  FormSubmit,
  IChapter,
  ICourses,
  ILesson,
  InputChangedEvent,
} from "../../../utils/Typescript";
import PreviewCourse from "./PreviewCourse";
import useOptionLocationUrl from "../../../hooks/useOptionLocationUrl";
import quickTestAction from "../../../redux/action/quickTestAction";
import { StatusMakeQuiz } from "../../../enum/enumeration";

const CreateCourse = () => {
  /**
   * Trạng thái khởi tạo chứa thông tin khóa học
   */
  const initialState = {
    name: "",
    thumbnail: {
      public_id: "",
      url: "",
    },
    description: "",
    accessModifier: "private",
    category: "",
    videoIntro: "",
    format: "free",
    price: 0,
    oldPrice: 0,
    // courses: [{ name: "", lessons: [{ name: "", url: "", description: "" }] }],
    content: [] as IChapter[],
  };

  /**Trạng thái khởi tạo chứa thông tin bài học */
  const initialStateLesson = {
    name: "",
    url: "",
    fileUpload: {
      public_id: "",
      secure_url: "",
      mimetype: "",
    },
    description: "",
    quiz: {
      quizId: "",
      completed: false,
      status: "optional",
    },
    statusDoQuiz: "",
  };

  /**Trạng thái khóa học */
  const [course, setCourse] = useState<ICourses>(initialState);
  /**Thông tin khóa học cũ */
  const [courseOld, setCourseOld] = useState<ICourses>();

  /**Trạng thái bài học */
  const [lesson, setLesson] = useState<ILesson>(initialStateLesson);
  /**Trạng thái hiển thị form nhập thông tin bài học */
  const [isShowFormLesson, setIsShowFormLesson] = useState<boolean>(false);
  /**Trạng thái chỉnh sửa khóa học */
  const { mode } = useOptionLocationUrl();

  const [isPaidCourse, setIsPaidCourse] = useState(false);
  const [chooseTypeVideoUpload, setChooseTypeVideoUpload] = useState(false);
  const [chapter, setChapter] = useState<IChapter>();
  const [fileUpload, setFileUpload] = useState<File | string>();

  const { categories } = useSelector(categorySelector);

  /**Thông tin người dùng hiện tại */
  const { authUser } = useSelector(authSelector);
  const { courses } = useSelector(courseSelector);
  const { courseNow } = useSelector(courseNowSelector);
  const { chooseLesson } = useSelector(chooseLessonSelector);
  const { quickTests } = useSelector(quickTestsSelector);

  const dispatch = useDispatch();

  /**
   * Feature: Get multiple
   * Des: Get all category when access page createCourse
   */
  useEffect(() => {
    categoryAction.getCategory(dispatch);
  }, [dispatch]);

  /**KHởi tạo giá trị quiz test */
  useEffect(() => {
    if (!authUser.access_token) {
      dispatch(alertSlice.actions.alertAdd({ error: "Invalid access token" }));
    } else {
      if (!quickTests || !(quickTests && quickTests.length)) {
        quickTestAction.getQuickTests(authUser.access_token, dispatch);
      }
    }
  }, [authUser.access_token, dispatch, quickTests]);

  /**
   * Lấy thông tin khóa học
   */
  const handleGetCourse = useCallback(async () => {
    if (courseNow && courseNow.courseId) {
      const res = await getApi(
        `course/${courseNow.courseId}`,
        authUser.access_token
      );

      if (res && res.data) {
        // Loại bỏ tham chiếu
        const courseNoReference = JSON.parse(JSON.stringify(res.data));
        // Cập nhật
        setCourseOld(courseNoReference);

        if (courses && courses.length) {
          // Cap nhat ngay lap tuc cac lesson tren store ra ben ngoai = cach lay gia tren store
          courses.forEach((course) => {
            // Kiem tra course muon tim kiem co tren store hay ko
            if (course._id === res.data._id) {
              setCourse(course);
              setIsShowFormLesson(true);
            }
          });
        }
      }
    }
  }, [authUser.access_token, courseNow, courses]);

  const handleGetCourses = useCallback(() => {
    if (!authUser.access_token) {
      return dispatch(
        alertSlice.actions.alertAdd({ error: "Invalid Authentication" })
      );
    }
    courseAction.getCourses(authUser.access_token, dispatch);
  }, [authUser.access_token, dispatch]);

  /**
   * Feature: Get single
   * Des: Get info of a course when choose a Id of course corresponding
   */
  useEffect(() => {
    handleGetCourse();
  }, [handleGetCourse]);

  /**
   * Feature:
   * Des: Đặt giá trị các khóa học free = 0
   */
  useEffect(() => {
    if (course.format === "free") {
      setCourse({ ...course, price: 0, oldPrice: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.format]);

  /**
   * Feature: Get multiple
   * Des: Get all courses when access page "createCouse"
   */
  useEffect(() => {
    handleGetCourses();
  }, [handleGetCourses]);

  /**
   * Feature: Get single
   * Des: Get info of lesson with id corresponding when user choose a lesson to edit
   */
  useEffect(() => {
    if (chooseLesson._id) {
      setLesson(chooseLesson);
    }
  }, [chooseLesson]);

  const handleChangeInput_paidCourse = (e: InputChangedEvent) => {
    setIsPaidCourse(!isPaidCourse);
    const { name, value } = e.target;

    setCourse({ ...course, [name]: value });
  };

  /**
   * Xử lí chọn trạng thái làm bài quiz test của bài học
   * @param e
   */
  function handleChooseStatusQuizTest(e: InputChangedEvent) {
    const { name, value } = e.target;
    if (name && value) {
      if (lesson && lesson.quiz) {
        lesson.quiz.status = value;
        setLesson(lesson);
      }
    }
  }

  const handleChangeInput_uploadVideo = () => {
    setChooseTypeVideoUpload(!chooseTypeVideoUpload);
  };

  /**
   * Lấy thông tin thay đổi trên Input
   * @param e Sự kiện thay đổi trên thẻ input
   */
  const handleChangeInput = (e: InputChangedEvent) => {
    e.preventDefault();
    const { name, value } = e.target;
    setCourse({ ...course, [name]: value });
  };

  /**
   * Lấy thông tin thay đổi trên Input file
   * @param e Sự kiện thay đổi trên thẻ input
   */
  const handleChangeInputFile = (e: InputChangedEvent) => {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (files) {
      const file = files[0];
      setCourse({ ...course, thumbnail: { public_id: "", url: file } });
    }
  };

  // -------------------- Handle Course --------------------------
  const handleCourseNow = (e: InputChangedEvent) => {
    e.preventDefault();
    const { value } = e.target;

    if (value) {
      dispatch(courseNowSlice.actions.getCourseIdNow({ courseId: value }));
      // Hiển thị form nhập các bài học
      setIsShowFormLesson(true);
    }
  };

  /**
   * Chọn thông tin quiz test
   * @param e
   */
  const handleQuizTestSelected = (e: InputChangedEvent) => {
    e.preventDefault();
    const { value } = e.target;

    if (value) {
      if (lesson && lesson.quiz) {
        lesson.quiz.quizId = value;
        setLesson(lesson);
      }
    }
  };

  /**
   * Tạo khóa học
   * @param e
   * @returns
   */
  const handleSubmitCourse = async (e: FormSubmit) => {
    e.preventDefault();

    // Cập nhật khóa học
    if (mode === "edit") {
      // Cập nhật thông tin khóa học
      const errors = validCreateCourse();
      if (errors && errors.length) return;
      if (!authUser || !authUser.access_token) {
        return dispatch(
          alertSlice.actions.alertAdd({ error: "Invalid access token" })
        );
      }

      if (course && courseOld) {
        await courseAction.editCourse(
          course,
          courseOld,
          authUser.access_token,
          dispatch
        );
      }
    }
    // Thêm mới khóa học
    else {
      const errors = validCreateCourse();
      if (errors && errors.length) return;

      if (!authUser || !authUser.access_token) {
        return dispatch(
          alertSlice.actions.alertAdd({ error: "Invalid access token" })
        );
      }
      const response = await courseAction.createCourse(
        course,
        authUser.access_token,
        dispatch
      );
      if (response && response.isSuccess && response.courseNew) {
        // Cập nhật thông tin khóa học được chọn
        dispatch(
          courseNowSlice.actions.getCourseIdNow({
            courseId: response.courseNew._id,
          })
        );
        // Cho phép thêm thông tin các bài học
        setIsShowFormLesson(true);
      }
    }
  };

  // -------------------- Handle Chapter --------------------------
  const handleGetChapter = useCallback(async () => {
    if (courseNow && courseNow.chapterId) {
      const res = await getApi(
        `course/${courseNow.courseId}/chapter/${courseNow.chapterId}`,
        authUser.access_token
      );
      setChapter(res.data);
    }
  }, [authUser.access_token, courseNow]);

  useEffect(() => {
    handleGetChapter();
  }, [handleGetChapter]);

  const handleChapterNow = (e: InputChangedEvent) => {
    const { value } = e.target;
    dispatch(courseNowSlice.actions.getChapterIdNow({ chapterId: value }));
  };

  const handleChangeInput_Chapter = (e: InputChangedEvent) => {
    const { value } = e.target;
    setChapter({ name: value, lessons: [] });
  };

  /**
   * Tạo chương cho khóa học
   * @returns
   */
  const handleCreateChapter = async () => {
    if (validCreateChapter().length === 0) {
      if (courseNow && courseNow.courseId === "") {
        setChapter({ name: "", lessons: [] });
        return dispatch(
          alertSlice.actions.alertAdd({ error: "Need create previous course" })
        );
      }
      if (!authUser.access_token) {
        return dispatch(
          alertSlice.actions.alertAdd({ error: "Invalid Authentication" })
        );
      }

      if (chapter) {
        const res = await patchApi(
          `chapter/course/${courseNow.courseId}`,
          chapter,
          authUser.access_token
        );

        if (res && res.data) {
          dispatch(
            courseSlice.actions.createChapterOfCourse({
              courseId: courseNow.courseId,
              content: res.data.content,
            })
          );

          dispatch(
            courseNowSlice.actions.getChapterIdNow({
              chapterId: res.data.content[res.data.content.length - 1]._id,
            })
          );

          dispatch(alertSlice.actions.alertAdd({ success: res.data.msg }));
        }
      }
    }
  };

  // -------------------- Handle Lesson --------------------------
  /**
   * Thêm mới bài học cho khóa học
   */
  const handleAddLesson = () => {
    const errors = validCreateLesson();

    if (!errors || errors.length === 0) {
      if (!authUser.access_token) {
        return dispatch(
          alertSlice.actions.alertAdd({ error: "Invalid Authentication" })
        );
      }

      if (courseNow && !courseNow.chapterId) {
        return dispatch(
          alertSlice.actions.alertAdd({ error: "Need create previous chapter" })
        );
      }

      console.log("info course: ", {
        lesson,
        courseNow,
      });

      // Thêm mới bài học
      courseAction.createLesson(
        { lesson, courseNow, fileUpload },
        authUser.access_token,
        dispatch
      );
    } else {
      // Hiển thị lỗi
      window.alert(errors.join("\n"));
    }
  };

  const handleUpdateLesson = () => {
    const initialStateLesson = {
      name: "",
      url: "",
      fileUpload: {
        public_id: "",
        secure_url: "",
        mimetype: "",
      },
      description: "",
    };

    if (!authUser.access_token) {
      return dispatch(
        alertSlice.actions.alertAdd({ error: "Invalid Authentication" })
      );
    }
    let course = {} as ICourses;

    courses.forEach((item) => {
      if (item._id === courseNow.courseId) {
        return (course = item);
      }
    });
    let newLessons = [] as ILesson[];

    course.content.forEach((c) => {
      if (c._id === courseNow.chapterId) {
        c.lessons.forEach((l) => {
          if (l._id === lesson._id) {
            newLessons = [...newLessons, lesson];
          } else {
            newLessons = [...newLessons, l];
          }
        });
      }
    });

    courseAction.updateLessonsOfChapter(
      {
        courseId: courseNow.courseId,
        chapterId: courseNow.chapterId,
        lessonId: lesson._id ? lesson._id : "",
        newLessons: newLessons,
      },
      authUser.access_token,
      dispatch
    );

    courseAction.getCourses(authUser.access_token, dispatch);

    setLesson(initialStateLesson);
    dispatch(chooseLessonSlice.actions.getLesson({} as ILesson));
    dispatch(courseNowSlice.actions.getChapterIdNow({ chapterId: "" }));
  };

  const handleChangeInput_Lesson = (e: InputChangedEvent) => {
    const { name, value } = e.target;
    if (name && value) {
      setLesson({ ...lesson, [name]: value });
    }
  };

  // ------------------------ Handle Media file ---------------------------------------
  const handleChangeMedia = (e: InputChangedEvent) => {
    const target = e.target as HTMLInputElement;

    const files = target.files;
    if (files) {
      const file = files[0];
      setFileUpload(file);
    }
  };

  const handleDeleteMedia = () => {
    setFileUpload(undefined);
  };

  //  -------------------- Valid ----------------------------
  /**
   * Validate tạo khóa học
   * @returns
   */
  const validCreateCourse = () => {
    if (!course) return [];
    let err = [];

    if (course.name?.trim() === "") {
      err.push("Need Input Name Course");
    }
    // if (course.category?.trim() === "") {
    //   err.push("Provide category to Course");
    // }

    // Hiển thị thông báo lỗi
    if (err && err.length) {
      const error = err.concat("\n");
      dispatch(alertSlice.actions.alertAdd({ error: error }));
    }

    return err;
  };

  const validCreateChapter = () => {
    let err = [];
    if (!chapter || (chapter && chapter.name?.trim() === "")) {
      err.push("Provide chapter");
    }

    const error = err.concat("-");
    if (err.length > 0) {
      dispatch(alertSlice.actions.alertAdd({ error: error }));
    }
    return err;
  };

  const validCreateLesson = () => {
    let err = [];
    if (!courseNow) return [];

    if (courseNow.chapterId === "") {
      err.push("Provide chapter to lesson");
    }
    if (courseNow.courseId === "") {
      err.push("Provide course to lesson");
    }

    if (lesson.name.trim() === "") {
      err.push("Provide lesson name");
    }

    return err;
  };

  /**
   * Lấy thông tin khóa học được chọn để hiển thị trên thẻ select
   * @param courseId Mã khóa học
   * @returns
   */
  function handleShowInfoCourseSelected(courseId?: string): boolean {
    if (mode !== "edit") return false;

    if (courseId) {
      return courses.some((course) => course._id === courseId);
    }
    return false;
  }

  // function handleShowInfoCategorySelected(categoryId?: string): boolean {
  //   if (categoryId) {
  //     return courses.some(
  //       (course) => (course.category as any)._id === categoryId.toString()
  //     );
  //   }
  //   return false;
  // }

  return (
    <div className="flex gap-2">
      <div className=" w-2/3 flex flex-col gap-2">
        {/* Create Course */}
        <div className=" border-2 p-2">
          <div className="flex justify-between">
            {mode === "edit" ? (
              <h1 className="font-bold text-[30px]">Edit Course</h1>
            ) : (
              <h1 className="font-bold text-[30px]">Create Course</h1>
            )}
            {/* Choose a course already exist */}
            <select
              className="w-[300px] border-2"
              name="category"
              onChange={handleCourseNow}
            >
              <option value="">Choose a Course</option>
              {courses &&
                courses.map((course, index) => (
                  <option
                    key={index}
                    value={course._id}
                    className=""
                    selected={handleShowInfoCourseSelected(course._id)}
                  >
                    {course.name} - {course._id?.slice(0, 10)}...
                  </option>
                ))}
            </select>
          </div>
          <form onSubmit={handleSubmitCourse} action="">
            <div className="flex flex-col gap-3">
              {/* Name Course */}
              <div className="flex flex-col gap-2">
                <h1 className="font-bold text-[20px]">Name Course: </h1>
                <input
                  className="border-2 outline-none p-2 w-full rounded-lg"
                  type="text"
                  placeholder="Eg: Reactjs, JavaScript ..."
                  name="name"
                  value={course.name}
                  onChange={handleChangeInput}
                />
              </div>

              {/* Image */}
              <div className="">
                <h1 className="font-bold text-[20px]">Image Course: </h1>
                <input
                  type="file"
                  className=""
                  onChange={handleChangeInputFile}
                />
              </div>

              {/* Description Course */}
              <div className="flex flex-col gap-2">
                <h1 className="font-bold text-[20px]">Description Course: </h1>
                <textarea
                  className="w-full h-[100px] border-2 outline-none p-2 rounded-lg"
                  name="description"
                  id=""
                  value={course.description}
                  onChange={handleChangeInput}
                ></textarea>
              </div>

              {/* Access Modifier */}
              <div className="flex gap-2 items-center">
                <h1 className="font-bold text-[20px]">
                  Access Modifier Course:{" "}
                </h1>
                <div className="flex gap-3">
                  <div className="">
                    <input
                      type="radio"
                      id="public"
                      name="accessModifier"
                      className="mr-2"
                      onChange={handleChangeInput}
                      value="public"
                    />
                    <label htmlFor="public">Public</label>
                  </div>
                  <div className="">
                    <input
                      type="radio"
                      id="private"
                      name="accessModifier"
                      defaultChecked
                      className="mr-2"
                      value="private"
                      onChange={handleChangeInput}
                    />
                    <label htmlFor="private">Private</label>
                  </div>
                </div>
              </div>

              {/* Category Course */}
              <div className="flex flex-col gap-2">
                <h1 className="font-bold text-[20px]">Category Course: </h1>

                <select
                  className="w-[300px] border-2"
                  name="category"
                  onChange={handleChangeInput}
                >
                  <option value="">Choose a category Course</option>
                  {categories?.map((category, index) => (
                    <option key={index} value={category._id} className="">
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Video Introduce */}
              <div className="flex flex-col gap-2">
                <h1 className="font-bold text-[20px]">
                  Video Introduce Course:
                </h1>
                <input
                  className="border-2 outline-none p-2 w-full rounded-lg"
                  type="text"
                  placeholder="Eg: https://www.youtube.com/embed/nameVideo"
                  name="videoIntro"
                  value={course.videoIntro}
                  onChange={handleChangeInput}
                />
              </div>

              {/* Paid Course || Course no paid */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <h1 className="font-bold text-[20px]">Course format: </h1>
                  <div className="flex gap-3">
                    <div className="">
                      <input
                        type="radio"
                        id="paid"
                        name="format"
                        className="mr-2"
                        onChange={handleChangeInput_paidCourse}
                        value="paid"
                      />
                      <label htmlFor="paid">Paid Course</label>
                    </div>
                    <div className="">
                      <input
                        type="radio"
                        id="free"
                        name="format"
                        defaultChecked
                        className="mr-2"
                        onChange={handleChangeInput_paidCourse}
                        value="free"
                      />
                      <label htmlFor="free">Free Course</label>
                    </div>
                  </div>
                </div>

                {isPaidCourse ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <h1 className="font-bold text-[20px]">Price: </h1>
                      <input
                        className="border-2 outline-none w-[100px] rounded-lg"
                        type="text"
                        name="price"
                        value={course.price}
                        onChange={handleChangeInput}
                      />
                    </div>
                    <div className="flex gap-2">
                      <h1 className="font-bold text-[20px]">Old Price: </h1>
                      <input
                        className="border-2 outline-none w-[100px] rounded-lg"
                        type="text"
                        name="oldPrice"
                        value={course.oldPrice}
                        onChange={handleChangeInput}
                      />
                    </div>
                  </div>
                ) : (
                  ""
                )}
              </div>
            </div>

            <div className="flex justify-end">
              {mode === "edit" ? (
                <button
                  type="submit"
                  className="p-2 border-2 rounded-lg hover:bg-sky-500 hover:text-white transition font-bold"
                >
                  Edit Course
                </button>
              ) : (
                <button
                  type="submit"
                  className="p-2 border-2 rounded-lg hover:bg-sky-500 hover:text-white transition font-bold"
                >
                  Create Course
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Chapter && Lesson */}
        {isShowFormLesson && (
          <div className="border-2 p-2">
            <h1 className="font-bold text-[30px]">
              Create Chapter and Lessons
            </h1>
            <div className="">
              {/* Chapter Course */}
              <div className="">
                <div className="flex flex-col gap-2">
                  <h1 className="font-bold text-[20px]">Name Chapter: </h1>
                  <input
                    className="border-2 outline-none p-2 w-full rounded-lg"
                    type="text"
                    placeholder="Eg: Reactjs, JavaScript ..."
                    name="name"
                    value={chapter?.name ? chapter.name : ""}
                    onChange={handleChangeInput_Chapter}
                  />
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    className="
                        p-2 border-2 font-bold
                        hover:bg-sky-500 hover:text-white 
                        rounded-lg transition 
                        "
                    onClick={handleCreateChapter}
                  >
                    Create Chapter
                  </button>
                </div>
              </div>

              {/* Lesson */}
              <div className="flex flex-col gap-2">
                {/* Lesson Name */}
                <div className="flex flex-col gap-2">
                  <h1 className="font-bold text-[20px]">Lesson Name: </h1>
                  <input
                    className="border-2 outline-none p-2 w-full rounded-lg"
                    type="text"
                    name="name"
                    value={lesson.name}
                    onChange={handleChangeInput_Lesson}
                  />
                </div>

                {/* Choose Chapter */}
                <div className="flex flex-col gap-2">
                  <h1 className="font-bold text-[20px]">Choose Chapter: </h1>

                  <select
                    className="w-[300px] border-2"
                    name="category"
                    onChange={handleChapterNow}
                  >
                    <option value="">Choose a Chapter</option>
                    {course.content?.map((c, index) => (
                      <option key={index} value={c._id} className="">
                        {c.name} - {c._id?.slice(0, 10)}...
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description Lesson */}
                <div className="flex flex-col gap-2">
                  <h1 className="font-bold text-[20px]">
                    Description Lesson:{" "}
                  </h1>
                  <textarea
                    className="w-full h-[100px] border-2 outline-none p-2 rounded-lg"
                    name="description"
                    id=""
                    value={lesson.description}
                    onChange={handleChangeInput_Lesson}
                  ></textarea>
                </div>

                {/* Quiz Test */}
                <div className="">
                  <select
                    className="w-[300px] border-2"
                    name="category"
                    onChange={handleQuizTestSelected}
                  >
                    <option value="">Choose a Quiz</option>
                    {quickTests &&
                      quickTests.map((quizItem, index) => (
                        <option key={index} value={quizItem._id} className="">
                          {quizItem.titleTest}
                        </option>
                      ))}
                  </select>

                  <div className="">
                    <div className="">
                      <input
                        type="radio"
                        id="require"
                        name="statusDoQuiz"
                        className="mr-2"
                        onChange={handleChooseStatusQuizTest}
                        value={StatusMakeQuiz.require}
                      />
                      <label htmlFor="require">Require</label>
                    </div>
                    <div className="">
                      <input
                        type="radio"
                        id="optional"
                        name="statusDoQuiz"
                        defaultChecked
                        className="mr-2"
                        onChange={handleChooseStatusQuizTest}
                        value={StatusMakeQuiz.optional}
                      />
                      <label htmlFor="optional">Optional</label>
                    </div>
                  </div>
                </div>

                {/* Path Video or upload Video */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <h1 className="font-bold text-[20px]">
                      Choose Type Upload Video:{" "}
                    </h1>
                    <div className="flex gap-3">
                      <div className="">
                        <input
                          type="radio"
                          id="linkYoutube"
                          name="uploadVideo"
                          className="mr-2"
                          onChange={handleChangeInput_uploadVideo}
                        />
                        <label htmlFor="linkYoutube">Link Youtube</label>
                      </div>
                      <div className="">
                        <input
                          type="radio"
                          id="uploadOnComputer"
                          name="uploadVideo"
                          defaultChecked
                          className="mr-2"
                          onChange={handleChangeInput_uploadVideo}
                        />

                        <label htmlFor="uploadOnComputer">
                          Upload on computer
                        </label>
                      </div>
                    </div>
                  </div>

                  {chooseTypeVideoUpload ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-2">
                        <h1 className="font-bold text-[20px]">Link Video: </h1>
                        <input
                          className="border-2 outline-none w-full rounded-lg"
                          type="text"
                          name="url"
                          value={lesson.url as string}
                          placeholder="Eg: https://www.youtube.com/embed/nameVideo"
                          onChange={handleChangeInput_Lesson}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="">
                      <div className="">
                        <div className="inline-block h-[100px] relative">
                          {fileUpload ? (
                            (fileUpload as File)?.type === "video/mp4" ? (
                              <video controls className="h-full">
                                <source
                                  type="video/mp4"
                                  src={URL.createObjectURL(fileUpload as File)}
                                ></source>
                              </video>
                            ) : (
                              <LazyLoadingImg
                                url={URL.createObjectURL(fileUpload as File)}
                                alt="images"
                                className="h-full"
                              />
                            )
                          ) : (
                            ""
                          )}

                          {fileUpload ? (
                            <div
                              className="
                              absolute 
                              p-1  
                              w-[20px] h-[20px] 
                              top-0 right-0 
                              flex items-center justify-center 
                              hover:bg-slate-100 
                              cursor-pointer 
                              rounded-full 
                              text-sky-500"
                              onClick={handleDeleteMedia}
                            >
                              X
                            </div>
                          ) : (
                            ""
                          )}
                        </div>
                      </div>
                      <input
                        id="dropzone-file"
                        type="file"
                        name="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleChangeMedia}
                      />
                    </div>
                  )}
                </div>

                {/* Button Update / Delete */}
                <div className="flex justify-end">
                  {chooseLesson._id ? (
                    <button
                      onClick={handleUpdateLesson}
                      className="p-2 border-2 rounded-lg hover:bg-sky-500 hover:text-white transition font-bold"
                    >
                      Update Lesson
                    </button>
                  ) : (
                    <button
                      onClick={handleAddLesson}
                      className="p-2 border-2 rounded-lg hover:bg-sky-500 hover:text-white transition font-bold"
                    >
                      Create Lesson
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Course  */}
      <div className="w-1/3">
        <PreviewCourse course={course} />
      </div>
    </div>
  );
};

export default CreateCourse;
