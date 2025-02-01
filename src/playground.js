const codeMirrorEditor = CodeMirror(document.getElementById("editor"), {
  theme: "default",
  lineNumbers: true,
  autoCloseBrackets: true,
  value: "for i 1 to 100{}",
});

termContainer = document.getElementById("termcontainer");

function ansiToHtml(text) {
  return text
    .replace(/\x1b\[0;31m/g, '<span style="color: red;">') // Red for errors
    .replace(/\x1b\[0;32m/g, '<span style="color: green;">') // Add line break before Green
    .replace(/\x1b\[0;34m/g, '<span style="color: blue;">') // Blue for hints
    .replace(/\x1b\[0m/g, '</span><span style="color: white;">');
}

let term = document.getElementById("termynal");

// fixme: doesn't clear
function clearTerminal() {
  term.innerHTML = "";
  term.innerText = "";
  new Termynal("#termynal");
}

function addTerminalLine(text, color = "white") {
  let span = document.createElement("span");
  span.setAttribute("data-ty", "");
  span.style.color = color;
  span.innerHTML = ansiToHtml(text);
  term.appendChild(span);

  console.log(term);
}

var termynal = new Termynal("#termynal");

let outputBuffer = "";

// Function to capture printed output
function captureOutput(text) {
  outputBuffer += text + "\n";
  console.log(text);
}

Module = {
  print: captureOutput,

  onRuntimeInitialized: function () {
    try {
      console.log("Init");

      document.getElementById("run-btn").addEventListener("click", (e) => {
        clearTerminal();
        let inputValue = codeMirrorEditor.getValue();
        console.log(inputValue);

        // Allocate memory for the string
        const bufferSize = inputValue.length + 1; // +1 for null terminator
        const bufferPointer = Module._malloc(bufferSize);

        Module.stringToUTF8(inputValue, bufferPointer, bufferSize);

        Module._compile_program(bufferPointer);

        addTerminalLine(outputBuffer);
        new Termynal("#termynal");

        Module._free(bufferPointer);
      });
    } catch (e) {
      console.error("🔥 WASM Exception Caught:", e);
      console.error("🛠 Stack Trace:", e.stack);
    }
  },
};
