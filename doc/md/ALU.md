# ALU

This page describes the ALU used by the MCPU.

The ALU has two registers on the `BUS`, called
`ALU_A` and `ALU_B`.

The values from those registers are used by the ALU
to calculate two values: The ALU Arithmetic result and
the ALU test flag output.

The ALU Arithmetic result can be read on the data bus,
while the ALU test flag is used in conditional instructions.



## ALU operations

|   64 |   32 |   16 |    8 |    4 |    2 |    1 |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| B_OP | B_OP |  CIN |  NEG | A_OP | A_OP | A_OP |


The ALU operation is selected by the lower 7 bits of the 
current immediate value(in `SRG_IMM`), and is split into multiple parts:

`A_OP` (bits 0-2) determines the arithmetic and test ALU operation(see table below).

`NEG` (bit 3) if set signals that the value in B should be negated after the B operation, but before the arithmetic and test operation, and that the `test` output should be negated.

`CIN` (bit 4) if set enables the carry input for the addition operation( ADD does A + B + 1).

`B_OP` (bits 5-6) determines the ALU operation performed on the `ALU_B` value before
the arithmetic and test operation.



### A_OP

bits | Arithmetic | Pseudo-code | Test   | Pseudo-code
---: | ---------: | ----------: | :----- | ----------:
 000 |        ADD |       A + B | A_EQ_Z | A == 0
 001 |        AND |       A & 0 | B_EQ_Z | B == 0
 010 |         OR |       A | B | A_GT_B | A > B
 011 |        XOR |       A ^ B | A_EQ_B | A == B
 100 |          A |           A | A_LT_B | A < B
 101 |          B |           B | B_LO   | B[0]
 110 |         X* |          X* | B_HI   | B[31]
 111 |         Y* |          Y* | SENSE  | sense*

( * `X`,`Y` and `sense` are just external inputs to the ALU )



### B_OP

bits | Pseudo-code
---: | -----------
  00 | B
  01 | ALU_IMM*
  10 | B << 1
  11 | B >> 1

( * `ALU_IMM` refers to the bits not included in the ALU operation, bits 7-* )