# Simple example on how to use labels, locations and label references

MOV ADDR ADDR # <- NOP used to reserve some space!

# A LABEL notes the current position in the program
: foo
# : is short for LABEL
# You can generate a reference to a label using the IMM_REF instruction.
IMM_REF foo
# This generates an IMM instruction with the label position.

# You can also use a label before it's definition.
# Such labels might require reserving additional space.
IMM_REF bar # perfectly valid, but probably over-allocates space
: bar

# a LOCATION changes the current position in the program to a specified location
# @ is short for LOCATION
@ 0x50

MOV ADDR ADDR # <- NOP used to reserve some space!