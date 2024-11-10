# Small screen demo
# writing to screen currently is
# just writing to REG_K.
# MOV K K will show the
# current backbuffer(NYI in Minecraft).
# Data is scrolled in from the left side,
# so the last letters are written first
# (reverse order)

# prepare constants(shortcuts)
IMOV 0 J
IMOV 0x7f I

# Print "!"
MOV J K
IMOV 0x7d K

# Print "D"
MOV J K
IMOV 0x3e K
IMOV 0x41 K
MOV I K
MOV J K

# Print "L"
IMOV 0x01 K
MOV IMM K
MOV I K
MOV J K

# Print "R"
IMOV 0x2f K
IMOV 0x50 K
MOV I K
MOV J K

# Print "O"
IMOV 0x3e K
IMOV 0x41 K
IMOV 0x3e K
MOV J K

# Print "W"
MOV I K
IMOV 0x01 K
MOV I K
IMOV 0x01 K
MOV I K
MOV J K

# Print space
MOV J K
MOV J K

# Print "O"
IMOV 0x3e K
IMOV 0x41 K
IMOV 0x3e K
MOV J K

# Print "L"
IMOV 0x01 K
MOV IMM K
MOV I K
MOV J K

# Print "L"
IMOV 0x01 K
MOV IMM K
MOV I K
MOV J K

# Print "E"
IMOV 0x51 K
MOV IMM K
MOV I K
MOV J K

# Print "H"
MOV I K
IMOV 0x10 K
MOV I K
MOV J K

# Flip buffers
MOV K K