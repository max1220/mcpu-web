function MCPUAssembler() {
	this.log = console.log

	// pre-process a string(remove comments and convert strings to byte sequences)
	this.preprocess_str = (str) => {
		this.log("Pre-Processing:", str)
		// remove comments from string
		processed_str = str.replaceAll(/(#.*)/g, "")

		// replace quoted strings by the sequences of "BYTE <value>\n" pseudo-instructions
		processed_str = processed_str.replaceAll(/"(?:[^"\\]|\\.)*"/g, (quote_str) => {
			let str = []
			for (let i=0; i<quote_str.length; i++) {
				str.push("BYTE " + quote_str.charCodeAt(i))
			} 
			return str.join(" ")
		})

		this.log("Pre-Processed:", processed_str)
		return processed_str
	}

	// conever string to flat list of tokens(with line info)
	this.tokenize_str = (str) => {
		this.log("Tokenizing:", str)
		let lines = str.split(/\r?\n/)
		let tokens = []
		
		// push tokens with line info
		for (let line_i=0; line_i<lines.length; line_i++) {
			let line = lines[line_i]
			line_tokens = line.split(/\s+/)
			line_tokens.forEach((e) => {
				if (e == "") { return; }
				tokens.push({
					line_i: line_i,
					line: line,
					token: e,
				}
			)})
		}

		this.log("Tokens:", tokens)
		return tokens
	}
	
	// generate the sequence of instruction to encode the integer value
	let generate_imm_instructions = (val, fixed_width) => {
		if (val==0) { return [0x80]; }
		let bytes = []
		while (val > 0) {
			bytes.push(0x80 + (val & 0x7f))
			val = val >>> 7
		}
		return bytes.reverse()
	}

	// convert the list of tokens to a sequence of instructions and markers(locations, labels, label references)
	this.assemble_tokens = (tokens) => {
		this.log("Assembling:", tokens)
		// consume a single token
		let consume = () => {
			if (tokens.length == 0) { throw new Error("Expected token, got EOF!"); }
			return tokens.shift()
		}
		// consume an integer
		let consume_integer = () => {
			let token = consume()
			let n = parseInt(token.token)
			if (n==NaN) { throw new Error(`Expected number!\nIn line ${token.line_i}: ${token.line}`); }
			return n
		}
		// consume a string(all strings are upper-case)
		let consume_str = () => consume().token.toUpperCase()
		// consume an instruction source name
		let consume_source = () => {
			let source_token = consume()
			let source_name = source_token.token.toUpperCase()
			if (!MCPU_source_names_any.hasOwnProperty(source_name)) { throw new Error(`Expected source!\nIn line ${source_token.line_i}: ${source_token.line}`); }
			return MCPU_source_names_any[source_name]
		}
		// consume an instruction target name
		let consume_target = () => {
			let target_token = consume()
			let target_name = target_token.token.toUpperCase()
			if (!MCPU_target_names_any.hasOwnProperty(target_name)) { throw new Error(`Expected target!\nIn line ${target_token.line_i}: ${target_token.line}`); }
			return MCPU_target_names_any[target_name]
		}
		// consume an instruction
		let consume_instr = () => {
			let instr_token = consume()
			let instr_name = instr_token.token.toUpperCase()
			let instructions = []
			if (instr_name == "BYTE") {
				// include a literal byte in the op-codes(push literal byte)
				instructions.push({ byte: consume_integer(), instr_token: instr_token})
			} else if (instr_name == "IMM") {
				// immediate value, push multiple instructions to encode integer(push instruction byte)
				let val = consume_integer()
				generate_imm_instructions(val).forEach(e => instructions.push({ byte: e, instr_token: instr_token }))
			} else if (instr_name == "ALU") {
				// ALU operation(is an immediate value instruction)
				// get primary operation index
				let arith_op_token = consume()
				let arith_op_name = arith_op_token.token.toUpperCase()
				if (!MCPU_alu_ops_all.hasOwnProperty(arith_op_name)) { throw new Error(`Expected ALU operation!\nIn line ${arith_op_token.line_i}: ${arith_op_token.line}`); }
				let arith_op_i = MCPU_alu_ops_all[arith_op_name]
				// get b selection index
				let b_sel_token = consume()
				let b_sel_name = b_sel_token.token.toUpperCase()
				if (b_sel_name == "_") { b_sel_name = "B"; }
				if (!MCPU_alu_b_sel.hasOwnProperty(b_sel_name)) { throw new Error(`Expected ALU B select!\nIn line ${arith_op_token.line_i}: ${arith_op_token.line}`); }
				let b_sel_i = MCPU_alu_b_sel[b_sel_name]
				// parse flags/immediate value
				let flags = 0
				let imm_val = 0
				let flags_token = consume()
				let flags_str = flags_token.token.toUpperCase()
				if (flags_str.startsWith("C")) { flags = MCPU_alu_bits.CIN; flags_str = flags_str.substr(1); }
				else if (flags_str.startsWith("I")) { flags = MCPU_alu_bits.INV; flags_str = flags_str.substr(1); }
				else if (parseInt(flags_str)) { imm_val = parseInt(flags_str); }
				// emit IMM instructions
				let alu_op = arith_op_i + b_sel_i<<6 + flags + imm_val<<7
				generate_imm_instructions(alu_op).forEach(e => instructions.push({ byte: e, instr_token: instr_token }))
			} else if ((instr_name == "MOV") || (instr_name == "CMOV")) {
				// (conditional) move instruction(push instruction byte)
				let source = consume_source()
				let target = consume_target()
				let cond_bit = (instr_name == "CMOV") ? 64 : 0
				instructions.push({ byte: source + target*8 + cond_bit, instr_token: instr_token })
			} else if (instr_name == "IMOV") {
				// IMM + MOV combined instruction
				let val = consume_integer()
				generate_imm_instructions(val).forEach(e => instructions.push({ byte: e, instr_token: instr_token }))
				let target = consume_target()
				instructions.push({ byte: MCPU_source_names.SRG_IMM + target*8, instr_token: instr_token })
			} else if ((instr_name == "LOCATION") || (instr_name == "@")) {
				// setting new location(push location definition marker)
				instructions.push({ location: consume_integer(), instr_token: instr_token })
			} else if ((instr_name == "LABEL") || (instr_name == ":")) {
				// defining a label(push label definition marker)
				instructions.push({ label: consume().token, instr_token: instr_token })
			} else if ((instr_name == "IMM_REF") || (instr_name == "RIMM")) {
				// reference to a label as an IMM value(push label reference marker)
				instructions.push({ label_ref_imm: consume().token, instr_token: instr_token })
			} else {
				throw new Error(`Unknown instruction!\nIn line ${instr_token.line_i}: ${instr_token.line}`);
			}
			return instructions
		}

		// consume all instructions
		let assembled = []
		while (tokens.length>0) {
			consume_instr().forEach(e => assembled.push(e))
		}
		this.log("Assembled:", assembled)
		return assembled
	}

	// link the specified assembly instructions into a file:
	// put bytes at correct location in image, note label locations and resolve label references
	this.link_assembly = (assembled) => {
		this.log("linking:", assembled)
		let image_bytes = [] // output image bytes
		let cur_pos = 0 // current index in out_image
		let max_pos = 0 // maximum index in out_image
		let labels = {} // defined labels in the image
		let fixups = [] // list of second-pass fixes for label forward references
		let external_symbols = [] // list of symbols that need to be resolved externally(unresolved fixups)

		// emit a single byte to the image at the current position
		let emit = (byte) => { image_bytes[cur_pos] = byte; cur_pos++; max_pos = Math.max(cur_pos, max_pos) }

		// first pass: emit regular instructions/bytes, note label locations, resolve backward label references and note forward references as fixups
		for (let i=0; i<assembled.length; i++) {
			let instr = assembled[i]
			if (instr.byte) {
				// emit a regular instruction or data byte
				emit(instr.byte)
			} else if (instr.location) {
				// change location in image
				cur_pos = instr.location
			} else if (instr.label) {
				// note label location
				if (labels[instr.label]) {
					throw new Error(`Label ${instr.label} redefined!\nIn line ${instr.instr_token.line_i}: ${instr.instr_token.line}`);
				}
				labels[instr.label] = cur_pos
			} else if (instr.label_ref_imm) {
				if (labels[instr.label_ref_imm]) {
					// valid backward reference, generate IMM instruction immediately
					generate_imm_instructions(labels[instr.label_ref_imm]).forEach(e => emit(e))
				} else {
					// possible forward reference, generate placeholder and defer fixup
					fixups.push({
						pos: cur_pos,
						label: instr.label_ref_imm,
						instr: instr
					})
					for (let i=0; i<5; i++) { emit(0x09); }
				}
			}
		}

		// second pass: fix forward label references in generated code
		for (let fixup of fixups) {
			if (labels[fixup.label]) {
				// resolved forward reference, fix the placeholder to point at 
				cur_pos = fixup.pos
				generate_imm_instructions(labels[fixup.label]).forEach(e => emit(e))
			} else {
				this.log(`Warning: No location for label '${fixup.label}'! (external symbol or missing definition?)\nIn line ${fixup.instr.instr_token.line_i}: ${fixup.instr.instr_token.line}`)
				external_symbols.push(fixup)
			}
		}

		// return image and info
		let linked = {
			image: image_bytes,
			labels: labels,
			external_symbols: external_symbols
		}
		this.log("linked:", linked)
		return linked
	}
}
