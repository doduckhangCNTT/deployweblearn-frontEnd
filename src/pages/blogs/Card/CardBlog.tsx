import React from "react";
import { Link } from "react-router-dom";
import LazyLoadingImg from "../../../components/LazyLoadingImg/LazyLoadingImg";

import { IBlog, IGetBlogsUser } from "../../../utils/Typescript";
import InfoCreator from "../InfoCreator";

interface IProps {
  blog: IBlog | IGetBlogsUser;
  bookmark?: IBlog;
}

const CardBlog: React.FC<IProps> = ({ blog, bookmark }) => {
  const WIDTH_BLOG_CONTENT = "2/3";
  const WIDTH_BLOG_IMG = "1/3";

  return (
    <div className="border-2 rounded-lg p-3 my-3 ">
      <div>
        <InfoCreator props={blog} bookmark={bookmark} />
      </div>

      <div className="flex gap-5 mt-2 md:flex-row sm:flex-col-reverse xs:flex-col-reverse">
        {/* Content Blog */}
        <div
          className={`w-${WIDTH_BLOG_CONTENT} flex flex-col justify-between`}
        >
          <div className="">
            <Link to={`/detail_blog/${blog._id}`}>
              <h1 className="font-bold text-[25px]">{blog.title}</h1>
            </Link>
            <div className="">
              <p className="">{blog.description}</p>
            </div>
          </div>

          <div>{new Date(blog.createdAt).toLocaleString()}</div>
        </div>

        {/* Img Blog */}
        <div className={`md:w-${WIDTH_BLOG_IMG} sm:w-full`}>
          <div className="w-full max-h-[200px]">
            <Link to={`/detail_blog/${blog._id}`}>
              <LazyLoadingImg
                url={blog.thumbnail.url as string}
                alt=""
                className="w-full max-h-[200px] object-cover rounded-lg"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardBlog;
