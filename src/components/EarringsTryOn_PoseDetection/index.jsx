"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-webgl";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as THREE from "three";

import EarringsSlider from "../EarringsSlider";

const EarringsTryon = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [earringSrc, setEarringSrc] = useState("/images/earring1.png");
  const [earringMesh, setEarringMesh] = useState(null);
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

            const leftEar = getBodyPartData("left_ear");
            const rightEar = getBodyPartData("right_ear");

            if (leftEar && rightEar) {
              const earsDistance = Math.sqrt(
                Math.pow(rightEar.x - leftEar.x, 2) +
                  Math.pow(rightEar.y - leftEar.y, 2)
              );

              const scaleMultiplier = earsDistance / 100; // Adjust shirtsWidth to match the model's width

              const scaleX = -0.01;
              const scaleY = 0.01;
              const offsetX = -0.01;
              const offsetY = -0.01;

              earringMesh.position.x =
                // (leftEar.x - videoWidth / 2) * scaleX + offsetX;
                leftEar.x - (1 * scaleMultiplier) / 2;
              earringMesh.position.y =
                // (leftEar.y - videoHeight / 2) * scaleY + offsetY;
                (leftEar.y + rightEar.y) / 2;

              earringMesh.scale.set(scaleMultiplier, -scaleMultiplier, 1);
              earringMesh.position.z = 1;

              const earsLine = new THREE.Vector2(
                rightEar.x - leftEar.x,
                rightEar.y - leftEar.y
              );
              const rotationZ = -Math.atan2(earsLine.y, earsLine.x);
              earringMesh.rotation.z = rotationZ;
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
    const setupEarringMesh = () => {
      if (threejsScene) {
        const earringWidth = 1;
        const shirtHeight = 1;
        // Glasses Mesh
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(earringSrc, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          const geometry = new THREE.PlaneGeometry(earringWidth, shirtHeight);
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
          });
          const shirt = new THREE.Mesh(geometry, material);
          // console.log("shirt", shirt);

          threejsScene.add(shirt);
          setEarringMesh(shirt);
        });
      }
    };

    if (earringSrc) {
      earringMesh && threejsScene.remove(earringMesh);
      setupEarringMesh();
    }
  }, [earringSrc, threejsScene]);

  useEffect(() => {
    if (detector && earringMesh) {
      const intervalId = setInterval(detectPoses, 100);

      return () => clearInterval(intervalId);
    }
  }, [detector, earringMesh]);

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
      <EarringsSlider setEarringSrc={setEarringSrc} />
    </div>
  );
};

export default EarringsTryon;
