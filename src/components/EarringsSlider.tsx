import Image from "next/image";
import React from "react";

const EarringsSlider = (props: any) => {
  const { setEarringSrc } = props;
  return (
    <div className="p-8 mt-5 bg-slate-100">
      <Image
        src={"/images/earring1.png"}
        onClick={(e: any) => setEarringSrc("/images/earring1.png")}
        alt="earring1"
        width={300}
        height={300}
        className="inline-block bg-transparent"
      />
      <Image
        src={"/images/earring2.png"}
        onClick={(e: any) => setEarringSrc("/images/earring2.png")}
        alt="earring2"
        width={300}
        height={300}
        className="inline-block bg-transparent"
      />
    </div>
  );
};

export default EarringsSlider;
