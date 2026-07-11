const examples = {
  "Factorial": `function factorial(num: i32) -> i32 {
    let result = 1;

    for i in 2 to num {
       result = result * i;
    }

    return result;
}`,

  "Fibonacci": `function fibonacci(n: i32) -> i32 {
    if n <= 1 {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}`,

  "Basic": `function addAndMultiply(a: i32, b: i32) -> i32 {
    let sum = a + b;
    let product = a * b;
    return sum + product;
}`,

"Match": `function demoMatch(a: i32, b: i32) -> i32 {
  let sum = a + b;
  let product = a * b;

  match all {
      sum < product => {sum = product;}
      sum < 56 => {sum = 0;}
  }

  match once {
      sum < product => {sum = product;}
      sum < 56 => {sum = 0;}
  }
}`
};

// 2. Populate the dropdown dynamically
const example_select = document.getElementById("example-select");
for (const [name, code] of Object.entries(examples)) {
  const option = document.createElement("option");
  option.value = name;
  option.textContent = name + ".wats";
  example_select.appendChild(option);
}

// Grab the very first example's code to use as the default editor text
const initialCode = Object.values(examples)[0];

// 3. Initialize CodeMirror
const codeMirrorEditor = CodeMirror(document.getElementById("editor"), {
  theme: "dracula",
  lineNumbers: true,
  autoCloseBrackets: true,
  extraKeys: {
    "Cmd-Enter": runWasmCompiler,
    "Ctrl-Enter": runWasmCompiler,
  },
  value: initialCode,
});

const term = document.getElementById("termynal");
const toggle_format = document.getElementById("format-toggle");
const compiler_options_input = document.getElementById("compiler-options");
let termynal;
let outputBuffer = "";

// 4. Update editor when dropdown changes
example_select.addEventListener("change", (e) => {
  const selectedCode = examples[e.target.value];
  if (selectedCode) {
    codeMirrorEditor.setValue(selectedCode);
  }
});

function ansiToHtml(text) {
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\x1b\[0;31m/g, '<span style="color: #ff5555;">') // Dracula Red
    .replace(/\x1b\[0;32m/g, '<span style="color: #50fa7b;">') // Dracula Green
    .replace(/\x1b\[0;34m/g, '<span style="color: #8be9fd;">') // Dracula Cyan
    .replace(/\x1b\[0m/g, "</span>")
    .replace(/\n/g, "<br>");
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

  clearTerminal();

  let inputValue = codeMirrorEditor.getValue();
  const bufferSize = inputValue.length + 1;
  const bufferPointer = Module._malloc(bufferSize);
  Module.stringToUTF8(inputValue, bufferPointer, bufferSize);

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
      console.error("Bril JSON Parse/Convert failed. Falling back to raw text.", error);
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
    document.getElementById("run-btn").addEventListener("click", runWasmCompiler);
  },
};
