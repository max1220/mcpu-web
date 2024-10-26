# MCPU instruction set

The MCPU instruction set is designed to be simple.

There are only 2 things this instruction set is concerned with:
Encoding immediate values and moving data between functions/registers on the `BUS`.

The instruction set is has two instruction formats, the `IMM` format and the `MOV/CMOV` format.

Moving data between functions/registers using `MOV`/`CMOV` is completely orthogonal:
All sources can be combined with all targets.



## IMM instruction

|       128 |   64 |   32 |   16 |    8 |    4 |    2 |    1 |
| --------- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| IS_IMM(1) | IMM7 | IMM7 | IMM7 | IMM7 | IMM7 | IMM7 | IMM7 |

If the `IS_IMM` bit in the op-code is set, the instruction is an 
immediate value instruction.
The lower bits encode a 7-bit immediate value(`IMM7`) that is
loaded or shifted into the `SRG_IMM` shift register:

When a `IMM` instruction is encountered without a preceding `IMM` instruction,
the value is *loaded* into the `SRG_IMM`:<br>
The upper bits are set to 0 and the lower bits set to `IMM7`.

When an `IMM` instruction is encountered and the previous instruction
was an `IMM` instruction the value is *shifted* in instead:<br>
The value in `SRG_IMM` is left-shifted 7 bits and the lower 7 bits are set to `IMM7`.

This way large or small immediate values can be reasonable efficiently encoded.



## MOV/CMOV instruction

|        128 |      64 |     32 |     16 |      8 |      4 |      2 |      1 |
| ---------- | ------- | ------ | ------ | ------ | ------ | ------ | ------ |
|  IS_IMM(0) | IS_COND | TARGET | TARGET | TARGET | SOURCE | SOURCE | SOURCE | 

If the `IS_IMM` bit is not set in the op-code then the instruction is an move operation(`MOV`/`CMOV`).

`MOV` instructions copy a value from a `SOURCE` to a `TARGET` via the `BUS`.

If the `IS_COND` bit is set the instruction is conditional, and target is only
written to if the ALU test output is true(conditional move, `CMOV`).

The instruction `MOV PC PC` is used as a halt-instruction(forever runs the same instruction).



### Sources

Bits 0-2 in the op-code

| Bits | I | Name | Description |
| ---- | - | ---- | ----------- |
| 000  | 0 | PC   | Read Program counter
| 001  | 1 | ADDR | Read Address register
| 010  | 2 | RAM  | Read `RAM` at `REG_ADDR`
| 011  | 3 | IMM  | Read value in `SRG_IMM`
| 100  | 4 | ALU  | Read ALU arithmeric result
| 101  | 5 | I    | Read I
| 110  | 6 | J    | Read J
| 111  | 7 | K    | Read K



### Targets

Bits 3-5 in the op-code

| Bits | I | Name  | Description |
| ---- | - | ----- | ----------- |
| 000  | 0 | PC    | Write Program counter
| 001  | 1 | ADDR  | Write Address register
| 010  | 2 | RAM   | Write `RAM` at `REG_ADDR`
| 011  | 3 | ALU_A | Write ALU_A register
| 100  | 4 | ALU_B | Write ALU_B register
| 101  | 5 | I     | Write I
| 110  | 6 | J     | Write J
| 111  | 7 | K     | Write K



# Example/Pseudo instructions

Here are some common instructions explained.



## Load an immediate value < 128

Loading a small immediate value is easy, just add 128 to value to
add the `IS_IMM` bit to the byte value.

For example, loading the immediate value 42(`IMM 42` in miniasm) can be encoded
using a byte value of 169(0xaa).



## Loading an immediate value >= 128

Loading a larger immediate value is performed by splitting the value into
segments of 7 bits, and adding the `IS_IMM` bit.

For example, to load this 32-bit binary number(27799284):

```
0b00000001101010000010111011110100
```

First split into 7-bit segments, from right to left:

```
0000000_0001101_0100000_1011101_1110100
```

Now, from left to right, starting with the first non-zero segment,
add the `IS_IMM` bit to each segment to form the op-codes:


```
IS_IMM bit
|
v
10001101 = 141(0x8d)
 ^~~~~~>
 |
 segment bits

10100000 = 160 (0xa0)
11011101 = 221 (0xdd)
11110100 = 244 (0xf4)

```

So to the immediate value `27799284` is loaded by the instructions `8d` `a0` `dd` `f4`.



## Move operations

All non-immediate value instructions are move instructions in some way,
and moves are completely orthogonal:

Any value from a sources can be written to any target,
and all operations move a value from a source to a target via the `BUS`.

A move operation is encoded by the source index in the bits 0-2,
and the target index in the bits 3-5.

```
op_code = source_index + target_index * 8
```

For example, to load the program counter from an immediate value("jump"):
```
MOV IMM PC
// source = 3(IMM)
// target = 0(PC)
// op_code = 0x03
```



## Conditional move

Any move operation can be turned into a conditional move by adding the `IS_COND` bit.

If the `IS_COND` bit the target is only written to if the `ALU_TEST` output is set.

Because of this you typically need to load a comparison operation
into the `SRG_IMM` register for the ALU operation in the instruction before the
conditional move. See [# Using the ALU](#using-the-alu).

```
op_code = 64 + source_index + target_index * 8
```



## Using the ALU

To perform any useful computation the ALU is needed.

The ALU has two internal registers, `ALU_A` and `ALU_B` that
can be written from the `BUS`.

The ALU operation is encoded in the `SRG_IMM` register when reading from
the ALU as a source on the `BUS`

The `ALU_A` value is always used unmodified in the ALU operation,
and the effective value of `ALU_B` in an operation(test/arithmetric)
might be modified by part of the ALU operation: It can be used unmodified,
replaced by the `SRG_IMM` value(without the leading 7 bits used as ALU operation),
or the `ALU_B` value left or right shifted by 1.

Then the unmodified `ALU_A` and the possibly modified `ALU_B` values are used in the
actual ALU test and arithmetic operation.

When reading the ALU value on the `BUS`, the current `SRG_IMM` value is used as the ALU
operation. The lower 7 bits encode the ALU operation, and the upper bits
can be used as an immediate value that replaces the `ALU_B` value(see above).

The complete documentation for the ALU is [ALU.md](ALU.md).

Here is an example that loads 0x2a and 0x50f into `ALU_A` and `ALU_B`,
loads the `ADD` operataion, then stores the ALU result(0x539) in RAM at address 0x45.

```
IMM 0x2a
MOV IMM ALU_A // load ALU_A value
IMM 0x50f
MOV IMM ALU_B // load ALU B value
IMM 0x45
MOV IMM ADDR // load addr for later storing the result in RAM
IMM 0 // setup ALU add operation
MOV ALU RAM // set RAM[ADDR=0x45] to ALU(0x2a ADD 0x50f)=0x539
```



## Jumps

Since the program counter can be written with a value from any source, jumps
can easily be performed by moving the jump target addresses from
immediate values, RAM, or the ALU.

```
IMM <jump address>
MOV IMM PC
```



## Branches

Branches work exactly like jumps, except that the `IS_COND` bit is set in the instruction.

Because the ALU is needed to perform the comparison the `IMM` value can't be
directly used, and is temporarily stored in the `ADDR` register in this example:

```
// setting up ALU operands ALU_A and ALU_B omitted for brevity
IMOV <branch target address> ADDR
ALU <alu comparison operation>
CMOV ADDR PC
```



## Assembler shortcuts

Not technically a part of the instruction set, but the miniasm assembler syntax
supports some additional syntactic sugar to make writing assembly programs more
efficient.

For example, while the `IMM` instruction format supports only 7 bits,
if it is immediately followed by other `IMM` instructions it obviously
encodes a larger integer value which can directly be written as an that larger number.



### IMM

The `IMM` assembler instruction might generate more than one `IMM` bytecode
instruction to encode a larger immediate value.

```
IMM <large immediate value> // turns to multiple IMM bytecode instructions
```



### IMOV

There is also the `IMOV` assembler pseudo-instruction,
whichs is just a shortcut to loading an immediate, then moving from the `IMM` source:

```
IMOV <value> <target>
```

```
IMM <value>
MOV IMM <target>
```



### ALU

To load an ALU operation as an immediate value you can use the `ALU`
pseudo-instruction which encodes the correct `IMM` instruction for the ALU operation:

```
ALU <ALU operation> <b operation> <flags/immediate value>
```

For details on the supported operations, see the ALU documentation.
