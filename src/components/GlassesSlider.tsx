import Image from "next/image";
import React from "react";

const GlassesSlider = (props: any) => {
  const { setGlassesSrc } = props;
  return (
    <div className="p-8 mt-5 bg-slate-100">
      <Image
        src={"/images/glass1.png"}
        onClick={(e: any) => setGlassesSrc("/images/glass1.png")}
        alt="glass1"
        width={300}
        height={300}
        className="inline-block bg-transparent"
      />
      <Image
        src={"/images/glass2.png"}
        onClick={(e: any) => setGlassesSrc("/images/glass2.png")}
        alt="glass2"
        width={300}
        height={300}
        className="inline-block bg-transparent"
      />
      <Image
        src={"/images/glass3.png"}
        onClick={(e: any) => setGlassesSrc("/images/glass3.png")}
        alt="glass3"
        width={300}
        height={300}
        className="inline-block bg-transparent"
      />
    </div>
  );
};

export default GlassesSlider;
