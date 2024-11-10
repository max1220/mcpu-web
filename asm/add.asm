# add.asm
#
# This example adds two numbers from memory, storing the result in memory as well.

# store value 3 to RAM at address 0xa
IMOV 0xa ADDR
IMOV 3 RAM

# store value 2 to RAM at address 0xb
IMOV 0xb ADDR
IMOV 2 RAM

# read RAM at 0xa and 0xb into ALU registers
IMOV 0xa ADDR
MOV RAM ALU_A
IMOV 0xb ADDR
MOV RAM ALU_B

# prepare to store result at 0x12 in RAM
IMOV 0xc ADDR

# setup ALU add A + B operation, no flags/immediate value
ALU ADD _ _ 

# move result to RAM
MOV ALU RAM

# move result to REG_K as well
MOV ALU K
