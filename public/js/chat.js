const socket = io();

//elements

const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormBtn = $messageForm.querySelector("button");

const $locationbtn = document.querySelector("#send-location");

const $messages = document.querySelector("#messages");

//templates

const $messageTemplate = document.querySelector("#message-template").innerHTML;
const $locationTemplate =
  document.querySelector("#location-template").innerHTML;
const $sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//options

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
}); //location.search gives query string "?username=jess&room=23"
//to remove ? from location.share we use ignoreQueryPrefix : true

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $messages.offsetHeight;

  // Height of messages container
  const containerHeight = $messages.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(
    $messageTemplate,
    {
      username: message.username,
      message: message.text,
      createdAt: moment(message.createdAt).format("h:mm a"),
    } //Mustache is a npm module used to render javascript in html
  );
  $messages.insertAdjacentHTML("beforeend", html); //iska matlab html variable me jo h isko element before end me dal do
  autoscroll()
});

socket.on("locationMessage", (object) => {
  const html = Mustache.render($locationTemplate, {
    username: object.username,
    url: object.url,
    createdAt: moment(object.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render($sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html; //new tarika to push html
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  $messageFormBtn.setAttribute("disabled", "disabled"); //after submit the form is disabled

  let data = $messageFormInput.value;

  socket.emit("sendmessage", data, (error) => {
    $messageFormBtn.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    if (error) {
      return console.log(error);
    }
    console.log("Message is delivered successfully");
  });
});

$locationbtn.addEventListener("click", () => {
  $locationbtn.setAttribute("disabled", "disabled");
  if (!navigator.geolocation) {
    alert("your browser does not support geolocation");
  }

  navigator.geolocation.getCurrentPosition((position) => {
    //asynchronous function
    var data = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    socket.emit("send-location", data, (error) => {
      console.log("location shared successfully");
      $locationbtn.removeAttribute("disabled");
    });
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/"; //it will redirect to the root page i.e index.html
  }
});
