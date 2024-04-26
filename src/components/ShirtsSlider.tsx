import Image from "next/image";
import React from "react";

const ShirtsSlider = (props: any) => {
  const { setShirtSrc } = props;
  return (
    <div className="p-8 mt-5 bg-slate-100">
      <Image
        src={"/images/shirt1.png"}
        onClick={(e: any) => setShirtSrc("/images/shirt1.png")}
        alt="glass1"
        width={300}
        height={300}
        className="inline-block bg-transparent w-1/5 h-64 ml-2 "
      />
      <Image
        src={"/images/shirt2.png"}
        onClick={(e: any) => setShirtSrc("/images/shirt2.png")}
        alt="glass2"
        width={300}
        height={300}
        className="inline-block bg-transparent w-1/5 h-64 ml-2 "
      />
      <Image
        src={"/images/shirt3.png"}
        onClick={(e: any) => setShirtSrc("/images/shirt3.png")}
        alt="glass3"
        width={300}
        height={300}
        className="inline-block bg-transparent w-1/5 h-64 ml-2 "
      />
    </div>
  );
};

export default ShirtsSlider;
