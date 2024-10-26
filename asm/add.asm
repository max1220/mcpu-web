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
IMOV 0x12 ADDR
ALU ADD _ _ # setup ALU add A + B operation, no flags/immediate value
MOV ALU RAM
MOV ALU I
