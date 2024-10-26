// you can modify this to use any MCPU variant
var MCPU_data_bits = 32 // data bus width
var MCPU_dram_type = Uint32Array // constructor for RAM on the data bus(DRAM)

// derived constants
var MCPU_imm_stages = Math.ceil(MCPU_data_bits/7) // count of shift register stages
var MCPU_data_mask = Math.pow(2, MCPU_data_bits)-1 // 0xff...
var MCPU_data_high = Math.pow(2, MCPU_data_bits-1) // 0x80...

// ALU arithmetic(data) operation names
var MCPU_alu_ops = {
	ADD: 0,
	AND: 1,
	OR: 2,
	XOR: 3,
	A: 4,
	B: 5,
	X: 6,
	Y: 7,
}
// ALU alternate test(flag) operation names
var MCPU_alu_tests = {
	A_EQ_Z: 0,
	B_EQ_Z: 1,
	A_GT_B: 2,
	A_EQ_B: 3,
	A_LT_B: 4,
	B_LO: 5,
	B_HI: 6,
	SENSE: 7
}
// Any ALU operation name
var MCPU_alu_ops_all = {}
for (let key in MCPU_alu_ops) { MCPU_alu_ops_all[key] = MCPU_alu_ops[key]; }
for (let key in MCPU_alu_tests) { MCPU_alu_ops_all[key] = MCPU_alu_tests[key]; }


// additional ALU operation bits
var MCPU_alu_bits = {
	INV: 4,
	CIN: 8,
}
// ALU B(pre) operation
var MCPU_alu_b_sel = {
	B: 0,
	IMM: 1,
	RSHIFT: 2,
	LSHIFT: 3,
}

// map name of sources on the bus to source index
var MCPU_source_names = {
	// long names
	CNT_PC: 0,
	REG_ADDR: 1,
	READ_RAM: 2,
	SRG_IMM: 3,
	ALU_RES: 4,
	REG_I: 5,
	REG_J: 6,
	REG_K: 7
}
var MCPU_source_names_short = {
	// short names
	PC: 0,
	ADDR: 1,
	RAM: 2,
	IMM: 3,
	ALU: 4,
	I: 5,
	J: 6,
	K: 7,
}
// short or long names
var MCPU_source_names_any = {}
for (let key in MCPU_source_names) { MCPU_source_names_any[key] = MCPU_source_names[key]; }
for (let key in MCPU_source_names_short) { MCPU_source_names_any[key] = MCPU_source_names_short[key]; }

// map name of targets on the bus to target index
var MCPU_target_names = {
	// long names
	CNT_PC: 0,
	REG_ADDR: 1,
	WRITE_RAM: 2,
	ALU_A: 3,
	ALU_B: 4,
	REG_I: 5,
	REG_J: 6,
	REG_K: 7,
}
var MCPU_target_names_short = {
	// short names
	PC: 0,
	ADDR: 1,
	RAM: 2,
	A: 3,
	B: 4,
	I: 5,
	J: 6,
	K: 7,
}
// short or long names
var MCPU_target_names_any = {}
for (let key in MCPU_target_names) { MCPU_target_names_any[key] = MCPU_target_names[key]; }
for (let key in MCPU_target_names_short) { MCPU_target_names_any[key] = MCPU_target_names_short[key]; }
