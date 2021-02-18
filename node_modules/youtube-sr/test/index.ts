// @ts-nocheck
import YouTube from "../src/main.ts";
const url = "https://www.youtube.com/watch?v=x8VYWazR5mE&list=PL_A7IF_b8OCR7k9CZovjSoW1Sv99NQYIJ";

YouTube.getPlaylist(url)
    .then(x => console.log(x.videos.length))
    .catch(console.error);

// console.log(YouTube.validate("PLwBAMTaOF-yjCsmJl6ketVbi8Kucvd9Bi", "PLAYLIST_ID"))

// YouTube.search("faded", {
//     type: "video"
// }).then(console.log)

// YouTube.searchOne("aurora k391", "video")
//     .then(x => console.log(x));