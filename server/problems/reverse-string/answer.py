def reverseString(s):
    return s[::-1]

if __name__ == "__main__":
    import sys
    s = sys.stdin.read().strip()
    print(reverseString(s))
