function MCPUEmulator(irom_size, dram_size) {
	// CPU state
	this.CNT_PC = 0
	this.SRG_IMM = 0
	this.REG_ADDR = 0
	this.REG_ALU_A = 0
	this.REG_ALU_B = 0
	this.REG_I = 0
	this.REG_J = 0
	this.REG_K = 0
	this.FLAG_LASTIMM = false
	this.halted = false
	this.IROM = new Uint8Array(irom_size)
	this.DRAM = new MCPU_dram_type(dram_size)

	// serial callback functions
	this.read_serial = () => { return 0; }
	this.write_serial = (c) => {}

	// logging function for instruction trace
	this.log = console.log

	// reset the CPU state
	this.reset = () => {
		this.CNT_PC = 0
		this.SRG_IMM = 0
		this.REG_ADDR = 0
		this.REG_ALU_A = 0
		this.REG_ALU_B = 0
		this.REG_I = 0
		this.REG_J = 0
		this.REG_K = 0
		this.FLAG_LASTIMM = false
		this.halted = false
		this.DRAM.fill(0)
	}

	// get the current value of a source on the bus
	this.sources = [
		() => this.CNT_PC,
		() => this.REG_ADDR,
		() => this.DRAM[this.REG_ADDR] || 0,
		() => this.SRG_IMM,
		() => this.alu_res(),
		() => this.REG_I,
		() => this.REG_J,
		() => this.REG_K,
	]

	// write a value to a target on the bus
	this.targets = [
		(val) => this.CNT_PC = val,
		(val) => this.REG_ADDR = val,
		(val) => this.DRAM[this.REG_ADDR] = val,
		(val) => this.REG_ALU_A = val,
		(val) => this.REG_ALU_B = val,
		(val) => this.REG_I = val,
		(val) => this.REG_J = val,
		(val) => this.REG_K = val,
	]

	// get ALU extra inputs
	this.alu_x = () => 0
	this.alu_y = () => 0
	this.alu_sense = () => false

	// calculate effective value of ALU B input(REG_ALU_B modified by ALU B operation)
	this.alu_b = () => {
		let alu_b_sel = (this.SRG_IMM & MCPU_alu_op_b_sel_mask) >>> MCPU_alu_op_b_sel_shift
		if ((this.SRG_IMM & MCPU_alu_op_b_sel_mask) == 0x20) { return this.SRG_IMM >>> 7; }
		else if ((this.SRG_IMM & MCPU_alu_op_b_sel_mask) == 0x40) { return this.REG_ALU_B >>> 1; }
		else if ((this.SRG_IMM & MCPU_alu_op_b_sel_mask) == 0x60) { return ((this.REG_ALU_B << 1) & MCPU_data_mask) >>> 0; }
		else { return this.REG_ALU_B; }
	}

	// get the boolean test output of the ALU
	this.alu_test = () => {
		let alu_op = this.SRG_IMM & MCPU_alu_op_mask
		console.log("alu_test", alu_op)
		if (alu_op==0) { return this.REG_ALU_A == 0; }
		else if (alu_op==1) { return this.alu_b() == 0; }
		else if (alu_op==2) { return (this.REG_ALU_A>>>0) > (this.alu_b()>>>0); }
		else if (alu_op==3) { return (this.REG_ALU_A>>>0) == (this.alu_b()>>>0); }
		else if (alu_op==4) { return (this.REG_ALU_A>>>0) < (this.alu_b()>>>0); }
		else if (alu_op==5) { return (this.alu_b() & 1) !== 0; }
		else if (alu_op==6) { return (this.alu_b() & MCPU_data_high) !== 0; }
		else if (alu_op==7) { return this.alu_sense(); }
	}

	// get the data output(result) of the ALU
	this.alu_res = () => {
		let alu_op = this.SRG_IMM & MCPU_alu_op_mask
		if (alu_op==0) { return (this.REG_ALU_A + this.alu_b() + ((alu_op & 0x10)>>4)) & MCPU_data_mask; }
		else if (alu_op==1) { return this.REG_ALU_A & this.alu_b(); }
		else if (alu_op==2) { return this.REG_ALU_A | this.alu_b(); }
		else if (alu_op==3) { return this.REG_ALU_A ^ this.alu_b(); }
		else if (alu_op==4) { return this.REG_ALU_A; }
		else if (alu_op==5) { return this.alu_b(); }
		else if (alu_op==6) { return this.alu_x(); }
		else if (alu_op==7) { return this.alu_y(); }
	}

	// execute a single instruction
	this.step = () => {
		let op_addr = this.CNT_PC
		let op = this.IROM[op_addr] || 0
		this.CNT_PC = this.CNT_PC + 1
		this.log(`0x${op_addr.toString(16)}: 0x${op.toString(16)} (${disassemble_op(op).instr_name})`)
		if (op == 0) {
			// HALT pseudo-instruction
			this.halted = true
			this.FLAG_LASTIMM = false
			return true;
		} else if (op & 0x80) {
			// IMM instruction
			if (this.FLAG_LASTIMM) {
				this.SRG_IMM = (((this.SRG_IMM << 7) | ( op & MCPU_op_imm_mask )) & MCPU_data_mask) >>> 0
			} else {
				this.SRG_IMM = op & MCPU_op_imm_mask
			}
			this.FLAG_LASTIMM = true
		} else {
			// MOV/CMOV instruction
			let target_func = this.targets[(op>>3) & 7]
			let source_val = this.sources[op & 7]() >>> 0
			let do_exec = true
			if (op & 0x40) { do_exec = this.alu_test(); }
			if (do_exec) { target_func(source_val); }
			this.FLAG_LASTIMM = false
		}
	}

	// run up to step_count instructions as long as the CPU is not halted
	// return true if the CPU was halted, false if it can run again
	this.steps = (step_count) => {
		for (let i=0; i<step_count; i++) {
			if (this.halted) { return true; }
			this.step()
		}
		return false
	}
}
