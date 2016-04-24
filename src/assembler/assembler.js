(function () {
	'use strict'

	const instructions = {
		'ADC': {
			immediate: 0x69,
			zeroPage: 0x65,
			zeroPageX: 0x75,
			absolute: 0x6D,
			absoluteX: 0x7D,
			absoluteY: 0x79,
			indexedIndirect: 0x61,
			indirectIndexed: 0x71
		},
		'AND': {
			immediate: 0x29,
			zeroPage: 0x25,
			zeroPageX: 0x35,
			absolute: 0x2D,
			absoluteX: 0x3D,
			absoluteY: 0x39,
			indexedIndirect: 0x21,
			indirectIndexed: 0x31
		},
		'ASL': {
			accumulator: 0x0A,
			zeroPage: 0x06,
			zeroPageX: 0x16,
			absolute: 0x0E,
			absoluteX: 0x1E
		},
		'BCC': { relative: 0x90 },
		'BCS': { relative: 0xB0 },
		'BEQ': { relative: 0xF0 },
		'BIT': {
			zeroPage: 0x24,
			absolute: 0x2C
		},
		'BMI': { relative: 0x30 },
		'BNE': { relative: 0xD0 },
		'BPL': { relative: 0x10 },
		'BRK': {},
		'BVC': {},
		'BVS': {},
		'CLC': {},
		'CLD': {},
		'CLI': {},
		'CLV': {},
		'CMP': {},
		'CPX': {},
		'CPY': {},
		'DEC': {},
		'DEX': {},
		'DEY': {},
		'EOR': {},
		'INC': {},
		'INX': {},
		'INY': {},
		'JMP': {},
		'JSR': {},
		'LDA': {},
		'LDX': {},
		'LDY': {},
		'LSR': {},
		'NOP': {},
		'ORA': {},
		'PHA': {},
		'PHP': {},
		'PLA': {},
		'PLP': {},
		'ROL': {},
		'ROR': {},
		'RTI': {},
		'RTS': {},
		'SBC': {},
		'SEC': {},
		'SED': {},
		'SEI': {},
		'STA': {},
		'STX': {},
		'STY': {},
		'TAX': {},
		'TAY': {},
		'TSX': {},
		'TXA': {},
		'TXS': {},
		'TYA': {}
	}

	function parseByte (left = 0, right = 0) {
		return (string) => {
			const trimmed = string.substring(left + 1, string.length - right)
			return [parseInt(trimmed, 16)]
		}
	}

	function parseWord (left = 0, right = 0) {
		return (string) => {
			const trimmed = string.substring(left + 1, string.length - right)
			const value = parseInt(trimmed, 16)
			return [value & 0xFF, value >> 8]
		}
	}

	const matchers = {
		accumulator: {
			test: (string) => string === 'A',
			extract: () => []
		},
		immediate: {
			test: (string) => /^#\$[\dA-Fa-f]{2}$/.test(string),
			extract: parseByte(1)
		},
		zeroPage: {
			test: (string) => /^\$[\dA-Fa-f]{2}$/.test(string),
			extract: parseByte()
		},
		zeroPageX: {
			test: (string) => /^\$[\dA-Fa-f]{2},X$/.test(string),
			extract: parseByte(0, 2)
		},
		zeroPageY: {
			test: (string) => /^\$[\dA-F]{2},Y$/.test(string),
			extract: parseByte(0, 2)
		},
		absolute: {
			test: (string) => /^\$[\dA-F]{4}$/.test(string),
			extract: parseWord()
		},
		absoluteX: {
			test: (string) => /^\$[\dA-F]{4},X$/.test(string),
			extract: parseWord(0, 2)
		},
		absoluteY: {
			test: (string) => /^\$[\dA-F]{4},Y$/.test(string),
			extract: parseWord(0, 2)
		},
		indirect: {
			test: (string) => /^\(\$[\dA-F]{4}\)$/.test(string),
			extract: parseWord(1, 1)
		},
		indexedIndirect: {
			test: (string) => /^\(\$[\dA-F]{2},X\)$/.test(string),
			extract: parseByte(1, 3)
		},
		indirectIndexed: {
			test: (string) => /^\(\$[\dA-F]{2}\),Y$/.test(string),
			extract: parseByte(1, 3)
		}
	}

	function assemble (string) {
		const lines = string.split('\n')

		const encoded = lines.map((line) => {
			const [_, mnemonic, operand] = line.match(/(\w+)\s+([\dA-F#$(),XY]+)?/)

			const variants = instructions[mnemonic]
			const matchVariant = Object.keys(variants).find((name) =>
				matchers[name].test(operand)
			)

			if (matchVariant) {
				const opcode = variants[matchVariant]
				const argument = matchers[matchVariant].extract(operand)
				return [opcode, ...argument]
			} else {
				throw new Error(`error while trying to parse: "${line}"`)
			}
		})

		return [].concat(...encoded)
	}

	window.c64 = window.c64 || {}
	window.c64.assembler = { assemble }
})()