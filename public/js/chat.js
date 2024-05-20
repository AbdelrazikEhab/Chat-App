const socket = io();

//element
const $messageFrom = document.querySelector("#message-form");
const $messageFromInput = document.querySelector("input");
const $messageFromButton = document.querySelector("button");
const $sendLocation = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

//templeet
const messageTeplete = document.querySelector("#message-template").innerHTML;
const locationtemplete = document.querySelector("#location-templete").innerHTML;
const sidebartemplate = document.querySelector("#sidebar-template").innerHTML;

//options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const auroScroll = () => {
  //new message
  const $newMessage = $messages.lastElementChild;

  const newMessageStyle = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyle.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  const visibleHeight = $messages.offsetHeight;

  const containerHeight = $messages.scrollHeight;

  const scrolloffSet = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrolloffSet) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};
socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTeplete, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  auroScroll();
});

socket.on("locationmessage", (message) => {
  console.log(message.url);
  const html = Mustache.render(locationtemplete, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebartemplate, {
    room,
    users,
  });
  document.querySelector("#Sidebar").innerHTML = html;
});

$messageFrom.addEventListener("submit", (e) => {
  e.preventDefault();

  $messageFromButton.setAttribute("disabled", "disabled");

  const Mymessage = e.target.elements.message.value;

  socket.emit("SendMessage", Mymessage, (error) => {
    $messageFromButton.removeAttribute("disabled");
    $messageFromInput.value = " ";
    $messageFromInput.focus();

    if (error) {
      console.log(error);
    }
    console.log("Message Delivered");
  });
});

$sendLocation.addEventListener("click", () => {
  $sendLocation.setAttribute("disabled", "disabled");

  if (!navigator.geolocation) {
    return alert("geolocation not sopurted by this location");
  }

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "SendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        console.log("location shared");
      }
    );
    $sendLocation.removeAttribute("disabled");
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
