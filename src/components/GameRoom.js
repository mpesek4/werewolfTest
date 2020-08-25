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
        gameId: "6g6EUlGaBQbD0m2rjBux"
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
          handleMajority(game) // listening for changes to user voting
          data.map((doc) => {
            if (this.state.ourId !== doc.data().userId) {
              this.connectToNewUser(doc.data().userId, stream);
            }
          });
        });
        //create firebase method to look up individual game
        db.collection('gameState').doc(this.props.gameState.docid).onSnapshot(async (snapshot) => {
          if(!doc.data().gameStarted) return

          let game = snapshot.doc.data();
          if (game.Night) {
            handleNightLogic(game, ourId)
          } else {
            handleDayLogic(game, ourId)
          }
        })
      });
    this.state.myPeer.on('open', (id) => {
      this.setState({ ourId: id });
      db.collection('users').add({ userId: id, currentGame: this.state.gameId });
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
  handleNightTransition(game, ourId) {
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
        
      }
    } //outer IF
    else {
      return
    }
    game.Night = false
    game.medicChoice = null
    game.votesWerewolves = null
    game.checkWerewolf = false
    game.checkMedic = false
    game.checkSeer = false
    //updating game state in DB

    console.log("DURING NIGHT, ABOUT TO GO TO DAY", game)
    db.update(game)
  }

  handleDayTransition(game, ourId) {
    if (game.majorityReached){
      if (game.villagers.includes(game.villagersChoice)){
        games.villagers = game.villagers.filter(villager => {
          villager.id !== game.villagersChoice
        })
      } else {
        games.werewolves = game.werewolves.filter(werewolf => {
          werewolf.id !== game.villagersChoice
        })
      
      }
      game.dead.push(game.villagersChoice)
    } //outer IF
    else {
      return
    }
    game.night = true
    game.villagersChoice = null
    game.majorityReached = false
    //updating game state in DB

    console.log("DURING DAY, ABOUT TO GO TO NIGHT", game)
    db.update(game)
  }

  handleMajority(game) { //end goal to update villageGers

    const totalPlayers = game.villagers.length + game.werewolves.length
    let votingObject = {} //key will be a user, value is how many votes for that user

    for(user of this.state.users){ // need to add gameState and users tables to state
      if(Object.keys(user).includes(user.currentVote)){
        votingObject[user.currentVote]+=1
      }
      else{
        votingObject[user.currentVote]=1
      }
    }
    for(user of Object.keys(user)){
      if (votingObject[user] > Math.floor(totalPlayers / 2)){
        db.collection('gameState').doc(this.state.gameId).villagersChoice.update(user) // find real way to do this
      }
    } 
  }
  handleClick(e){
    db.collection('gameState').doc(this.state.gameId).villagersChoice.update({gameStarted: true}) 
  }
  async assignRoles(game){
    const users = await db.collection('users').where("currentGame", "==", this.state.gameId)

    //randomize later
    for(let i = 0;i < users.length;i++){
      if(i<2){
        let werewolves = db.collection('gameState').doc(this.state.gameId).data().werewolves
        console.log("werewolves are ", werewolves)
        

        db.collection('gameState').doc(this.state.gameId).werewolves.update({werewolves: {...this.werewolves.push(users[i])}}) 
      }
    }



  }
  render() {
    return (
      <div>
        <video ref={this.videoRef1} autoPlay={true} muted />
        <video ref={this.videoRef2} autoPlay={true} muted />
        <video ref={this.videoRef3} autoPlay={true} muted />
        <button onClick={() => {this.handleClick()}}> Start game</button>
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