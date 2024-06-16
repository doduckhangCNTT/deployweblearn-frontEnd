import React, { useState } from "react";
import { InputChangedEvent } from "../../../utils/Typescript";

interface IProps {
  typeQuestion: string;
  content: string;
  titleQuestion: string;
  index: number;
}

const ShowAnswer: React.FC<IProps> = ({
  typeQuestion,
  content,
  titleQuestion,
  index,
}) => {
  const [checkedRadio, setCheckedRadio] = useState<string>();
  const [checkedCheckBox, setCheckedCheckBox] = useState<string[]>([]);

  const HandleChangeRadio = (e: InputChangedEvent) => {
    const { value } = e.target;

    if (typeQuestion === "radio") {
      setCheckedRadio(value);
    } else if (typeQuestion === "checkbox") {
      setCheckedCheckBox((prev) => [...prev, value]);
    }
  };

  return (
    <div>
      <div className="">
        <input
          type={typeQuestion}
          id={`${content}`}
          name={`${titleQuestion}`}
          value={index}
          onChange={(e) => HandleChangeRadio(e)}
          // ref={inputRef}
        />
        <label htmlFor={`${content}`} className="text-[16px]">
          {content}
        </label>
      </div>

      <div className="">
        <input
          type="text"
          value={typeQuestion === "radio" ? checkedRadio : checkedCheckBox}
        />
      </div>
    </div>
  );
};

export default ShowAnswer;
