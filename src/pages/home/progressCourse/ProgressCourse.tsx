import { useSelector } from "react-redux";
import FrameList from "../common/FrameList";
import {
  authSelector,
  courseSelector,
} from "../../../redux/selector/selectors";
import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ICourses } from "../../../utils/Typescript";

const ProgressCourse = () => {
  const { courses } = useSelector(courseSelector);
  const { authUser } = useSelector(authSelector);

  /**Chứa thông tin khóa học người dùng đăng kí */
  const [coursesUser, setCoursesUser] = useState<ICourses[]>();

  useEffect(() => {
    if (authUser && authUser.user) {
      const coursesUser = authUser.user.courses;
      if (coursesUser && coursesUser.length > 0) {
        const coursesUserDetail = coursesUser.map((course) => {
          const infoCourse = courses.find((c) => c._id === course.course);
          return infoCourse!;
        });
        if (coursesUserDetail && coursesUserDetail.length > 0) {
          setCoursesUser(coursesUserDetail);
        }
      }
    }
  }, [authUser, courses]);

  return (
    <>
      {coursesUser && coursesUser.length > 0 && (
        <FrameList titleList="Progress Course">
          <>
            {coursesUser.map((course, index) => {
              return (
                <Fragment key={index}>
                  {course && course.thumbnail && course.name && (
                    <div className="border-2 rounded-lg hover:shadow-md gap-3">
                      <Link
                        to={`course/${course?.name
                          .replace(" ", "-")
                          .toLowerCase()}/${course?._id ? course._id : ""}`}
                      >
                        <div className="">
                          <img
                            src={course?.thumbnail?.url as string}
                            alt=""
                            className="rounded-lg h-[250px] w-full object-cover"
                          />
                        </div>
                        {course?.price && (
                          <div className="p-2">
                            <h1 className="font-bold text-[20px] hover:text-sky-500">
                              {course.name}
                            </h1>
                            <div className="flex gap-3 items-center">
                              <small className="line-through">
                                {course?.oldPrice}
                              </small>
                              <p className="font-bold text-sky-500">
                                {course?.price}
                              </p>
                            </div>
                          </div>
                        )}
                      </Link>
                    </div>
                  )}
                </Fragment>
              );
            })}
          </>
        </FrameList>
      )}
    </>
  );
};

export default ProgressCourse;
