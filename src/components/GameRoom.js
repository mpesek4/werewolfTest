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
      gameId: "6g6EUlGaBQbD0m2rjBUx"
    };
    this.peers = new Set();
    this.videoRef1 = React.createRef();
    this.videoRef2 = React.createRef();
    this.videoRef3 = React.createRef();
    this.connectToNewUser = this.connectToNewUser.bind(this);
    this.addVideoStream = this.addVideoStream.bind(this);
    this.handleMajority = this.handleMajority.bind(this);
    this.handleNightTransition = this.handleNightTransition.bind(this);
    this.handleDayTransition = this.handleDayTransition.bind(this);
    this.assignRolesAndStartGame = this.assignRolesAndStartGame.bind(this)
  }
  async componentDidMount() {

    const data = await db.collection('gameState').doc(this.state.gameId).get()

    console.log(data.data())

    let game = data.data()


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
          this.handleMajority(game) // listening for changes to user voting
          data.map((doc) => {
            if (this.state.ourId !== doc.data().userId) {
              this.connectToNewUser(doc.data().userId, stream);
            }
          });
        });
        //create firebase method to look up individual game
        console.log("what is our game ID", this.state.gameId)
        db.collection('gameState').doc(this.state.gameId).onSnapshot(async (snapshot) => {
          let game = snapshot.data();
          
          if(!game.gameStarted) return

          if (game.Night) {
            this.handleNightTransition(game, this.state.ourId)
          } else {
            this.handleDayTransition(game, this.state.ourId)
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
    if (game.villagers.length === 1){
      this.assignRolesAndStartGame(game)
    }
    if (game.checkWerewolf && game.checkSeer && game.checkMedic) {
      if (game.werewolfChoice === game.medicChoice){
        game.werewolfChoice = null
      } else {
        game.villagers = game.villagers.filter (villager => {
          return villager.id !== game.werewolfChoice
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
        game.villagers = game.villagers.filter(villager => {
          return villager.id !== game.villagersChoice
        })
      } else {
        game.werewolves = game.werewolves.filter(werewolf => {
          return werewolf.id !== game.villagersChoice
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

  async handleMajority(game) { //end goal to update villageGers

    const totalPlayers = game.villagers.length + game.werewolves.length
    let votingObject = {} //key will be a user, value is how many votes for that user
    // let players = await db.collection('gameState').doc(this.state.gameId).data().players

    let players = await db.collection('gameState').doc(this.state.gameId).get()
    players= players.data().players
    for(let player of players){ // need to add gameState and users tables to state
      if(Object.keys(player).includes(player.currentVote)){
        votingObject[player.currentVote]+=1
      }
      else{
        votingObject[player.currentVote]=1
      }
    }
    for(let player of Object.keys(votingObject)){
      if (votingObject[player] > Math.floor(totalPlayers / 2)){
        // db.collection('gameState').doc(this.state.gameId).villagersChoice.update(player) // find real way to do this
        db.collection('gameState').doc(this.state.gameId).update({villagersChoice: player}) 
      }
    } 
  }
  handleClick(e){
    db.collection('gameState').doc(this.state.gameId).update({gameStarted: true}) 
  }
  async assignRolesAndStartGame(game){
    console.log("In assignRoles")
    let users = await db.collection('users').where("currentGame", "==", this.state.gameId).get()
    users = users.docs
    
    //randomize later
    console.log("what is users in assign roles", users)


    let werewolves = []
    
    let villagers = []
    

    // for(let i = 0;i < users.length;i++){
    //   if(i<2){
    //     console.log("werewolves are ", werewolves)
    //     werewolves.push(users[i])
    //   }
    //   if(i == 3){
    //     db.collection('gameState').doc(this.state.gameId).update({seer: users[i]})
    //     villagers.push(users[i])
    //   }
    //   if(i == 4){
    //     db.collection('gameState').doc(this.state.gameId).update({medic: users[i]})
    //     villagers.push(users[i])
    //   }
    //   if(i > 4){
    //     villagers.push(users[i])
    //   }
    // }
    users.map((doc,i) => {
      console.log("what does my user look like", doc.id)
      let user = doc.id

      if(i<2){
        console.log("werewolves are ", werewolves)
        werewolves.push(user)
      }
      if(i == 2){
        db.collection('gameState').doc(this.state.gameId).update({seer: user})
        villagers.push(user)
      }
      if(i == 3){
        db.collection('gameState').doc(this.state.gameId).update({medic: user})
        villagers.push(user)
      }
      if(i > 3){
        villagers.push(user)
      }


    })
    console.log("what is the ww object we are pushing", werewolves)
    await db.collection('gameState').doc(this.state.gameId).update({werewolves: werewolves}) 
    await db.collection('gameState').doc(this.state.gameId).update({villagers: villagers}) 

    db.collection('gameState').doc(this.state.gameId).update({gameStarted: true}) 





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