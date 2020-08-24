import React from 'react';
import Peer from 'peerjs';
import { db } from '../firebase/firebase';
export default class GameRoom extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      myVideo: document.createElement('video'),
      refCounter: 1,
      myPeer: new Peer(undefined, {
        host: '/',
        port: '3001',
      }),
      ourId: '',
    };
    this.peers = new Set();
    this.videoRef1 = React.createRef();
    this.videoRef2 = React.createRef();
    this.videoRef3 = React.createRef();
    this.connectToNewUser = this.connectToNewUser.bind(this);
    this.addVideoStream = this.addVideoStream.bind(this);
  }
  componentDidMount() {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        this.addVideoStream(this.state.myVideo, stream);
        this.state.myPeer.on('call', (call) => {
          call.answer(stream);
          const video = document.createElement('video');
          call.on('stream', (userVideoStream) => {
            if (!this.peers.has(call.peer)) {
              this.addVideoStream(video, userVideoStream);
            }
            this.peers.add(call.peer);
          });
        });
        db.collection('users').onSnapshot(async (snapshot) => {
          let data = snapshot.docs;
          data.map((doc) => {
            if (this.state.ourId !== doc.data().userId) {
              this.connectToNewUser(doc.data().userId, stream);
            }
          });
        });
        //create firebase method to look up individual game
        db.collection('gameState').doc(this.props.gameState.docid).onSnapshot(async (snapshot) => {
          let game = snapshot.docs.data();
          if (game.Night) {
            handleNightLogic(game, ourId)
          } else {
            handleDayLogic(game, ourId)
          }
        })
      });
    this.state.myPeer.on('open', (id) => {
      this.setState({ ourId: id });
      db.collection('users').add({ userId: id });
    });
  }
  connectToNewUser(userId, stream) {
    const call = this.state.myPeer.call(userId, stream);
    if (!call) {
      return;
    }
    const video = document.createElement('video');
    call.on('stream', (userVideoStream) => {
      if (userId !== this.state.ourId) {
        if (!this.peers.has(call.peer)) {
          this.addVideoStream(video, userVideoStream);
        }
      }
    });
    call.on('close', () => {
      video.remove();
    });
  }
  addVideoStream(video, stream) {
    if (this.state.refCounter === 1) {
      this.videoRef1.current.srcObject = stream;
      this.setState({ refCounter: this.state.refCounter + 1 });
    } else if (this.state.refCounter === 2) {
      this.videoRef2.current.srcObject = stream;
      this.setState({ refCounter: this.state.refCounter + 1 });
    } else if (this.state.refCounter === 3) {
      this.videoRef3.current.srcObject = stream;
      this.setState({ refCounter: this.state.refCounter + 1 });
    }
  }
  handleNightLogic(game, ourId) {
    if (game.villagers.length === 0){
      assignRoles(game)
    }
    if (game.checkWerewolf && game.checkSeer && game.checkMedic) {
      if (game.werewolfChoice === game.medicChoice){
        game.werewolfChoice = null
      } else {
        games.villagers = game.villagers.filter (villager => {
          villager.id !== game.werewolfChoice
        })
        game.dead.push(game.werewolfChoice)
        game.medicChoice = null
        game.numVillagers = game.villagers.length-1
        game.votesWerewolves = null
        game.checkWerewolf = false
        game.checkMedic = false
        game.checkSeer = false
      }
    } //outer IF
    else {
      return
    }
    game.Night = false
    //updating game state in DB
    db.update(game)
  }
  handleDayLogic(game, ourId) {
  }
  render() {
    return (
      <div>
        <video ref={this.videoRef1} autoPlay={true} muted />
        <video ref={this.videoRef2} autoPlay={true} muted />
        <video ref={this.videoRef3} autoPlay={true} muted />
      </div>
    );
  }
}
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