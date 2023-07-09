const source = new EventSource('http://127.0.0.1:5001/stream');
source.onmessage = function(event) {
    var data = JSON.parse(event.data);
    console.log(data)

    document.querySelectorAll(`.user .active-outline, .user .active-logo`)
        .forEach(node => node.style.display = data.turn === "user" ? "block" : "none")
    document.querySelectorAll(`.ai-user .active-outline, .ai-user .active-logo`)
        .forEach(node => node.style.display = data.turn === "ai" ? "block" : "none")
};
source.onerror = function(event) {
    console.log("error", event);
}
