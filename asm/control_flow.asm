# control flow example
# 
# This example sets up a ALU comparison from RAM values,
# and then conditionally jumps(branches) to a target address.

# store value 3 to RAM at address 0xa
IMOV 0xa ADDR
IMOV 3 RAM

# store value 2 to RAM at address 0xb
IMOV 0xb ADDR
IMOV 2 RAM

# load comparison values from RAM at 0xa and 0xb into ALU registers
IMOV 0xa ADDR
MOV RAM ALU_A
IMOV 0xb ADDR
MOV RAM ALU_B

# load branch target into ADDR
IMM_REF DID_BRANCH
MOV IMM ADDR

# setup ALU A == B operation
ALU A_EQ_B _ _ 

# conditional jump to DID_BRANCH if ALU operation returns true
CMOV ADDR PC

# falling through means no branch ocured
: NO_BRANCH
# store 0xaa in K for debugging
IMOV 0xaa K

# jump to end
IMM_REF END
MOV IMM PC

# this location can only be reached by branching
: DID_BRANCH
# store 0xbb in K for debugging
IMOV 0xbb K
# falls through to end

: END
# HALT instruction
MOV PC PC 
