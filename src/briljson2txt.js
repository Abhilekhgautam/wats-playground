function args_to_strings(args) {
  if (args) {
    return `(${args.map((arg) => `${arg.name}: ${type_to_str(arg.type)}`).join(", ")})`;
  } else return "";
}

function type_to_str(type) {
  return type;
}

function value_to_str(value) {
  return value;
}

function instr_to_string(instr) {
  if (instr["op"] == "const") {
    let type;
    if ("type" in instr) {
      type = ": " + type_to_str(instr["type"]);
    } else {
      type = "";
    }
    let val = value_to_str(instr["value"]);
    return `  ${instr["dest"]}${type} = const ${val}\n`;
  } else {
    let rhs = "  " + instr["op"];
    if ("funcs" in instr) {
      for (const item of instr["funcs"]) {
        rhs += ` ${item}`;
      }
    }
    if ("args" in instr) {
      for (const item of instr["args"]) {
        rhs += ` ${item}`;
      }
    }
    if ("labels" in instr) {
      for (const item of instr["labels"]) {
        rhs += ` .${item}`;
      }
      rhs += "\n";
    }
    if ("dest" in instr) {
      let type;
      if ("type" in instr) {
        type = ": " + type_to_str(instr["type"]);
      } else {
        type = "";
      }

      return `  ${instr["dest"]}${type} = ${rhs}\n`;
    } else {
      return rhs;
    }
  }
}

function get_label(label) {
  return `.${label["label"]}\n`;
}

function get_instr(instr) {
  return instr_to_string(instr);
}

function get_func(func) {
  let fn_type = func.type ? func.type : "void";
  let string = `
@${func.name}${args_to_strings(func["args"])}{\n`;

  for (const label_or_instructions of func["instrs"]) {
    if ("label" in label_or_instructions) {
      string += get_label(label_or_instructions);
    } else {
      string += get_instr(label_or_instructions);
    }
  }
  string += "}\n";

  return string;
}

function get_prog(json_program) {
  let str = "";
  for (const item of json_program["functions"]) {
    str += get_func(item);
  }
  return str + "\n";
}

function bril2txt(json_program) {
  return get_prog(json_program);
}
