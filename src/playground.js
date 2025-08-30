// --- 1. CODEMIRROR INITIALIZATION ---
const codeMirrorEditor = CodeMirror(document.getElementById("editor"), {
  // KEY CHANGE: Use the Dracula theme for a stylish look
  theme: "dracula",
  lineNumbers: true,
  autoCloseBrackets: true,

  value: `function main() {
    let x = 5;

    let y: i64 = 67;

    loop {
        # Uhh this is a comment.
    }
}`,
});

// --- 2. TERMINAL HANDLING LOGIC ---
const termContainer = document.getElementById("termynal");
let termynal = new Termynal(termContainer);

// This function converts ANSI color codes from your WASM output to HTML spans
function ansiToHtml(text) {
  const ansiRegex = /\x1b\[(\d+;?)*m/g;
  const colorMap = {
    "0;31": "red",
    "0;32": "lightgreen",
    "0;34": "lightblue",
    "1;33": "yellow",
    // Add more color codes as needed
  };

  let html = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\x1b\[0;31m/g, '<span style="color: #ff5555;">') // Red for errors
    .replace(/\x1b\[0;32m/g, '<span style="color: #50fa7b;">') // Green
    .replace(/\x1b\[0;34m/g, '<span style="color: #8be9fd;">') // Blue for hints
    .replace(/\x1b\[0m/g, "</span>") // Reset to default
    .replace(/\n/g, "<br>"); // Handle newlines
}

function clearTerminal() {
  termContainer.innerHTML = "";
}

function addLinesToTerminal(text) {
  const lineElement = document.createElement("span");
  lineElement.setAttribute("data-ty", "");
  lineElement.innerHTML = ansiToHtml(text);
  termContainer.appendChild(lineElement);
}

// --- 3. WASM MODULE INTERACTION ---
let outputBuffer = "";
function captureOutput(text) {
  outputBuffer = text + "\n";
}

Module = {
  print: captureOutput,
  onRuntimeInitialized: function () {
    console.log("WASM Runtime Initialized.");

    document.getElementById("run-btn").addEventListener("click", () => {
      // Reset buffer and clear the terminal UI
      outputBuffer = "";
      clearTerminal();

      let inputValue = codeMirrorEditor.getValue();

      // Allocate memory, run code, and free memory
      const bufferSize = inputValue.length + 1;
      const bufferPointer = Module._malloc(bufferSize);
      Module.stringToUTF8(inputValue, bufferPointer, bufferSize);

      Module._compile_program(bufferPointer);

      Module._free(bufferPointer);

      // Add the captured output to the terminal
      addLinesToTerminal(outputBuffer);

      // Re-initialize Termynal to animate the new lines
      termynal = new Termynal(termContainer);
    });
  },
  printErr: function (text) {
    // Optional: Handle errors differently, e.g., print to browser console
    console.error("WASM Error:", text);
    // You could also add it to the terminal with a specific error color
    outputBuffer += `\x1b[0;31m${text}\x1b[0m\n`;
  },
};
