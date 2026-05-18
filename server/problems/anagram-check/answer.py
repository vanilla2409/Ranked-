def isAnagram(s1, s2):
    return sorted(s1) == sorted(s2)

if __name__ == "__main__":
    import sys
    line = sys.stdin.read().strip()
    if line:
        s1, s2 = line.split()
        print(isAnagram(s1, s2))
