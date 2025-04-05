const APP_ID = "3680dcdc8b6f4146990cf8c707ec295d";
const TOKEN = ""; // Fill in if using token auth
const CHANNEL = "GetDiagnosed";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

let localTracks = [];
let remoteUsers = {};

let joinAndDisplayLocalStream = async () => {
  client.on("user-published", handleUserJoined);
  client.on("user-left", handleUserLeft);

  try {
    let UID = await client.join(APP_ID, CHANNEL, TOKEN || null, null);
    console.log("Joined channel with UID:", UID);

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

    let player = `<div class="video-container" id="user-container-${UID}">
      <div class="video-label">Dr Bob Lee</div>
      <div class="video-player" id="user-${UID}"></div>
    </div>`

    document
      .getElementById("video-streams")
      .insertAdjacentHTML("beforeend", player);

    localTracks[1].play(`user-${UID}`);
    await client.publish([localTracks[0], localTracks[1]]);
  } catch (err) {
    console.error("Error joining stream:", err);
  }
};

let joinStream = async () => {
  await joinAndDisplayLocalStream();
  document.getElementById("stream-controls").style.display = "flex";
};

let handleUserJoined = async (user, mediaType) => {
  remoteUsers[user.uid] = user;
  await client.subscribe(user, mediaType);

  if (mediaType === "video") {
    let player = document.getElementById(`user-container-${user.uid}`);
    if (player != null) player.remove();

    player = `<div class="video-container" id="user-container-${user.uid}">
      <div class="video-label">Patient Sean Ng</div>
      <div class="video-player" id="user-${user.uid}"></div>
    </div>`;

    document
      .getElementById("video-streams")
      .insertAdjacentHTML("beforeend", player);
    user.videoTrack.play(`user-${user.uid}`);
  }

  if (mediaType === "audio") {
    user.audioTrack.play();
  }
};

let handleUserLeft = async (user) => {
  delete remoteUsers[user.uid];
  const container = document.getElementById(`user-container-${user.uid}`);
  if (container) container.remove();
};

let leaveAndRemoveLocalStream = async () => {
  for (let i = 0; i < localTracks.length; i++) {
    localTracks[i].stop();
    localTracks[i].close();
  }

  await client.leave();
  document.getElementById("stream-controls").style.display = "none";
  document.getElementById("video-streams").innerHTML = "";
};

let toggleMic = async (e) => {
  if (localTracks[0].muted) {
    await localTracks[0].setMuted(false);
    e.target.innerText = " Mic On";
    e.target.style.backgroundColor = "white";
  } else {
    await localTracks[0].setMuted(true);
    e.target.innerText = " Mic Off";
    e.target.style.backgroundColor = "#EE4B2B";
  }
};

let toggleCamera = async (e) => {
  if (localTracks[1].muted) {
    await localTracks[1].setMuted(false);
    e.target.innerText = " Camera On";
    e.target.style.backgroundColor = "white";
  } else {
    await localTracks[1].setMuted(true);
    e.target.innerText = " Camera Off";
    e.target.style.backgroundColor = "#EE4B2B";
  }
};

window.addEventListener("DOMContentLoaded", () => {
  joinStream();
  document
    .getElementById("leave-btn")
    .addEventListener("click", leaveAndRemoveLocalStream);
  document.getElementById("mic-btn").addEventListener("click", toggleMic);
  document.getElementById("camera-btn").addEventListener("click", toggleCamera);
});