import React, { useEffect, useState } from "react";
import Peer from "peerjs";
import { db } from "../firebase/firebase";


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
      }),
      ourId: "-1"
    }
    this.connectToNewUser = this.connectToNewUser.bind(this)
    this.addVideoStream = this.addVideoStream.bind(this)
    
  }

  componentDidMount(){
    console.log("in CDM")
    this.state.myVideo.muted = true;
    
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(stream => {
      this.addVideoStream(this.state.myVideo, stream)
    
      console.log("what is my stream", stream)
    
      this.state.myPeer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')

        call.on('stream', userVideoStream => {
          console.log("how many times am I happening, stream: ", userVideoStream)
          this.addVideoStream(video, userVideoStream)
        })
      })

      db.collection('users').onSnapshot(async (snapshot) => {
        let data = snapshot.docs
        data.map(doc => {
            if(this.state.ourId != doc.data().userId){
              this.connectToNewUser(doc.data().userId,stream)

            }
            
        })
      })
    
     
    })

    // console.log("stream is", stream)

    this.state.myPeer.on("open", (id) => {
        console.log("my peer open", id);
        this.setState({ourId: id})
      
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
    

    const call = this.state.myPeer.call(userId, stream);
    if(!call){
        console.log("call doesn't exist")
        return
    } 
    const video = document.createElement("video");

    
    call.on("stream", (userVideoStream) => {
      console.log("our id and user Id,")
      console.log(this.state.ourId, userId)


      
      if(userId != this.state.ourId ){
        console.log("connecting to user: ", userId)
        this.addVideoStream(video, userVideoStream);
      }
      
    });
    call.on("close", () => {
      video.remove();
    });
    // peers[userId] = call
    
  }

  async addVideoStream(video, stream) {
    // console.log("inside VideoStream", video);
    // video.srcObject = stream;
    // await video.addEventListener("loadedmetadata", () => {
    //   video.play();
    // });
    //setState({videoRef1: {}})
    if(this.state.refCounter === 1){
      console.log("inside ref 1 adding stream as ref: ", stream)
      console.log("what is videoref1", this.state.videoRef1)
      this.setState(videoRef1 => ({
        ...videoRef1,
           current: { // someProperty
          ...videoRef1.current,
              srcObject: stream // someOtherProperty
        }
      }))
      //this.setState({videoRef1:{...this.state.videoRef1, current: {...this.state.videoRef1.current, srcObject: stream}}})
      this.setState({refCounter: this.state.refCounter+1})
      console.log("what is videoRef1", this.state.videoRef1)
    }
    else if(this.state.refCounter === 2){
      console.log("inside ref 2 adding stream as ref: ", stream)
      this.setState(videoRef2 => ({
        ...videoRef2,
           current: { // someProperty
          ...videoRef2.current,
              srcObject: stream // someOtherProperty
        }
      }))
      this.setState({refCounter: this.state.refCounter+1})
      console.log("what is videoRef2", this.state.videoRef2)
    }
    else if(this.state.refCounter === 3){
      console.log("inside ref 1 adding stream as ref: ", stream)
      this.setState(videoRef3 => ({
        ...videoRef3,
           current: { // someProperty
          ...videoRef3.current,
              srcObject: stream // someOtherProperty
        }
      }))
      this.setState({refCounter: this.state.refCounter+1})
    }
  }

  render(){
    return (<div>
      <video ref={this.state.videoRef1} id="r1" autoPlay={true} />
      <video ref={this.state.videoRef2} autoPlay={true} />
      <video ref={this.state.videoRef3} autoPlay={true} />
      <p>hello</p>
    </div>)

  }
}
