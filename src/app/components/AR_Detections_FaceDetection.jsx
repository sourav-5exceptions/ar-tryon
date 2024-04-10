"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs-core";
import * as THREE from "three";
import * as faceDetection from "@tensorflow-models/face-detection";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_detection";

import GlassesSlider from "./GlassesSlider";

const AR_Detections_FaceDetection = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [glassesSrc, setGlassesSrc] = useState("/images/glass1.png");
  const [glassesMesh, setGlassesMesh] = useState(null);
  const [threejsScene, setThreejsScene] = useState(null);

  const detectFacePoints = async () => {
    if (webcamRef?.current && webcamRef.current.video.readyState === 4) {
      const webcamElement = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      //set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      const estimationConfig = { flipHorizontal: false };
      const faces = await detector.estimateFaces(
        webcamRef.current.video,
        estimationConfig
      );

      console.log("faces", faces);
      faces.map((face) => {
        console.log("face.keypoints", face.keypoints);
        if (canvasRef.current) {
          canvasRef.current.width = videoWidth;
          canvasRef.current.height = videoHeight;
          const ctx = canvasRef.current.getContext("2d");

          // Clear previous drawings
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );

          // Draw each pose over canvas
          face.keypoints.forEach(({ x, y }) => {
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fillStyle = "lightblue";
            ctx.fill();
          });

          const bodyPointsWithName = [];
          face.keypoints.forEach(({ x, y, name }) => {
            bodyPointsWithName.push({ [name]: { x, y } });
          });

          const getBodyPartData = (key) => {
            for (const bodyPart of bodyPointsWithName) {
              if (Object.keys(bodyPart)[0] === key) {
                return bodyPart[key];
              }
            }
          };

          const leftEye = getBodyPartData("leftEye");
          const rightEye = getBodyPartData("rightEye");

          if (leftEye && rightEye) {
            const eyeDistance = Math.sqrt(
              Math.pow(rightEye.x - leftEye.x, 2) +
                Math.pow(rightEye.y - leftEye.y, 2)
            );

            const scaleMultiplier = eyeDistance / 75; // Adjust glassWidth to match the model's width

            const scaleX = 0.01;
            const scaleY = -0.01;
            const offsetX = 0.05;
            const offsetY = -0.1;

            glassesMesh.position.x =
              ((leftEye.x + rightEye.x) / 2 - videoWidth / 2) * scaleX +
              offsetX;
            glassesMesh.position.y =
              ((leftEye.y + rightEye.y) / 2 - videoHeight / 2) * scaleY +
              offsetY;

            glassesMesh.scale.set(scaleMultiplier, -scaleMultiplier, 1);
            glassesMesh.position.z = 1;

            const eyeLine = new THREE.Vector2(
              rightEye.x - leftEye.x,
              rightEye.y - leftEye.y
            );
            const rotationZ = -Math.atan2(eyeLine.y, eyeLine.x);
            glassesMesh.rotation.z = rotationZ;
          }
        }
      });
    }
  };

  useEffect(() => {
    const loadFaceDetectionModel = async () => {
      try {
        await tf.ready();
        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detectorConfig = {
          runtime: "tfjs", // or 'mediapipe',
          maxFaces: 3,
        };
        const detector = await faceDetection.createDetector(
          model,
          detectorConfig
        );
        setDetector(detector);
      } catch (error) {
        console.log("Error while loading face detection model : ", error);
      }
    };

    const setupThrreejs = () => {
      try {
        // Three.js setup
        const width = 480;
        const height = 352;

        // Scene, camera, and renderer setup
        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
        });

        renderer.setSize(width, height);
        renderer.domElement.id = "renderer-threejs";
        renderer.domElement.style.position = "absolute";
        renderer.domElement.style.right = "0px";
        renderer.domElement.style.left = "0px";
        renderer.domElement.style.width = width;
        renderer.domElement.style.height = height;
        renderer.domElement.style.margin = "auto";

        if (document.getElementById("renderer-threejs")) {
          document.getElementById("renderer-threejs").remove();
        }

        document
          .getElementById("pose-detector")
          .appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        setThreejsScene(scene);

        const camera = new THREE.PerspectiveCamera(
          75,
          width / height,
          0.1,
          1000
        );
        camera.position.set(0, 0, 5); //setting x, y and z-axis

        function animate() {
          requestAnimationFrame(animate);
          renderer.render(scene, camera);
        }

        renderer.setAnimationLoop(animate);
      } catch (error) {
        console.log("Error while three.js setup : ", error);
      }
    };

    loadFaceDetectionModel();
    setupThrreejs();
  }, []);

  useEffect(() => {
    const setupGlassesMesh = () => {
      if (threejsScene) {
        const glassWidth = 2;
        const glassHeight = 1;
        // Glasses Mesh
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(glassesSrc, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          const geometry = new THREE.PlaneGeometry(glassWidth, glassHeight);
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
          });
          const glasses = new THREE.Mesh(geometry, material);
          // console.log("glasses", glasses);

          threejsScene.add(glasses);
          setGlassesMesh(glasses);
        });
      }
    };

    if (glassesSrc) {
      glassesMesh && threejsScene.remove(glassesMesh);
      setupGlassesMesh();
    }
  }, [glassesSrc, threejsScene]);

  useEffect(() => {
    if (detector && glassesMesh) {
      const intervalId = setInterval(detectFacePoints, 100);

      return () => clearInterval(intervalId);
    }
  }, [detector, glassesMesh]);

  return (
    <React.Fragment>
      <div id="pose-detector" style={{ width: 480, height: 352 }}>
        <Webcam
          autoPlay
          className="absolute mx-auto left-0 right-0"
          style={{ width: 480, height: 352 }}
          ref={webcamRef}
        />

        <canvas
          className="absolute mx-auto left-0 right-0"
          style={{ width: 480, height: 352 }}
          ref={canvasRef}
        />
      </div>

      <GlassesSlider setGlassesSrc={setGlassesSrc} />
    </React.Fragment>
  );
};

export default AR_Detections_FaceDetection;
