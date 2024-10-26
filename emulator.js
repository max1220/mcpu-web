var mcpu = new MCPUEmulator(0x4000)
var running = false
var steps_per_update = 1

function update_memory_with_context(mem, center_addr, context_size, elem) {
	let start_addr = Math.max(center_addr - context_size, 0)
	let stop_addr = Math.min(start_addr+2*context_size+1, mem.length)
	elem.innerHTML = ""
	for (let i=start_addr; i<stop_addr; i++) {
		let i_str = "0x" + i.toString(16).padStart(4, "0")
		let v_str = "0x" + mem[i].toString(16)
		if (v_str == "0x0") { v_str = ""; }
		if (i == center_addr) {
			elem.innerHTML += `<b>${i_str}&gt; ${v_str} &lt;</b><br>`
		} else {
			elem.innerHTML += `<b>${i_str}</b>: ${v_str}<br>`
		}
	}
}

function update_dram() {
	update_memory_with_context(mcpu.DRAM, mcpu.REG_ADDR, 3, window.dram_text)
}

function update_irom() {
	update_memory_with_context(mcpu.IROM, mcpu.CNT_PC, 3, window.irom_text)
}

function update_ui() {
	table_cnt_pc.innerText = "0x"+mcpu.CNT_PC.toString(16)
	table_srg_imm.innerText = "0x"+mcpu.SRG_IMM.toString(16)
	table_reg_addr.innerText = "0x"+mcpu.REG_ADDR.toString(16)
	table_alu_a.innerText = "0x"+mcpu.ALU_A.toString(16)
	table_alu_b.innerText = "0x"+mcpu.ALU_B.toString(16)
	update_dram()
	update_irom()
}

function cb_btn_step() {
	mcpu.step()
	update_ui()
}

function cb_timer_running() {
	let halted = false
	for (let i=0; i<steps_per_update; i++) {
		if (mcpu.step()) { halted = true; break; }
	}
	if (!halted && running) {	
		update_ui()
		btn_stop.classList.remove("hidden")
		btn_run.classList.add("hidden")
		btn_step.classList.add("hidden")
		btn_reset.classList.add("hidden")
		requestAnimationFrame(cb_timer_running)
	} else {
		btn_stop.classList.add("hidden")
		btn_run.classList.remove("hidden")
		btn_step.classList.remove("hidden")
		btn_reset.classList.remove("hidden")
		running = false
	}
}

function cb_btn_run() {
	running = true
	cb_timer_running()
}
function cb_btn_stop() {
	running = false
}

mcpu.targets[5] = function(val) {
	serial_out.innerText += String.fromCharCode(val)
}

function cb_btn_reset() {
	running = false
	mcpu.reset()
	update_ui()
	serial_out.innerText = ""
	serial_in.value = ""
}
cb_btn_reset()

function cb_irom_file_changed() {
	const reader = new FileReader();
	reader.addEventListener("load", (event) => {
		let input_file_data = new Uint8Array(event.target.result)
		for (let i=0; i<input_file_data.length; i++) {
			mcpu.IROM[i] = input_file_data[i]
		}
		cb_btn_reset()
	})
	reader.readAsArrayBuffer(event.target.files[0])
}

function cb_dram_file_changed() {
	const reader = new FileReader();
	reader.addEventListener("load", (event) => {
		let input_file_data = new Uint8Array(event.target.result)
		for (let i=0; i<input_file_data; i++) {
			mcpu.DRAM[i] = input_file_data[i]
		}
		cb_btn_reset()
	})
	reader.readAsArrayBuffer(event.target.files[0])
}
