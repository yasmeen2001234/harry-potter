const wand = document.getElementById("wand");

document.addEventListener("mousemove", (e) => {
  // Offset the wand slightly so it doesn't sit directly under the cursor
  const x = e.clientX;
  const y = e.clientY;

  wand.style.transform = `translate(${x}px, ${y}px)`;
});

// Optional: Add a "pulse" effect when clicking
document.addEventListener("mousedown", () => {
  wand.style.boxShadow = "0 0 30px 15px rgba(255, 255, 255, 0.9)";
});

document.addEventListener("mouseup", () => {
  wand.style.boxShadow = "0 0 15px 5px rgba(128, 223, 255, 0.8)";
});
