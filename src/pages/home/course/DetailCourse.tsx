import { useCallback, useEffect, useState, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ComboboxLessons from "./ComboboxLessons";
import { getApi, postApi } from "../../../utils/FetchData";
import { useDispatch, useSelector } from "react-redux";
import { authSelector } from "../../../redux/selector/selectors";
import { ICourses } from "../../../utils/Typescript";
import CompactParam from "../../../components/CompactParam";
import { Dialog, Transition } from "@headlessui/react";
import commonFunction from "../../../common/commonFunction";
import { TypeBankName } from "../../../enum/enumeration";
import { PAYMENT_INFO } from "../../../constants/paymentInfo";
import { alertSlice } from "../../../redux/reducers/alertSlice";

const DetailCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  /**Trạng thái khóa học */
  const [course, setCourse] = useState<ICourses>();
  /**Thông tin người dùng hiện tại */
  const { authUser } = useSelector(authSelector);
  /**Trạng thái mở QR thanh toán */
  let [isOpen, setIsOpen] = useState(false);

  /**Trạng thái thanh toán khóa học */
  const [isPaidCourse, setIsPaidCourse] = useState(false);
  const [myInterval, setMyInterval] = useState<any>(null);
  const dispatch = useDispatch();

  /**Đóng popup QR*/
  function closeModal() {
    if (myInterval) clearInterval(myInterval);
    setIsOpen(false);
  }

  /**Link QR code */
  const [linkQR, setLinkQR] = useState<string>("");

  /**Mở popup QR */
  async function openModal() {
    if (course && authUser && authUser.user) {
      const bankId = commonFunction.getBankId(TypeBankName.MBBank);
      const descriptionQR = `${course.name}${authUser.user.account.replace(
        /[^\w\s]/g,
        ""
      )}`.toUpperCase();
      // Tạo link QR code
      const linkQR = `https://img.vietqr.io/image/${bankId}-${PAYMENT_INFO.ACCOUNT_NUMBER}-qr_only.png?amount=${course.price}&addInfo=${descriptionQR}&accountName=${PAYMENT_INFO.ACCOUNT_NUMBER}`;
      setLinkQR(linkQR);
      // Mở dialog
      setIsOpen(true);

      if (!isPaidCourse) {
        // Kiểm tra đã thực hiện giao dịch thanh toán khóa học
        setTimeout(() => {
          setMyInterval(
            setInterval(async () => {
              await checkPaid(course.price, descriptionQR);
            }, 1000)
          ); // Phát api check paid cứ sau 1s
        }, 10000); // Bởi người dùng không thực hiện thanh toán ngay mà phải mật chút time để nhập thông tin
      } else {
        clearInterval(myInterval);
        setMyInterval(null); // Ensure state is cleared
        if (myInterval) {
        }
      }
    }
  }

  /**
   * Kiểm tra người dùng đã chuyển khoản khóa học
   * @param price Số tiền chuyển khoản
   * @param contentPaid Nội dung chuyển khoản
   * @returns
   */
  async function checkPaid(price: number, contentPaid: string) {
    if (isPaidCourse) {
      clearInterval(myInterval);
      return;
    }
    try {
      // Cách 1: Thao tác với googleSheet, thông tin chuyển được đc caso bind ra Sheet
      // const res = await fetch(
      //   `https://script.googleusercontent.com/macros/echo?user_content_key=j8DXGPw1aBz4j2CA5Hh6Cem0ncdIBtBKBccxGOuoh0KEqOSvuPeRJNSQV3gY180_DQGJIpkXBfAANJndeinPYpzVQCVrMsxzm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnP9VeXSVBT9_m1HWhsB-raLBeq-2SGV9QTlAxy41shMpxdfNZK6EJiiywrHwiKyqgL2zSnSS54OFV-M-Dt1qvLkzHqdz8bMcFg&lib=M_AlnIyz5csmSZkojIpmzQ19_AjyLwf7j`
      // );

      // Cách 2: Gọi trực tiếp api của Casso để lấy các giao dịch
      const res = await fetch(`https://oauth.casso.vn/v2/transactions`, {
        headers: {
          Authorization: `apikey ${PAYMENT_INFO.API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      if (!res) return;
      const dataPaid = await res.json();
      if (dataPaid && dataPaid.error === 0 && dataPaid.data) {
        dispatch(alertSlice.actions.alertAdd({ loading: true }));

        if (dataPaid.data.records && dataPaid.data.records.length) {
          const lastPaid =
            dataPaid.data.records[dataPaid.data.totalRecords - 1];
          // Thanh toán khóa học
          if (
            lastPaid.amount >= 1000 &&
            lastPaid.description.includes(contentPaid) // Kiểm tra nội dung chuyển khoản có chứa nội dung theo yêu cầu
          ) {
            if (course) {
              // Chuyển hướng đến chi tiết khóa học
              navigate(`/startCourse/${course._id}`);
              if (authUser && authUser.user) {
                const data = {
                  /**Mã khóa học */
                  courseId: courseId,
                  /**Mã người dùng */
                  userId: authUser.user._id,
                  /**Tiến trình khóa học */
                  progressLesson: "",
                  lessonId: "",
                };
                const res = await postApi(
                  `course/user`,
                  data,
                  authUser.access_token
                );
                if (res && res.data) {
                  setIsPaidCourse(true);
                  console.log("Data1: ", res.data);
                }
              }
            }
            // Giao dịch thành công
            setIsPaidCourse(true);
          } else {
            alertSlice.actions.alertAdd({
              error: "Information payment invalidate",
            });
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      dispatch(alertSlice.actions.alertAdd({ loading: false }));
      window.location.reload();
    }
  }

  /**
   * Lấy thông tin khóa học
   */
  const handleGetCourse = useCallback(
    async (courseId: string) => {
      if (courseId) {
        const res = await getApi(`course/${courseId}`, authUser.access_token);
        if (res && res.data) {
          setCourse(res.data);
        }
      }
    },
    [authUser.access_token]
  );

  useEffect(() => {
    if (courseId) {
      handleGetCourse(courseId);
    }
  }, [handleGetCourse, courseId]);

  /**
   * Xử lí bắt đầu khóa học
   */
  async function handleStartCourse() {
    if (course) {
      // 1. Kiểm tra khóa học là mất phí => Xuất QR thanh toán
      if (course.format === "paid") {
        /**Trạng thái đăng kí khóa học */
        let isCourseSigned = false;
        // Kiểm tra người dùng đã mua khóa học chưa
        if (
          authUser &&
          authUser.user &&
          authUser.user.courses &&
          authUser.user.courses.length
        ) {
          isCourseSigned = authUser.user.courses.some(
            (courseItem) =>
              courseItem.course.toString() === course._id?.toString()
          );
        }
        if (isCourseSigned) {
          // Chuyển hướng đến chi tiết khóa học
          // navigate(`/startCourse/${course._id}`);
          handleProgressCourseOfUser(course);
        } else {
          // 1.1 Thực hiện thanh toán thì bắt đầu học
          openModal();
        }
      }
      // 2. Nếu khóa học ko mất phí => bắt đầu học
      else {
        handleProgressCourseOfUser(course);
      }
    }
  }

  /**
   * Xử lí tiến trình khóa học
   */
  function handleProgressCourseOfUser(course: ICourses) {
    // 1. Khóa học này đã được đăng kí trước đó bởi người dùng
    if (
      authUser &&
      authUser.user &&
      course &&
      authUser.user.courses &&
      authUser.user.courses.length
    ) {
      let courseSigned = authUser.user.courses.find(
        (courseItem) => courseItem.course.toString() === course._id?.toString()
      );
      // 2. Có => Lấy thông tin progress của user
      if (courseSigned && courseSigned.lessonId) {
        navigate(
          `/startCourse/${
            course._id
          }/lesson/${courseSigned.lessonId.toString()}`
        );
      } else {
        // Điều hướng sang trang bắt đầu học
        navigate(`/startCourse/${course._id}`);
      }
    }
  }

  return (
    <>
      <div className="flex lg:flex-row md:flex-col sm:flex-col flex-col gap-2">
        <div className="lg:w-2/3 md:w-full sm:w-full">
          <div className="my-3">
            <h1 className="font-bold text-[30px]">{course?.name}</h1>
            <div className="">
              <CompactParam
                param={course?.description ? course.description : ""}
                quantitySlice={200}
                fontText="font-mono"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <div className=" w-2/3 h-full">
              <div className="">
                <div className="">
                  {course?.content.map((co, index) => {
                    return (
                      <div className="" key={index}>
                        <ComboboxLessons chapter={co} />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className=""></div>
            </div>
          </div>
        </div>

        {/* Man hinh xem */}
        <div className="lg:w-1/3 md:w-full sm:w-full w-full  my-[20px]">
          <div className="shadow-md border-2 rounded-lg p-2">
            <h1 className="font-bold text-[30px]">Course Introduce</h1>
            {/* Video introduce */}
            <div className="">
              <iframe
                className="w-full lg:h-[300px] md:h-[500px] sm:h-[500px] h-[500px]"
                src={course?.videoIntro}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="flex justify-center mt-5">
              <div
                className="border-2 p-2 rounded-lg text-[20px] text-white font-bold bg-sky-300 hover:opacity-80 cursor-pointer"
                onClick={() => handleStartCourse()}
              >
                Start Course
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog QR thanh toán */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Payment successful
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-md text-gray-500">
                      You need to payment to start this course
                    </p>
                    {/* QR */}
                    <div className="flex justify-center">
                      <img
                        className="w-[200px] h-[200px]"
                        src={linkQR}
                        alt=""
                      />
                    </div>
                    <p>
                      Note: You only need to payment then course will automatic
                      open.
                    </p>
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
};

export default DetailCourse;
