import React, {useRef} from 'react';




export const Participant = ({ participantId }) => {
    
  
    const videoRef = useRef();
    
  
    return (
      <div className="participant">
        <h3>{participantId}</h3>
        <video ref={videoRef} autoPlay={true} muted={true} />
      </div>
    );
   };