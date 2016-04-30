(function () {
	'use strict'

	const {
		assembler: { assemble },
		emulator: { makeCpu }
	} = window.c64

	function execute (code) {
		const rom = assemble(code)
		const cpu = makeCpu()
		cpu.load(rom)
		cpu.tick()
		return cpu.getState()
	}

	const specs = {
		'ADC': [{
			code: 'ADC #$23',
			result: { A: 0x23 }
		}, {
			code: 'ADC $23',
			result: { A: 0 }
		}, {
			code: 'ADC $23,X',
			result: { A: 0 }
		}, {
			code: 'ADC $2345',
			result: { A: 0 }
		}, {
			code: 'ADC $2345,X',
			result: { A: 0 }
		}, {
			code: 'ADC $2345,Y',
			result: { A: 0 }
		}, {
			code: 'ADC ($23,X)',
			result: { A: 0 }
		}, {
			code: 'ADC ($23),Y',
			result: { A: 0 }
		}],
		'AND': [{
			code: 'AND #$23',
			result: { A: 0 }
		}, {
			code: 'AND $23',
			result: { A: 0 }
		}, {
			code: 'AND $23,X',
			result: { A: 0 }
		}, {
			code: 'AND $2345',
			result: { A: 0 }
		}, {
			code: 'AND $2345,X',
			result: { A: 0 }
		}, {
			code: 'AND $2345,Y',
			result: { A: 0 }
		}, {
			code: 'AND ($23,X)',
			result: { A: 0 }
		}, {
			code: 'AND ($23),Y',
			result: { A: 0 }
		}],
		'ASL': [{
			code: 'ASL A',
			result: { A: 0 }
		}, {
			code: 'ASL $23',
			result: { A: 0 }
		}, {
			code: 'ASL $23,X',
			result: { A: 0 }
		}, {
			code: 'ASL $2345',
			result: { A: 0 }
		}, {
			code: 'ASL $2345,X',
			result: { A: 0 }
		}]
	}

	beforeEach(() => {
		jasmine.addMatchers(c64Test.CustomMatchers)
	})

	describe('emulator', () => {
		Object.keys(specs).forEach((text) => {
			describe(`${text}:`, () => {
				const entries = specs[text]

				entries.forEach(({ code, result }) => {
					it(code, () => {
						const actualResult = execute(code)
						expect(actualResult).toEqualSubset(result)
					})
				})
			})
		})
	})
})()