import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import {Link} from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";
import { drawKeypoints, drawSkeleton } from "../utilities";
/* tensorflow */
import * as tf from "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";

import {Exit} from "@styled-icons/icomoon/Exit";

const videoConstraints = {
  // height : 500,
  // width : 500,
  height: window.innerHeight / 2,
  width: window.innerWidth / 2,
};

const Video = (props) => {
  const webcamRef = useRef();
  useEffect(() => {
    props.peer.on("stream", (stream) => {
      webcamRef.current.srcObject = stream;
    });
  }, []);

  return (
    <StyledVideo muted playsInline autoPlay ref={webcamRef} onClick={() =>{
      console.log("user Clicked");
    }} />

    // {/* //    <canvas ref = {canvasRef} />
    // //    <NameTag>{window.sessionStorage.name}</NameTag> */}
  );
};

const Room = (props) => {
  /* video */
  const canvasRef = useRef();

  /* room */
  const [peers, setPeers] = useState([]);
  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);
  const roomID = props.match.params.roomID;
  const roomName = window.sessionStorage.title;

  const detect = async (net) => {
    if (
      typeof userVideo !== "undefined" &&
      typeof userVideo.current !== "undefined" &&
      userVideo.current !== null &&
      userVideo.current.readyState === 4
    ) {
      const video = userVideo.current;
      const videoWidth = userVideo.current.videoWidth;
      const videoHeight = userVideo.current.videoHeight;
      // Set video width
      userVideo.current.width = videoWidth;
      userVideo.current.height = videoHeight;

      // Make Detection
      const pose = await net.estimateSinglePose(video);
      console.log(pose);

      // drawCanvas(pose, video, videoWidth, videoHeight, canvasRef);
    }
  };
  const drawCanvas = (pose, video, videoWidth, videoHeight, canvas) => {
    const ctx = canvas.current.getContext("2d");
    canvas.current.width = videoWidth;
    canvas.current.height = videoHeight;

    drawKeypoints(pose["keypoints"], 0.6, ctx);
    drawSkeleton(pose["keypoints"], 0.7, ctx);
  };
  const runPosenet = async () => {
    const net = await posenet.load({
      inputResolution: { width: 300, height: 300 },
      scale: 0.5,
    });
    setInterval(() => {
      detect(net);
    }, 100);
  };
  // runPosenet();
  useEffect(() => {
    // socketRef.current = io.connect("https://helf-node.herokuapp.com/");
    socketRef.current = io.connect("http://localhost:5000/");

    navigator.mediaDevices
      .getUserMedia({ video: videoConstraints, audio: true })
      .then((stream) => {
        userVideo.current.srcObject = stream;
        socketRef.current.emit("join room", { roomID, roomName });
        socketRef.current.on("all users", (users) => {
          const peers = [];
          users.forEach((userID) => {
            const peer = createPeer(userID, socketRef.current.id, stream);
            peersRef.current.push({
              peerID: userID,
              peer,
            });
            peers.push(peer);
          });
          setPeers(peers);
        });

        socketRef.current.on("user joined", (payload) => {
          const peer = addPeer(payload.signal, payload.callerID, stream);
          peersRef.current.push({
            peerID: payload.callerID,
            peer,
          });

          setPeers((users) => [...users, peer]);
        });

        socketRef.current.on("receiving returned signal", (payload) => {
          const item = peersRef.current.find((p) => p.peerID === payload.id);
          item.peer.signal(payload.signal);
        });
        socketRef.current.on("user left", (id) => {
          const peerObj = peersRef.current.find(p => p.peerID === id);
          if(peerObj) {
            peerObj.peer.destroy();
          }
          const peers = peersRef.current.filter(p => p.peerID !== id);
          peersRef.current = peers;
          setPeers(peers);
        });
      });
  }, []);

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("sending signal", {
        userToSignal,
        callerID,
        signal,
      });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("returning signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  return (

    <Container>
        {/* <ExitBtn onClick={ () => { window.confirm("나가시겠습니까?") && <Link to ="/roomList"/>}}/> */}
        <StyledVideo
          id="parent"
          muted
          ref={userVideo}
          autoPlay
          playsInline
          onClick={() =>{
            console.log("me Clicked");
          }}
        />
        {/* <Canvas ref={canvasRef}/>
                <NameTag>{window.sessionStorage.name}</NameTag>     */}
     
      {peers.map((peer, index) => {
        return <Video key={index} peer={peer} />;
      })}

      {/* { console.log(peers)} */}

    </Container>
  );
};

const GlobalStyle = createGlobalStyle`
    body {
        background-color : black;
    }
`;

const ExitBtn = styled(Exit)` 
  height : 48px;
  width : 48px;
  border : none;
  outline : none;
  margin : 4px;
  cursor : pointer;
  color : white;
`;

const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  margin: auto;
  flex-wrap: wrap; 
  background-color : black;
`;

const VideoWindow = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledVideo = styled.video`
  height: 40%;
  width: 50%;
  // position: "absolute",
  // marginLeft: "auto",
  // marginRight: "auto",
  // left: 0,
  // right: 0,
  // textAlign: "center",
  // zindex: 9,
  // width: 640,
  // height: 480,
`;

const Canvas = styled.div`
  height:40%;
  width:50%;
`
// const Canvas = styled.div`
//     position: "absolute",
//     margin-left: "auto",
//     margin-right: "auto",
//     left: 0,
//     right: 0,
//     text-align: "center",
//     zindex: 9,
//     width: 640,
//     height: 480,
// `;

const NameTag = styled.h1`
  text-align: center;
  color: white;
  font-size: 20px;
`;

export default Room;
