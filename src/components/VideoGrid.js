import React, { useEffect, useState } from "react";
import Peer from "peerjs";
import { db } from "../firebase/firebase";


export default function VideoGrid({videoList}) {
    if(videoList.length === 0){
        return <div> loading</div>
    }
    
    
    let vid  = videoList[0]

    console.log("what is vid.src object ", vid.srcObject)

   


    if(videoList.length === 0){
        return <div> loading</div>
    }
   
    return (
        
        <div id="video-x">
            <video src={vid.srcObject} autoplay="true"> </video>
        </div> 
    )
    
    

}