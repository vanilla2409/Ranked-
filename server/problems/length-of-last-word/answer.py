def lengthOfLastWord(s):
    words = s.strip().split()
    return len(words[-1]) if words else 0

if __name__ == "__main__":
    import sys
    s = sys.stdin.read().strip()
    print(lengthOfLastWord(s))
