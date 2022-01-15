file = open('woordlijst.txt')

for line in file:
    line = line.strip()
    print(line)

