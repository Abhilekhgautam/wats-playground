const codeMirrorEditor = CodeMirror(document.getElementById("editor"), {
  theme: "dracula",
  lineNumbers: true,
  autoCloseBrackets: true,

  value: `function factorial(num){
    let result = 1;
    let count  = 1;

    loop{
      result = result * count;
      count  = count + 1;

      if count > num{
        break;
      }
    }
  }`,
});

const term = document.getElementById("termynal");
let termynal;

let toggle_format = document.getElementById("format-toggle");

function ansiToHtml(text) {
  return text
    .replace(/</g, "&lt;") // Replace < with &lt;
    .replace(/>/g, "&gt;") // Replace > with &gt;
    .replace(/\x1b\[0;31m/g, '<span style="color: red;">') // Red for errors
    .replace(/\x1b\[0;32m/g, '<span style="color: green;">') // Green
    .replace(/\x1b\[0;34m/g, '<span style="color: blue;">') // Blue for hints
    .replace(/\x1b\[0m/g, "</span>") // Reset to default (close the span)
    .replace(/\x1b\n/g, "<br>"); // Handle newlines
}

let outputBuffer = "";

function clearTerminal() {
  term.innerHTML = "";
  term.innerText = "";
  outputBuffer = "";
  termynal = new Termynal("#termynal");
}

function addLinesToTerminal(text, color = "white") {
  let span = document.createElement("span");
  span.setAttribute("data-ty", "");
  span.style.color = color;
  if (!text.startsWith("{") || toggle_format.checked) {
    span.innerHTML = ansiToHtml(text);
  } else {
    span.innerHTML = text;
  }
  term.appendChild(span);
}

termynal = new Termynal("#termynal");

function captureOutput(text) {
  outputBuffer += text + "\n";
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

      const bufferSize = inputValue.length + 1;
      const bufferPointer = Module._malloc(bufferSize);
      Module.stringToUTF8(inputValue, bufferPointer, bufferSize);

      Module._compile_program(bufferPointer);

      if (!toggle_format.checked) {
        try {
          let str = JSON.parse(outputBuffer);
          outputBuffer = bril2txt(str);
          addLinesToTerminal(outputBuffer);
          return;
        } catch (error) {}
      }

      // Add the captured output to the terminal
      addLinesToTerminal(outputBuffer);

      // Re-initialize Termynal to animate the new lines
      termynal = new Termynal("#termynal");

      Module._free(bufferPointer);
    });
  },
  printErr: function (text) {
    // Optional: Handle errors differently, e.g., print to browser console
    console.error("WASM Error:", text);
    // You could also add it to the terminal with a specific error color
    outputBuffer += `\x1b[0;31m${text}\x1b[0m\n`;
  },
};
