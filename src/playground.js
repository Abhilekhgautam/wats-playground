const codeMirrorEditor = CodeMirror(document.getElementById("editor"), {
  theme: "dracula",
  lineNumbers: true,
  autoCloseBrackets: true,
  // keyboard shortcuts
  extraKeys: {
    "Cmd-Enter": runWasmCompiler,
    "Ctrl-Enter": runWasmCompiler,
  },
  value: `function factorial(num: i32) -> i32{
    let result = 1;

    for i in 2 to num {
       result = result * i;
    }

    return result;
}`,
});

const term = document.getElementById("termynal");
const toggle_format = document.getElementById("format-toggle");
const compiler_options_input = document.getElementById("compiler-options");
let termynal;
let outputBuffer = "";

function ansiToHtml(text) {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\x1b\[0;31m/g, '<span style="color: #ff5555;">') // Dracula Red
    .replace(/\x1b\[0;32m/g, '<span style="color: #50fa7b;">') // Dracula Green
    .replace(/\x1b\[0;34m/g, '<span style="color: #8be9fd;">') // Dracula Cyan
    .replace(/\x1b\[0m/g, "</span>")
    .replace(/\n/g, "<br>"); // Replaced \x1b\n with just \n for better multi-line support
}

function clearTerminal() {
  term.innerHTML = "";
  outputBuffer = "";
}

function renderTerminal(text, color = "white") {
  term.innerHTML = "";

  let span = document.createElement("span");
  span.setAttribute("data-ty", "");
  span.style.color = color;

  if (!text.startsWith("{") || toggle_format.checked) {
    span.innerHTML = ansiToHtml(text);
  } else {
    span.innerHTML = text;
  }

  term.appendChild(span);

  // Re-initialize animation cleanly
  termynal = new Termynal("#termynal");
}

function captureOutput(text) {
  outputBuffer += text + "\n";
}

function runWasmCompiler() {
  if (!Module._compile_program) {
    console.warn("WASM not loaded yet.");
    return;
  }

  // Clear previous runs
  clearTerminal();

  // Get Editor Code
  let inputValue = codeMirrorEditor.getValue();
  const bufferSize = inputValue.length + 1;
  const bufferPointer = Module._malloc(bufferSize);
  Module.stringToUTF8(inputValue, bufferPointer, bufferSize);

  // Get Compiler Options
  let optionsValue = compiler_options_input.value.trim();
  const optionsSize = optionsValue.length + 1;
  const optionsPointer = Module._malloc(optionsSize);
  Module.stringToUTF8(optionsValue, optionsPointer, optionsSize);

  try {
    Module._compile_program(bufferPointer, optionsPointer);
  } catch (err) {
    console.error("Execution failed:", err);
    outputBuffer += `\x1b[0;31mRuntime Error: ${err}\x1b[0m\n`;
  }

  if (!toggle_format.checked) {
    try {
      let str = JSON.parse(outputBuffer);
      outputBuffer = bril2txt(str);
    } catch (error) {
      console.error(
        "Bril JSON Parse/Convert failed. Falling back to raw text.",
        error,
      );
    }
  }

  renderTerminal(outputBuffer);

  Module._free(bufferPointer);
  Module._free(optionsPointer);
}

var Module = {
  print: captureOutput,
  printErr: function (text) {
    console.error("WASM Error:", text);
    outputBuffer += `\x1b[0;31m${text}\x1b[0m\n`;
  },
  onRuntimeInitialized: function () {
    console.log("WASM Runtime Initialized.");

    termynal = new Termynal("#termynal");

    document
      .getElementById("run-btn")
      .addEventListener("click", runWasmCompiler);
  },
};
