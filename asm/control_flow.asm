# control flow example

# store value 3 to RAM at address 0x10
IMOV 0x10 ADDR
IMOV 3 RAM

# store value 2 to RAM at address 0x11
IMOV 0x11 ADDR
IMOV 2 RAM

# add result of values in RAM at 0x10 and 0x11, store in 0x12
IMOV 0x10 ADDR
MOV RAM ALU_A
IMOV 0x11 ADDR
MOV RAM ALU_B
IMM_REF DID_BRANCH # Load branch target into REG_ADDR
MOV IMM ADDR
ALU A_EQ_B _ _ # setup ALU A == B operation
CMOV ADDR PC # Conditional jump to DID_BRANCH
: NO_BRANCH
IMOV 0xaa I
IMM_REF END # jump to end
MOV IMM PC
: DID_BRANCH
IMOV 0xbb I
: END
MOV PC PC # HALT instruction