import React, {useRef, useEffect} from 'react';


/*

{
  userId: stream
}

 addVideoStream(video, stream, userId) {
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

*/

export const Participant = ({ userStreamTuple }) => {

    console.log("Inside participant component", userStreamTuple)
    const videoRef = useRef();
    
    useEffect(() => {
      
      videoRef.current.srcObject = userStreamTuple[1]     

    },[])
   
    
  
    return (
      <div className="participant">
        <h3>{userStreamTuple[0]}</h3>
        <video ref={videoRef} autoPlay={true} muted={true} />
      </div>
    );
   };