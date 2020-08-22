import React, { useEffect, useState } from "react";
import Peer from "peerjs";
import { db } from "../firebase/firebase";
import VideoGrid from  "./VideoGrid"
import { render } from "@testing-library/react";


export default class GameRoom extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      myVideo: document.createElement("video"),
      videoRef1: React.createRef(),
      videoRef2: React.createRef(),
      videoRef3: React.createRef(),
      refCounter: 1,
      myPeer: new Peer(undefined, {
        host: "/",
        port: "3001",
      })
    }
  }

  compenentDidMount(){

    console.log("MY PEER IS", myPeer);
    myVideo.muted = true;
    
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(stream => {
      addVideoStream(myVideo, stream)
    
      console.log("what is my stream", stream)
    
      myPeer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')


        call.on('stream', userVideoStream => {
          console.log("how many times am I happening, stream: ", userVideoStream)
          addVideoStream(video, userVideoStream)
        })
      })

      db.collection('users').onSnapshot(async (snapshot) => {
        let data = snapshot.docs
        data.map(doc => {
            console.log("DOC IS ", doc.data())
            if(ourId != doc.data().userId){
              connectToNewUser(doc.data().userId,stream)

            }
            
        })
      })
    
     
    })


    // console.log("stream is", stream)


    myPeer.on("open", (id) => {
        console.log("my peer open", id);
        setOurId(id)
        console.log("setting our id to ", id)
    
        db.collection("users").add({ userId: id });
      });

      // myPeer.on("call", (call) => {
      //   // console.log("do we make it here, if so STREAM IS", stream);
    
      //   // console.log("do we make it here, if so CALL  IS", call.on);

      //   console.log("stream is ", stream)
      //   call.answer(stream);
      //   const video = document.createElement("video");
      //   call.on("stream", (userVideoStream) => {
      //       console.log(" ARE WE MKAING IT INTO THE STREAM HANDLER")
      //     addVideoStream(video, userVideoStream);
      //   });
      // });
    // // console.log("what is stream in useEffect", stream)

        

        // socket.on('user-connected', userId => {
        //   connectToNewUser(userId, stream)
        // })

        // 24

    
        // // 33
        // // roomUserInfo = db.collection('users').doc(`${roomId}`);
    

    //   socket.on('user-disconnected', userId => {
    //     if (peers[userId]) peers[userId].close()
    //   })
  }

  

  async connectToNewUser(userId, stream) {


    if(userId === ourId) return
    const call = myPeer.call(userId, stream);

    console.log("ARE WE SEEING CALLS", call)

    if(!call){
        console.log("call doesn't exist")
        return
    } 
    const video = document.createElement("video");

    console.log("before stream event user: ", userId)
    call.on("stream", (userVideoStream) => {
      
      if(userId != ourId ){
        console.log("connecting to user: ", userId)
        addVideoStream(video, userVideoStream);
        setPeers({ ...peers, userId: call });
      }
      
    });
    call.on("close", () => {
      video.remove();
    });
    // peers[userId] = call
    
  }

  async addVideoStream(video, stream) {
    // console.log("inside VideoStream", video);
    video.srcObject = stream;
    await video.addEventListener("loadedmetadata", () => {
      video.play();
    });

    if(refCounter === 1){
      console.log("inside ref 1 adding stream as ref: ", stream)
      setVideoRef1({videoRef1: { ...current.srcObject, stream}} )
      setRefCounter(2)
      console.log("what is videoRef1", videoRef1)
    }
    else if(refCounter === 2){
      console.log("inside ref 2 adding stream as ref: ", stream)
      setVideoRef2({videoRef2: { ...current.srcObject, stream}} )
      setRefCounter(3)
      console.log("what is videoRef2", videoRef2)
    }
    else if(refCounter === 3){
      console.log("inside ref 1 adding stream as ref: ", stream)
      setVideoRef3({videoRef3: { ...current.srcObject, stream}}  )
      setRefCounter(4)
    }
     
  }

  
  render(){
    return (<div>
      <video ref={videoRef1}/>
      <video ref={videoRef2}/>
      <video ref={videoRef3}/>
    </div>)

  }
  

 
}
