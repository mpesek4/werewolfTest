import React, { useEffect, useState } from "react";
import Peer from "peerjs";
import { db } from "../firebase/firebase";


export default function GameRoom(props) {
  const [myVideo, setVideo] = useState(document.createElement("video"));

  const [videoGrid, setVideoGrid] = useState(
    document.getElementById("video-grid")
  );

  const [players, setPlayers] = useState([
    { userId: "Aleks M" },
    { userId: "Michael P" },
  ]);

  
  const [stream, setStream] = useState(new MediaStream);

  const [peers, setPeers] = useState({});

  // const myPeer = new Peer(undefined, {
  //     host: '/',
  //     port: '3001'
  //   })

  const [myPeer, setMyPeers] = useState(
    new Peer(undefined, {
      host: "/",
      port: "3001",
    })
  );

 

  

  

  useEffect(() => {
    // // console.log("MY PEER IS", myPeer);
    myVideo.muted = true;
    
    getStream()
    myPeer.on("open", (id) => {
        console.log("my peer open", id);
    
        db.collection("users").add({ userId: id });
      });

      myPeer.on("call", (call) => {
        // console.log("do we make it here, if so STREAM IS", stream);
    
        // console.log("do we make it here, if so CALL  IS", call.on);

        console.log("stream is ", stream)
        call.answer(stream);
        const video = document.createElement("video");
        call.on("stream", (userVideoStream) => {
            console.log(" ARE WE MKAING IT INTO THE STREAM HANDLER")
          addVideoStream(video, userVideoStream);
        });
      });
    // // console.log("what is stream in useEffect", stream)

        

        // socket.on('user-connected', userId => {
        //   connectToNewUser(userId, stream)
        // })

        // 24

    db.collection('users').onSnapshot(async (snapshot) => {
        let data = snapshot.docs
        data.map(doc => {
            console.log("DOC IS ", doc.data())
            connectToNewUser(doc.data().userId,stream)
        })
        // insert logic to check if a new user was added or deleted
        // if data has increased in length we know we aded, otherwise we can use sets potentially to see which user was deleted and close their connection/remove them from peers
        // // // console.log("IS THIS A THING", data[data.length-1].data())
        // // // console.log("IS THIS A THING", stream)
        
        // else{
        //     let userId = findDisconnect()
        //     peers[userId].close()
        // }
    })
        // // 33
        // // roomUserInfo = db.collection('users').doc(`${roomId}`);
    

    //   socket.on('user-disconnected', userId => {
    //     if (peers[userId]) peers[userId].close()
    //   })
  }, []); // use effect ends here

  function connectToNewUser(userId, stream) {


    
    const call = myPeer.call(userId, stream);

    console.log("ARE WE SEEING CALLS", call)

    if(!call){
        console.log("call doesn't exist")
        return
    } 
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
        console.log("made it into stream EVENT", userVideoStream)
      addVideoStream(video, userVideoStream);
    });
    call.on("close", () => {
      video.remove();
    });

    // peers[userId] = call

    setPeers({ ...peers, userId: call });
  }

  function addVideoStream(video, stream) {
    // console.log("inside VideoStream", video);
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
      video.play();
    });
    // console.log("in add videoStream what is our new VIDEO ", video)
    // console.log("in add videoStream what is our new VIDEO GRID ", videoGrid)
    videoGrid.append(video);
  }
async function getStream(){
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      }).then(async newStream => {
        addVideoStream(myVideo, newStream)
        // // console.log("new stream is", newStream)
        await setStream(newStream)
        // // console.log("setting stream in state", stream)
      })
}

  

  return <div>hello</div>;

  // return ( <div id="video-grid">
  //             {videoGrid.map((video)  => {
  //                 return video
  //             })}

  //         </div>);
}
