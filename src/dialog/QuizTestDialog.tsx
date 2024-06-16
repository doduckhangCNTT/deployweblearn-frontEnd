import { Dialog, Transition } from "@headlessui/react";
import React, {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { getApi } from "../utils/FetchData";
import { useDispatch, useSelector } from "react-redux";
import { authSelector } from "../redux/selector/selectors";
import {
  ILesson,
  IQuestion,
  IQuickTest,
  IQuizInfoParam,
} from "../utils/Typescript";
import { alertSlice } from "../redux/reducers/alertSlice";
import { useParams } from "react-router-dom";
import { StatusMakeQuiz } from "../enum/enumeration";

interface IProps {
  text: string;
  className: string;
  quizId: string;
  handleSubmit: Function;
  handleClose: Function;
  indexLesson?: number;
  lesson?: ILesson;
}

type MyComponentHandle = {
  openModalQuiz: Function;
};

const QuizTestDialog = forwardRef<MyComponentHandle, IProps>(
  (
    { text, className, quizId, handleSubmit, handleClose, indexLesson, lesson },
    ref
  ) => {
    let [isOpen, setIsOpen] = useState<boolean>(false);
    const [quickTest, setQuickTest] = useState<IQuickTest>();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isSubmit, setIsSubmit] = useState<boolean>(false);
    const [correctlyQuickTests, setCorrectlyQuickTests] = useState<IQuestion[]>(
      []
    );

    const params = useParams();
    const { courseId } = params;
    const dispatch = useDispatch();
    const { authUser } = useSelector(authSelector);

    /**Đóng popup QR*/
    function closeModal() {
      setIsOpen(false);
      handleClose();
    }

    function openModal() {
      setIsOpen(true);
      handleSubmit();
    }

    useImperativeHandle(ref, () => ({
      openModalQuiz() {
        openModal();
      },
    }));

    /**
     * Xử lí lấy thông tin quiz
     * Created By: DDKhang (08/06/2024)
     */
    const handleGetQuickTest = useCallback(async () => {
      // Kiểm tra người dùng đc phép làm bài quiz
      if (!authUser.access_token) {
        return dispatch(
          alertSlice.actions.alertAdd({ error: "Invalid Authentication" })
        );
      }

      // Kiểm tra user đã mua khóa học này chưa
      const isBuyCourse = authUser.user?.courses.some(
        (course) => course.course === courseId
      );

      if (isBuyCourse) {
        const res = await getApi(`quickTest/${quizId}`, authUser.access_token);

        if (res && res.data && res.data.quickTest) {
          setQuickTest(res.data.quickTest);
        }
      } else {
        alertSlice.actions.alertAdd({ error: "You can't make this quiz" });
      }
    }, [
      authUser.access_token,
      authUser.user?.courses,
      courseId,
      dispatch,
      quizId,
    ]);

    useEffect(() => {
      handleGetQuickTest();
    }, [handleGetQuickTest]);

    // =========================================== Handle Change Input / Submit ========================================================
    const [results, setResults] = useState<string[]>([]);

    let s = "";
    const handleChangeInput = (props: any) => {
      const { e, quickTestOrder } = props as any;
      const { value } = e.target;
      /**
       * Kiem xem the input bấm vào là type:
       *    + CheckBox: thêm giá trị vào mảng result tại cái câu tương ứng
       *    + Radio: Thay thế giá trị ban đầu bằng kết quả mới
       *
       */
      if (e.target.type === "checkbox") {
        /**
         * - Kiểm tra đã có giá trị của câu tương ứng trong mảng result
         */
        if (results[quickTestOrder]) {
          const newString = [];
          /**
           * - Kiểm tra xem trong result của câu tương ứng thì đã tồn tại kết quả đã chọn hay chưa
           */
          const positionChar = results[quickTestOrder].indexOf(
            value.toString()
          );
          if (positionChar !== -1) {
            /**
             * Xóa bỏ giá trị đã tồn tại trong result của câu tương ứng
             */
            for (var i = 0; i < results[quickTestOrder].length; i++) {
              if (results[quickTestOrder][i] !== value.toString()) {
                newString.push(results[quickTestOrder][i]);
              }
            }
            results[quickTestOrder] = newString.join("");
          } else {
            const test = results[quickTestOrder].concat(value.toString());
            results[quickTestOrder] = test;
          }
        } else {
          results[quickTestOrder] = value.toString();
        }
        const test = [...results];
        setResults(test);
      } else {
        s = value;
        results[quickTestOrder] = s;
        const test = [...results];
        setResults(test);
      }
    };

    const joinText = (str: string) => {
      const result = str?.split(/[,.\\s]/);
      const test = [] as string[];
      result.forEach((r) => test.push(r.trim()));

      return test.join("");
    };

    const sortText = (text: string) => {
      const str = joinText(text).split("");
      return str.sort().join("");
    };

    const checkAnswer = () => {
      // Check dap an
      if (quickTest?.questions) {
        for (var i = 0; i < Number(quickTest.questions.length); i++) {
          if (
            sortText(joinText(quickTest.questions[i].correctly)) ===
            sortText(results[i])
          ) {
            correctlyQuickTests.push(quickTest.questions[i]);
          }
        }
      }

      const values = [...correctlyQuickTests];
      setCorrectlyQuickTests(values);
    };

    const handleSubmitQuiz = () => {
      // e.preventDefault();
      // openModal();
      checkAnswer();
      setIsSubmit(!isSubmit);

      // Lưu thông tin điểm của user
      handleSaveResultByUser();
    };

    /**
     * Lưu thông tin điểm của user
     */
    function handleSaveResultByUser() {
      if (quickTest && quickTest.questions) {
        const amountCorrect = correctlyQuickTests.length;

        const point = (
          (amountCorrect / quickTest.questions.length) *
          100
        ).toFixed(2);

        let quizInfo: IQuizInfoParam;

        /**Điểm tối thiếu của bài quiz cần đạt được */
        const pointMinimal = 50;

        if (
          lesson &&
          lesson.quiz &&
          lesson.quiz.status === StatusMakeQuiz.require
        ) {
          quizInfo = {
            quizId: quickTest._id ?? "",
            point: parseFloat(point),
            isCompleted: parseFloat(point) >= pointMinimal,
            pointMinimal: pointMinimal,
          };
        } else {
          // Optional
          quizInfo = {
            quizId: quickTest._id ?? "",
            point: parseFloat(point),
            isCompleted: true,
            pointMinimal: pointMinimal,
          };
        }

        // Lưu thông tin bài quiz
        handleSubmit(quizInfo, indexLesson, lesson);
        // Đóng modal
        closeModal();
      }
    }

    return (
      <>
        <div className={className} onClick={openModal}>
          {text}
        </div>
        <Transition appear show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => {}}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-[1000px] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      <div className="flex justify-between">
                        <div className="">
                          {/* Title of quickTest  */}
                          <div className="text-[30px] font-mono flex justify-center">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: quickTest?.titleTest
                                  ? quickTest.titleTest
                                  : "",
                              }}
                            />
                          </div>
                        </div>
                        <div
                          onClick={closeModal}
                          className="hover:rounded-full text-[20px] hover:bg-slate-200 hover:text-red-600 cursor-pointer w-[20px] h-[20px] flex justify-center items-center p-5"
                        >
                          X
                        </div>
                      </div>
                    </Dialog.Title>
                    <div className="mt-2">
                      <div className="flex gap-2 lg:flex-row md:flex-col-reverse sm:flex-col-reverse flex-col-reverse md:w-full sm:w-full w-full p-2 mx-auto">
                        <div className="flex flex-col gap-2 lg:w-2/3 md:w-full sm:w-full w-full shadow-md p-3">
                          {/* Show all questions of quickTest */}
                          <div className="w-full">
                            <form action="">
                              {quickTest &&
                                quickTest.questions &&
                                quickTest.questions.length &&
                                quickTest?.questions?.map((q, index) => {
                                  return (
                                    <div key={index} className="mt-2">
                                      {/* Hiển thị số câu cho từng câu hỏi */}
                                      <h1 className="text-[20px] flex gap-2">
                                        <div className="">Cau {index + 1}:</div>
                                        <div
                                          className=""
                                          dangerouslySetInnerHTML={{
                                            __html: q.titleQuestion,
                                          }}
                                        />
                                      </h1>
                                      {/* Hiển thị các câu trả lời cho mỗi câu hỏi */}
                                      <div className="ml-[20px]">
                                        {q.answers.map((a, i) => {
                                          return (
                                            <div key={i} className="flex gap-2">
                                              <input
                                                type={q.typeQuestion}
                                                id={`${a.content}`}
                                                name={`${q.titleQuestion}`}
                                                value={i + 1}
                                                onChange={(e) =>
                                                  handleChangeInput({
                                                    e,
                                                    quickTestOrder: index,
                                                  })
                                                }
                                                ref={inputRef}
                                              />
                                              <label
                                                htmlFor={`${a.content}`}
                                                className="text-[16px]"
                                              >
                                                {a.content}
                                              </label>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}

                              <div className="w-full flex justify-end mt-5">
                                <div className="flex items-center justify-center">
                                  <button
                                    onClick={handleSubmitQuiz}
                                    className="rounded-md bg-black bg-opacity-20 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
                                  >
                                    Submit
                                  </button>
                                </div>
                              </div>
                            </form>
                          </div>
                        </div>

                        {/* Control questions  */}
                        <div className="lg:w-1/3 md:w-full sm:w-full w-full shadow-md p-2 sticky top-[60px] bg-white">
                          <div className="">
                            {/* {quickTest && (
                            <CountDownTimer quickTest={quickTest} />
                          )} */}
                          </div>

                          <div>
                            <h2 className="font-mono text-[20px]">
                              Tat ca cac cau da lam
                            </h2>
                            <div className="lg:grid md:flex sm:flex flex gap-2 lg:grid-cols-10 md:grid-cols-6 sm:grid-cols-5">
                              {quickTest &&
                                quickTest.questions &&
                                quickTest.questions.length &&
                                quickTest.questions.map((n, index) => {
                                  return (
                                    <div className="" key={n._id}>
                                      {/* Kiem tra dap an khi da bam vao button Submit */}
                                      {/* Kiểm tra khi chưa bấm vào nút Submit, và ghi nhận các câu đã làm và chưa làm */}
                                      <div className="">
                                        {results[index] === "" ? (
                                          <div
                                            className="
                                                w-[20px] h-[20px] 
                                                p-3 border-2 rounded-full
                                                flex items-center justify-center
                                                hover:opacity-60 cursor-pointer"
                                          >
                                            {index + 1}
                                          </div>
                                        ) : (
                                          /**
                                           * Nếu đã chọn đáp án thì đổi màu
                                           */
                                          <div
                                            className="
                                                w-[20px] h-[20px] 
                                                p-3 border-2 rounded-full
                                                flex items-center justify-center
                                                bg-sky-500 hover:text-white cursor-pointer"
                                          >
                                            {index + 1}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        onClick={closeModal}
                      >
                        Close
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </>
    );
  }
);

export default QuizTestDialog;
