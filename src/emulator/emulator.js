(function () {
	'use strict'

	const START_PROGRAM = 0x200

	const addressModes = {
		absolute: {
			getAddress ({ memory, programCounter }) {
				return memory[programCounter] |
					memory[programCounter + 1] << 8
			},
			bytes: 2
		},

		absoluteX: {
			getAddress ({ memory, programCounter, X }) {
				return memory[programCounter + X] |
					memory[programCounter + X + 1] << 8
			},
			bytes: 2
		},

		absoluteY: {
			getAddress ({ memory, programCounter, Y }) {
				return memory[programCounter + Y] |
					memory[programCounter + Y + 1] << 8
			},
			bytes: 2
		},

		zeroPage: {
			getAddress ({ memory, programCounter }) {
				return memory[programCounter]
			},
			bytes: 1
		},

		zeroPageX: {
			getAddress ({ memory, programCounter, X }) {
				return (memory[programCounter] + X) & 0xFF
			},
			bytes: 1
		},

		zeroPageY: {
			getAddress ({ memory, programCounter, Y }) {
				return (memory[programCounter] + Y) & 0xFF
			},
			bytes: 1
		},

		immediate: {
			getAddress ({ programCounter }) {
				return programCounter
			},
			bytes: 1
		},

		relative: {
			getAddress ({ memory, programCounter }) {
				return programCounter + memory[programCounter]
			},
			bytes: 1
		},

		indirect: {
			getAddress ({ memory, programCounter }) {
				const addressAddress = memory[programCounter] |
					memory[programCounter + 1] << 8
				return memory[addressAddress]
			},
			bytes: 2
		},

		indexedIndirect: {
			getAddress ({ memory, programCounter, X }) {
				const address = memory[programCounter + X] |
					memory[programCounter + X + 1] << 8
				return memory[address] | memory[address + 1] << 8
			},
			bytes: 1
		},

		indirectIndexed: {
			getAddress ({ memory, programCounter, Y }) {
				const address = memory[programCounter] |
					memory[programCounter + 1] << 8
				return memory[address + Y] | memory[address + Y + 1] << 8
			},
			bytes: 1
		}
	}

	function push (state, value) {
		state.memory[state.stackPointer + 0x0100] = value
		state.stackPointer--
	}

	function pop (state) {
		state.stackPointer++
		return state.memory[state.stackPointer + 0x0100]
	}

	const instructionTypes = {
		ADC (state, address) {
			state.A += state.memory[address]
		},

		AND (state, address) {
			state.A &= state.memory[address]
		},

		ASL (state, address) {
			state.A = state.memory[address] << 1
		},

		ASL_A (state) {
			state.A <<= 1
		},

		DEC (state, address) {
			state.memory[address]--
		},

		DEX (state) {
			if (state.X === 0) {
				state.X = 255
			} else {
				state.X--
			}
		},

		DEY (state) {
			if (state.Y === 0) {
				state.Y = 255
			} else {
				state.Y--
			}
		},

		EOR (state, address) {
			state.A ^= state.memory[address]
		},

		INC (state, address) {
			state.memory[address]++
		},

		INX (state) {
			state.X++
		},

		INY (state) {
			state.Y++
		},

		LDA (state, address) {
			state.A = state.memory[address]
		},

		LDX (state, address) {
			state.X = state.memory[address]
		},

		LDY (state, address) {
			state.Y = state.memory[address]
		},

		LSR (state, address) {
			state.memory[address] >>= 1
		},

		LSR_A (state) {
			state.A >>= 1
		},

		ORA (state, address) {
			state.A |= state.memory[address]
		},

		PHA (state) {
			push(state, state.A)
		},

		PHP (state) {
			push(state, state.statusRegister)
		},

		PLA (state) {
			state.A = pop(state)
		},

		PLP (state) {
			state.statusRegister = pop(state)
		},

		ROL (state, address) {
			const oldValue = state.memory[address]
			state.memory[address] = oldValue << 1 | (oldValue & 0b10000000) >> 7
		},

		ROL_A (state) {
			const oldValue = state.A
			state.A = oldValue << 1 | (oldValue & 0b10000000) >> 7
		},

		ROR (state, address) {
			const oldValue = state.memory[address]
			state.memory[address] = oldValue >> 1 | (oldValue & 0b1) << 7
		},

		ROR_A (state) {
			const oldValue = state.A
			state.A = oldValue >> 1 | (oldValue & 0b1) << 7
		},

		SBC (state, address) {
			state.A -= state.memory[address]
		},

		STA (state, address) {
			state.memory[address] = state.A
		},

		STX (state, address) {
			state.memory[address] = state.X
		},

		STY (state, address) {
			state.memory[address] = state.Y
		},

		TAX (state) {
			state.X = state.A
		},

		TAY (state) {
			state.Y = state.A
		},

		TSX (state) {
			state.X = state.stackPointer
		},

		TXA (state) {
			state.A = state.X
		},

		TXS (state) {
			state.stackPointer = state.X
		},

		TYA (state) {
			state.A = state.Y
		}
	}

	function makeState () {
		return {
			memory: new Uint8Array(0x10000),
			programCounter: START_PROGRAM,
			statusRegister: 0, // NV-B DIZC
			stackPointer: 0xFF,
			X: 0,
			Y: 0,
			A: 0
		}
	}

	function makeInstructions () {
		const instructions = []

		function registerInstruction (instructionType, opcode, addressMode) {
			instructions[opcode] = addressMode ?
				(state) => {
					const address = addressMode.getAddress(state)
					instructionType(state, address)
					state.programCounter += addressMode.bytes
				} : instructionType
		}

		function registerInstructions (instructionType, pairs) {
			pairs.forEach(([opcode, addressMode]) => {
				registerInstruction(instructionType, opcode, addressMode)
			})
		}

		registerInstructions(instructionTypes.ADC, [
			[0x61, addressModes.indexedIndirect],
			[0x65, addressModes.zeroPage],
			[0x69, addressModes.immediate],
			[0x6D, addressModes.absolute],
			[0x71, addressModes.indirectIndexed],
			[0x75, addressModes.zeroPageX],
			[0x79, addressModes.absoluteY],
			[0x7D, addressModes.absoluteX]
		])

		registerInstructions(instructionTypes.AND, [
			[0x21, addressModes.indexedIndirect],
			[0x25, addressModes.zeroPage],
			[0x29, addressModes.immediate],
			[0x2D, addressModes.absolute],
			[0x31, addressModes.indirectIndexed],
			[0x35, addressModes.zeroPageX],
			[0x39, addressModes.absoluteY],
			[0x3D, addressModes.absoluteX]
		])

		registerInstructions(instructionTypes.ASL, [
			[0x06, addressModes.zeroPage],
			[0x0E, addressModes.absolute],
			[0x16, addressModes.zeroPageX],
			[0x1E, addressModes.absoluteX]
		])

		registerInstruction(instructionTypes.ASL_A, 0x0A)

		registerInstructions(instructionTypes.DEC, [
			[0xC6, addressModes.zeroPage],
			[0xD6, addressModes.zeroPageX],
			[0xCE, addressModes.absolute],
			[0xDE, addressModes.absoluteX]
		])

		registerInstruction(instructionTypes.DEX, 0xCA)

		registerInstruction(instructionTypes.DEY, 0x88)

		registerInstructions(instructionTypes.EOR, [
			[0x49, addressModes.immediate],
			[0x45, addressModes.zeroPage],
			[0x55, addressModes.zeroPageX],
			[0x4D, addressModes.absolute],
			[0x5D, addressModes.absoluteY],
			[0x59, addressModes.absoluteX],
			[0x41, addressModes.indexedIndirect],
			[0x51, addressModes.indirectIndexed]
		])

		registerInstructions(instructionTypes.INC, [
			[0xE6, addressModes.zeroPage],
			[0xF6, addressModes.zeroPageX],
			[0xEE, addressModes.absolute],
			[0xFE, addressModes.absoluteX]
		])

		registerInstruction(instructionTypes.INX, 0xE8)

		registerInstruction(instructionTypes.INY, 0xC8)

		registerInstructions(instructionTypes.LDA, [
			[0xA9, addressModes.immediate],
			[0xA5, addressModes.zeroPage],
			[0xB5, addressModes.zeroPageX],
			[0xAD, addressModes.absolute],
			[0xBD, addressModes.absoluteY],
			[0xB9, addressModes.absoluteX],
			[0xA1, addressModes.indexedIndirect],
			[0xB1, addressModes.indirectIndexed]
		])

		registerInstructions(instructionTypes.LDX, [
			[0xA2, addressModes.immediate],
			[0xA6, addressModes.zeroPage],
			[0xB6, addressModes.zeroPageY],
			[0xAE, addressModes.absolute],
			[0xBE, addressModes.absoluteY]
		])

		registerInstructions(instructionTypes.LDY, [
			[0xA0, addressModes.immediate],
			[0xA4, addressModes.zeroPage],
			[0xB4, addressModes.zeroPageX],
			[0xAC, addressModes.absolute],
			[0xBC, addressModes.absoluteX]
		])

		registerInstructions(instructionTypes.LSR, [
			[0x46, addressModes.zeroPage],
			[0x56, addressModes.zeroPageX],
			[0x4E, addressModes.absolute],
			[0x5E, addressModes.absoluteX]
		])

		registerInstruction(instructionTypes.LSR_A, 0x4A)

		registerInstructions(instructionTypes.ORA, [
			[0x09, addressModes.immediate],
			[0x05, addressModes.zeroPage],
			[0x15, addressModes.zeroPageX],
			[0x0D, addressModes.absolute],
			[0x1D, addressModes.absoluteY],
			[0x19, addressModes.absoluteX],
			[0x01, addressModes.indexedIndirect],
			[0x11, addressModes.indirectIndexed]
		])

		registerInstruction(instructionTypes.PHA, 0x48)

		registerInstruction(instructionTypes.PHP, 0x08)

		registerInstruction(instructionTypes.PLA, 0x68)

		registerInstruction(instructionTypes.PLP, 0x28)

		registerInstructions(instructionTypes.ROL, [
			[0x26, addressModes.zeroPage],
			[0x36, addressModes.zeroPageX],
			[0x2E, addressModes.absolute],
			[0x3E, addressModes.absoluteX]
		])

		registerInstruction(instructionTypes.ROL_A, 0x2A)

		registerInstructions(instructionTypes.ROR, [
			[0x66, addressModes.zeroPage],
			[0x76, addressModes.zeroPageX],
			[0x6E, addressModes.absolute],
			[0x7E, addressModes.absoluteX]
		])

		registerInstruction(instructionTypes.ROR_A, 0x6A)

		registerInstructions(instructionTypes.SBC, [
			[0xE9, addressModes.immediate],
			[0xE5, addressModes.zeroPage],
			[0xF5, addressModes.zeroPageX],
			[0xED, addressModes.absolute],
			[0xFD, addressModes.absoluteY],
			[0xF9, addressModes.absoluteX],
			[0xE1, addressModes.indexedIndirect],
			[0xF1, addressModes.indirectIndexed]
		])

		registerInstructions(instructionTypes.STA, [
			[0x85, addressModes.zeroPage],
			[0x95, addressModes.zeroPageX],
			[0x8D, addressModes.absolute],
			[0x9D, addressModes.absoluteY],
			[0x99, addressModes.absoluteX],
			[0x81, addressModes.indexedIndirect],
			[0x91, addressModes.indirectIndexed]
		])

		registerInstructions(instructionTypes.STX, [
			[0x86, addressModes.zeroPage],
			[0x96, addressModes.zeroPageY],
			[0x8E, addressModes.absolute]
		])

		registerInstructions(instructionTypes.STY, [
			[0x84, addressModes.zeroPage],
			[0x94, addressModes.zeroPageX],
			[0x8C, addressModes.absolute]
		])

		registerInstruction(instructionTypes.TAX, 0xAA)

		registerInstruction(instructionTypes.TAY, 0xA8)

		registerInstruction(instructionTypes.TSX, 0xBA)

		registerInstruction(instructionTypes.TXA, 0x8A)

		registerInstruction(instructionTypes.TXS, 0x9A)

		registerInstruction(instructionTypes.TYA, 0x98)

		return instructions
	}

	function makeCpu () {
		const instructions = makeInstructions()

		const state = makeState()

		function getState() {
			return state
		}

		function load (romData) {
			state.memory.set(romData, START_PROGRAM)
		}

		function tick () {
			const opcode = state.memory[state.programCounter]
			const instruction = instructions[opcode]

			state.programCounter++

			instruction(state)
		}

		function run ({ stopOpcode }) {
			while (state.memory[state.programCounter] !== stopOpcode) {
				tick()
			}
		}

		return {
			getState,
			load,
			tick,
			run
		}
	}

	window.c64 = window.c64 || {}
	window.c64.emulator = { makeCpu }
})()