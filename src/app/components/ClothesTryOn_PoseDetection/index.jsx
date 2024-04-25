"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as THREE from "three";

import GlassesSlider from "../GlassesSlider";
import ShirtsSlider from "../ShirtsSlider";

const ClothesTryOn = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [setshirtSrc, setShirtSrc] = useState("/images/shirt1.png");
  const [shirtMesh, setShirtMesh] = useState(null);
  const [threejsScene, setThreejsScene] = useState(null);

  const detectPoses = async () => {
    try {
      if (webcamRef?.current && webcamRef.current.video.readyState === 4) {
        const webcamElement = webcamRef.current.video;
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        //set video width
        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;

        const poses = await detector.estimatePoses(webcamElement);
        console.log("Current pose keypoints : ", poses[0].keypoints);

        console.log("poses", poses);
        poses.map((pose) => {
          console.log("pose.keypoints", pose.keypoints);
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
            // pose.keypoints.forEach(({ x, y }) => {
            //   ctx.beginPath();
            //   ctx.arc(x, y, 3, 0, 2 * Math.PI);
            //   ctx.fillStyle = "lightblue";
            //   ctx.fill();
            // });

            const bodyPointsWithName = [];
            pose.keypoints.forEach(({ x, y, name }) => {
              bodyPointsWithName.push({ [name]: { x, y } });
            });

            const getBodyPartData = (key) => {
              for (const bodyPart of bodyPointsWithName) {
                if (Object.keys(bodyPart)[0] === key) {
                  return bodyPart[key];
                }
              }
            };

            const leftShoulder = getBodyPartData("left_shoulder");
            const rightShoulder = getBodyPartData("right_shoulder");

            if (leftShoulder && rightShoulder) {
              const shoulderDistance = Math.sqrt(
                Math.pow(rightShoulder.x - leftShoulder.x, 2) +
                  Math.pow(rightShoulder.y - leftShoulder.y, 2)
              );

              const scaleMultiplier = shoulderDistance / 75; // Adjust shirtsWidth to match the model's width

              const scaleX = 0.01;
              const scaleY = -0.01;
              const offsetX = 0.1;
              const offsetY = -1;

              shirtMesh.position.x =
                ((leftShoulder.x + rightShoulder.x) / 2 - videoWidth / 2) *
                  scaleX +
                offsetX;
              shirtMesh.position.y =
                ((leftShoulder.y + rightShoulder.y) / 2 - videoHeight / 2) *
                  scaleY +
                offsetY;

              shirtMesh.scale.set(scaleMultiplier, -scaleMultiplier, 1);
              shirtMesh.position.z = 0.1;

              const shoulderLine = new THREE.Vector2(
                rightShoulder.x - leftShoulder.x,
                rightShoulder.y - leftShoulder.y
              );
              const rotationZ = -Math.atan2(shoulderLine.y, shoulderLine.x);
              shirtMesh.rotation.z = rotationZ;
            }
          }
        });
      }
    } catch (err) {
      console.log("Error while detecting pose : ", err);
    }
  };

  useEffect(() => {
    const loadPoseDetectionModel = async () => {
      try {
        await tf.ready();
        // movenet configurations start

        const detectorConfig = {
          // modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
          multiPoseMaxDimension: 352,
        };

        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        );
        setDetector(detector);
      } catch (error) {
        console.log("Error while loading pose detection model : ", error);
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

    loadPoseDetectionModel();
    setupThrreejs();
  }, []);

  useEffect(() => {
    const setupShirtMesh = () => {
      if (threejsScene) {
        const shirtWidth = 1.5;
        const shirtHeight = 1;
        // Glasses Mesh
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(setshirtSrc, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          const geometry = new THREE.PlaneGeometry(shirtWidth, shirtHeight);
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
          });
          const shirt = new THREE.Mesh(geometry, material);
          // console.log("shirt", shirt);

          threejsScene.add(shirt);
          setShirtMesh(shirt);
        });
      }
    };

    if (setshirtSrc) {
      shirtMesh && threejsScene.remove(shirtMesh);
      setupShirtMesh();
    }
  }, [setshirtSrc, threejsScene]);

  useEffect(() => {
    if (detector && shirtMesh) {
      const intervalId = setInterval(detectPoses, 100);

      return () => clearInterval(intervalId);
    }
  }, [detector, shirtMesh]);

  return (
    <div>
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

      {/* <GlassesSlider setGlassesSrc={setGlassesSrc} /> */}
      <ShirtsSlider setShirtSrc={setShirtSrc} />
    </div>
  );
};

export default ClothesTryOn;
