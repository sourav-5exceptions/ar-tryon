import React from "react";
import AR_Detections from "./components/AR_Detections";
import AR_Detections_FaceDetection from "./components/AR_Detections_FaceDetection";
export default function Home() {
  return (
    <React.Fragment>
      <AR_Detections />
      {/* <AR_Detections_FaceDetection /> */}
    </React.Fragment>
  );
}
